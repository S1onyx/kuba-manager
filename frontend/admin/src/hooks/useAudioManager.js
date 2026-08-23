import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  assignAudioTriggerFile,
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

export default function useAudioManager({ updateMessage }) {
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
  const [timerCueSettings, setTimerCueSettings] = useState({ warningSeconds: 15, countdownFrom: 5, halftimeAutoStart: false });
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
  }, [loadAudioData]);

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
    describeAudioFile
  };
}
