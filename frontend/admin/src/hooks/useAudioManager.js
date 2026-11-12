import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveMediaUrl } from '../config.js';
import { measureAudioUrl } from '../utils/loudness.js';
import {
  assignAudioTriggerFile,
  saveAudioLoudness,
  deleteAudioLibraryFile,
  fetchAudioLibrary,
  fetchAudioTriggers,
  fetchTimerCueSettings,
  saveTimerCueSettings,
  playAudioLibraryFile,
  playAudioTriggerPreview,
  updateAudioTrigger,
  uploadAudioLibraryFile,
  uploadAudioTriggerFile
} from '../utils/api.js';
import { formatApiError } from '../utils/apiError.js';

const SILENT_LUFS = -70;
const SILENT_PEAK_DB = -100;
const MAX_PEAK_DB = 6;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function useAudioManager({ updateMessage, reloadDependencies = [] }) {
  const { t } = useTranslation();
  const [audioTriggers, setAudioTriggers] = useState([]);
  const [audioLibrary, setAudioLibrary] = useState([]);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [audioTriggerBusy, setAudioTriggerBusy] = useState({});
  const [audioUploadBusy, setAudioUploadBusy] = useState({});
  const [audioManualBusy, setAudioManualBusy] = useState({});
  const [audioTriggerLabels, setAudioTriggerLabels] = useState({});
  const [audioLibraryUploadLabel, setAudioLibraryUploadLabel] = useState('');
  const [timerCueSettings, setTimerCueSettings] = useState({ warningSeconds: 15, countdownFrom: 5, halftimeAutoStart: true });
  const [timerCueBusy, setTimerCueBusy] = useState(false);

  const loadAudioData = useCallback(
    async (showLoader = false) => {
      if (showLoader) {
        setAudioLoading(true);
      }
      setAudioError('');
      try {
        const [triggersResponse, libraryResponse, cueSettings] = await Promise.all([
          fetchAudioTriggers(),
          fetchAudioLibrary(),
          fetchTimerCueSettings()
        ]);
        setAudioTriggers(triggersResponse?.triggers ?? []);
        setAudioLibrary(libraryResponse?.files ?? []);
        if (cueSettings) setTimerCueSettings(cueSettings);
      } catch (err) {
        console.error('Audiodaten konnten nicht geladen werden.', err);
        setAudioError(formatApiError(err, t, 'feedback.audioLoadFailed'));
      } finally {
        if (showLoader) {
          setAudioLoading(false);
        }
      }
    },
    [t]
  );

  useEffect(() => {
    loadAudioData(true);
  }, [loadAudioData, ...reloadDependencies]);

  // Lautheit fehlender Dateien automatisch messen (neue Uploads, Korbhymnen, Altbestand) – nacheinander, einmal pro Sitzung.
  const measuringRef = useRef(false);
  const attemptedRef = useRef(new Set());
  const [loudnessProgress, setLoudnessProgress] = useState(null);

  const measureLoudnessFor = useCallback(
    async (files) => {
      if (measuringRef.current || files.length === 0) return;
      measuringRef.current = true;
      setLoudnessProgress({ done: 0, total: files.length });
      for (const [index, file] of files.entries()) {
        attemptedRef.current.add(file.id);
        try {
          const { lufs, peakDb } = await measureAudioUrl(resolveMediaUrl(file.url));
          // Stille: als leisester gültiger Wert speichern, damit nicht endlos neu gemessen wird.
          await saveAudioLoudness(file.id, {
            lufs: clamp(lufs ?? SILENT_LUFS, SILENT_LUFS, 0),
            peakDb: clamp(peakDb ?? SILENT_PEAK_DB, SILENT_PEAK_DB, MAX_PEAK_DB)
          });
        } catch (err) {
          console.error('Lautheit konnte nicht gemessen werden.', err);
          updateMessage('error', t('feedback.loudnessFailed', { name: file.label || file.original_name }));
        }
        setLoudnessProgress({ done: index + 1, total: files.length });
      }
      measuringRef.current = false;
      setLoudnessProgress(null);
      await loadAudioData();
    },
    [loadAudioData, updateMessage, t]
  );

  useEffect(() => {
    const missing = audioLibrary.filter((file) => file.loudness_lufs == null && !attemptedRef.current.has(file.id));
    measureLoudnessFor(missing);
  }, [audioLibrary, measureLoudnessFor]);

  const handleRemeasureLoudness = useCallback(() => {
    attemptedRef.current.clear();
    measureLoudnessFor(audioLibrary);
  }, [audioLibrary, measureLoudnessFor]);

  const handleAudioTriggerLabelChange = useCallback((key, value) => {
    setAudioTriggerLabels((prev) => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleAudioTriggerToggle = useCallback(
    async (key, nextState) => {
      setAudioTriggerBusy((prev) => ({ ...prev, [key]: true }));
      try {
        await updateAudioTrigger(key, { isActive: nextState });
        await loadAudioData();
        updateMessage('info', nextState ? t('feedback.soundEnabled') : t('feedback.soundDisabled'));
      } catch (err) {
        console.error('Audio-Trigger konnte nicht aktualisiert werden.', err);
        updateMessage('error', formatApiError(err, t, 'feedback.triggerUpdateFailed'));
      } finally {
        setAudioTriggerBusy((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [loadAudioData, updateMessage, t]
  );

  const handleAudioTriggerUpload = useCallback(
    async (key, file) => {
      if (!file) {
        return;
      }
      setAudioUploadBusy((prev) => ({ ...prev, [key]: true }));
      try {
        const label = (audioTriggerLabels[key] ?? '').trim();
        await uploadAudioTriggerFile(key, file, label || undefined);
        setAudioTriggerLabels((prev) => ({ ...prev, [key]: '' }));
        await loadAudioData();
        updateMessage('info', t('feedback.audioSaved'));
      } catch (err) {
        console.error('Audiodatei konnte nicht gespeichert werden.', err);
        updateMessage('error', formatApiError(err, t, 'feedback.audioSaveFailed'));
      } finally {
        setAudioUploadBusy((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [audioTriggerLabels, loadAudioData, updateMessage, t]
  );

  const handleAudioTriggerAssign = useCallback(
    async (key, fileId) => {
      if (!fileId) {
        return;
      }
      setAudioTriggerBusy((prev) => ({ ...prev, [key]: true }));
      const numeric = Number(fileId);
      try {
        await assignAudioTriggerFile(key, Number.isFinite(numeric) ? numeric : null);
        await loadAudioData();
        updateMessage('info', t('feedback.audioAssigned'));
      } catch (err) {
        console.error('Audiodatei konnte nicht verknüpft werden.', err);
        updateMessage('error', formatApiError(err, t, 'feedback.audioAssignFailed'));
      } finally {
        setAudioTriggerBusy((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [loadAudioData, updateMessage, t]
  );

  const handleAudioTriggerClear = useCallback(
    async (key) => {
      setAudioTriggerBusy((prev) => ({ ...prev, [key]: true }));
      try {
        await assignAudioTriggerFile(key, null);
        await loadAudioData();
        updateMessage('info', t('feedback.assignmentRemoved'));
      } catch (err) {
        console.error('Soundzuordnung konnte nicht entfernt werden.', err);
        updateMessage('error', formatApiError(err, t, 'feedback.assignmentRemoveFailed'));
      } finally {
        setAudioTriggerBusy((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [loadAudioData, updateMessage, t]
  );

  const handleAudioTriggerPreview = useCallback(
    async (key) => {
      setAudioTriggerBusy((prev) => ({ ...prev, [key]: true }));
      try {
        await playAudioTriggerPreview(key);
        updateMessage('info', t('feedback.soundPlayed'));
      } catch (err) {
        console.error('Sound konnte nicht abgespielt werden.', err);
        updateMessage('error', formatApiError(err, t, 'feedback.soundPlayFailed'));
      } finally {
        setAudioTriggerBusy((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [updateMessage, t]
  );

  const handleAudioLibraryUpload = useCallback(
    async (file) => {
      if (!file) {
        return;
      }
      setAudioLoading(true);
      try {
        const label = audioLibraryUploadLabel.trim();
        await uploadAudioLibraryFile(file, label || undefined);
        setAudioLibraryUploadLabel('');
        await loadAudioData();
        updateMessage('info', t('feedback.audioUploaded'));
      } catch (err) {
        console.error('Audiodatei konnte nicht hochgeladen werden.', err);
        updateMessage('error', formatApiError(err, t, 'feedback.audioUploadFailed'));
      } finally {
        setAudioLoading(false);
      }
    },
    [audioLibraryUploadLabel, loadAudioData, updateMessage, t]
  );

  const handleAudioLibraryDelete = useCallback(
    async (fileId) => {
      setAudioManualBusy((prev) => ({ ...prev, [fileId]: true }));
      try {
        await deleteAudioLibraryFile(fileId);
        await loadAudioData();
        updateMessage('info', t('feedback.audioDeleted'));
      } catch (err) {
        console.error('Audiodatei konnte nicht gelöscht werden.', err);
        updateMessage('error', formatApiError(err, t, 'feedback.audioDeleteFailed'));
      } finally {
        setAudioManualBusy((prev) => {
          const next = { ...prev };
          delete next[fileId];
          return next;
        });
      }
    },
    [loadAudioData, updateMessage, t]
  );

  const handleAudioLibraryPlay = useCallback(
    async (fileId) => {
      setAudioManualBusy((prev) => ({ ...prev, [fileId]: true }));
      try {
        await playAudioLibraryFile(fileId);
        updateMessage('info', t('feedback.soundPlayed'));
      } catch (err) {
        console.error('Sound konnte nicht ausgelöst werden.', err);
        updateMessage('error', formatApiError(err, t, 'feedback.soundTriggerFailed'));
      } finally {
        setAudioManualBusy((prev) => {
          const next = { ...prev };
          delete next[fileId];
          return next;
        });
      }
    },
    [updateMessage, t]
  );

  const handleTimerCueSave = useCallback(
    async (updates) => {
      setTimerCueBusy(true);
      try {
        const updated = await saveTimerCueSettings(updates);
        if (updated) setTimerCueSettings(updated);
        updateMessage('info', t('feedback.timerCuesSaved'));
      } catch (err) {
        console.error('Timer-Cue-Einstellungen konnten nicht gespeichert werden.', err);
        updateMessage('error', formatApiError(err, t, 'feedback.timerCuesSaveFailed'));
      } finally {
        setTimerCueBusy(false);
      }
    },
    [updateMessage, t]
  );

  const describeAudioFile = useCallback((file) => {
    if (!file) {
      return '';
    }
    if (file.label && file.label.trim()) {
      return file.label.trim();
    }
    if (file.original_name) {
      return file.original_name;
    }
    return t('audio.soundFallback', { id: file.id });
  }, [t]);

  return {
    audioTriggers,
    audioLibrary,
    audioLoading,
    audioError,
    audioTriggerBusy,
    audioUploadBusy,
    audioManualBusy,
    audioTriggerLabels,
    audioLibraryUploadLabel,
    setAudioLibraryUploadLabel,
    timerCueSettings,
    timerCueBusy,
    loadAudioData,
    handleAudioTriggerLabelChange,
    handleAudioTriggerToggle,
    handleAudioTriggerUpload,
    handleAudioTriggerAssign,
    handleAudioTriggerClear,
    handleAudioTriggerPreview,
    handleAudioLibraryUpload,
    handleAudioLibraryDelete,
    handleAudioLibraryPlay,
    handleTimerCueSave,
    loudnessProgress,
    handleRemeasureLoudness,
    describeAudioFile
  };
}
