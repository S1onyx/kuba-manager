import { useCallback, useEffect, useState } from 'react';
import {
  assignAudioTriggerFile,
  deleteAudioLibraryFile,
  fetchAudioLibrary,
  fetchAudioTriggers,
  playAudioLibraryFile,
  playAudioTriggerPreview,
  updateAudioTrigger,
  uploadAudioLibraryFile,
  uploadAudioTriggerFile
} from '../utils/api.js';

export default function useAudioManager({ updateMessage }) {
  const [audioTriggers, setAudioTriggers] = useState([]);
  const [audioLibrary, setAudioLibrary] = useState([]);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [audioTriggerBusy, setAudioTriggerBusy] = useState({});
  const [audioUploadBusy, setAudioUploadBusy] = useState({});
  const [audioManualBusy, setAudioManualBusy] = useState({});
  const [audioTriggerLabels, setAudioTriggerLabels] = useState({});
  const [audioLibraryUploadLabel, setAudioLibraryUploadLabel] = useState('');

  const loadAudioData = useCallback(async () => {
    setAudioLoading(true);
    setAudioError('');
    try {
      const [triggersResponse, libraryResponse] = await Promise.all([
        fetchAudioTriggers(),
        fetchAudioLibrary()
      ]);
      setAudioTriggers(triggersResponse?.triggers ?? []);
      setAudioLibrary(libraryResponse?.files ?? []);
    } catch (err) {
      console.error('Audiodaten konnten nicht geladen werden.', err);
      setAudioError('Audiodaten konnten nicht geladen werden.');
    } finally {
      setAudioLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAudioData();
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
        updateMessage('info', nextState ? 'Sound aktiviert.' : 'Sound deaktiviert.');
      } catch (err) {
        console.error('Audio-Trigger konnte nicht aktualisiert werden.', err);
        updateMessage('error', 'Audio-Trigger konnte nicht aktualisiert werden.');
      } finally {
        setAudioTriggerBusy((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [loadAudioData, updateMessage]
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
        updateMessage('info', 'Audiodatei gespeichert.');
      } catch (err) {
        console.error('Audiodatei konnte nicht gespeichert werden.', err);
        updateMessage('error', 'Audiodatei konnte nicht gespeichert werden.');
      } finally {
        setAudioUploadBusy((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [audioTriggerLabels, loadAudioData, updateMessage]
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
        updateMessage('info', 'Audiodatei verknüpft.');
      } catch (err) {
        console.error('Audiodatei konnte nicht verknüpft werden.', err);
        updateMessage('error', 'Audiodatei konnte nicht verknüpft werden.');
      } finally {
        setAudioTriggerBusy((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [loadAudioData, updateMessage]
  );

  const handleAudioTriggerClear = useCallback(
    async (key) => {
      setAudioTriggerBusy((prev) => ({ ...prev, [key]: true }));
      try {
        await assignAudioTriggerFile(key, null);
        await loadAudioData();
        updateMessage('info', 'Soundzuordnung entfernt.');
      } catch (err) {
        console.error('Soundzuordnung konnte nicht entfernt werden.', err);
        updateMessage('error', 'Soundzuordnung konnte nicht entfernt werden.');
      } finally {
        setAudioTriggerBusy((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [loadAudioData, updateMessage]
  );

  const handleAudioTriggerPreview = useCallback(
    async (key) => {
      setAudioTriggerBusy((prev) => ({ ...prev, [key]: true }));
      try {
        await playAudioTriggerPreview(key);
        updateMessage('info', 'Sound ausgelöst.');
      } catch (err) {
        console.error('Sound konnte nicht abgespielt werden.', err);
        updateMessage('error', 'Sound konnte nicht abgespielt werden.');
      } finally {
        setAudioTriggerBusy((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [updateMessage]
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
        updateMessage('info', 'Audiodatei hinzugefügt.');
      } catch (err) {
        console.error('Audiodatei konnte nicht hochgeladen werden.', err);
        updateMessage('error', 'Audiodatei konnte nicht hochgeladen werden.');
      } finally {
        setAudioLoading(false);
      }
    },
    [audioLibraryUploadLabel, loadAudioData, updateMessage]
  );

  const handleAudioLibraryDelete = useCallback(
    async (fileId) => {
      setAudioManualBusy((prev) => ({ ...prev, [fileId]: true }));
      try {
        await deleteAudioLibraryFile(fileId);
        await loadAudioData();
        updateMessage('info', 'Audiodatei gelöscht.');
      } catch (err) {
        console.error('Audiodatei konnte nicht gelöscht werden.', err);
        updateMessage('error', 'Audiodatei konnte nicht gelöscht werden.');
      } finally {
        setAudioManualBusy((prev) => {
          const next = { ...prev };
          delete next[fileId];
          return next;
        });
      }
    },
    [loadAudioData, updateMessage]
  );

  const handleAudioLibraryPlay = useCallback(
    async (fileId) => {
      setAudioManualBusy((prev) => ({ ...prev, [fileId]: true }));
      try {
        await playAudioLibraryFile(fileId);
        updateMessage('info', 'Sound ausgelöst.');
      } catch (err) {
        console.error('Sound konnte nicht ausgelöst werden.', err);
        updateMessage('error', 'Sound konnte nicht ausgelöst werden.');
      } finally {
        setAudioManualBusy((prev) => {
          const next = { ...prev };
          delete next[fileId];
          return next;
        });
      }
    },
    [updateMessage]
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
    return `Sound #${file.id}`;
  }, []);

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
    describeAudioFile
  };
}
