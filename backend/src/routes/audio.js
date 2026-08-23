import express from 'express';
import multer from 'multer';
import {
  listAudioTriggers,
  getAudioTrigger,
  updateTriggerSettings,
  listAudioFiles,
  deleteAudioFile,
  upsertTriggerFileFromUpload,
  storeLibraryUpload,
  getAudioFileById,
  assignFileToTrigger,
  getTimerCueSettings,
  updateTimerCueSettings
} from '../services/index.js';
import { playAudioFileById } from '../audio/dispatcher.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB
  }
});

router.get('/triggers', async (_req, res) => {
  try {
    const triggers = await listAudioTriggers();
    res.json({ triggers });
  } catch (error) {
    console.error('Audio-Trigger konnten nicht geladen werden:', error);
    res.status(500).json({ code: 'AUDIO_TRIGGERS_LOAD_FAILED', message: 'Audio-Trigger konnten nicht geladen werden.' });
  }
});

router.put('/triggers/:key', async (req, res) => {
  const key = String(req.params.key ?? '').trim();
  if (!key) {
    return res.status(400).json({ code: 'INVALID_TRIGGER_KEY', message: 'Ungültiger Trigger-Key.' });
  }

  const { isActive, fileId } = req.body ?? {};
  let normalizedActive;
  if (isActive !== undefined) {
    if (typeof isActive === 'string') {
      normalizedActive = ['true', '1', 'yes', 'on'].includes(isActive.toLowerCase());
    } else {
      normalizedActive = Boolean(isActive);
    }
  }

  try {
    const updated = await updateTriggerSettings(key, {
      isActive: isActive === undefined ? undefined : normalizedActive,
      fileId: fileId === undefined ? undefined : fileId
    });

    if (!updated) {
      return res.status(404).json({ code: 'TRIGGER_NOT_FOUND', message: 'Trigger wurde nicht gefunden.' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Audio-Trigger konnte nicht aktualisiert werden:', error);
    res.status(400).json({ code: 'TRIGGER_UPDATE_FAILED', message: error.message || 'Audio-Trigger konnte nicht aktualisiert werden.' });
  }
});

router.post('/triggers/:key/upload', upload.single('file'), async (req, res) => {
  const key = String(req.params.key ?? '').trim();
  if (!key) {
    return res.status(400).json({ code: 'INVALID_TRIGGER_KEY', message: 'Ungültiger Trigger-Key.' });
  }

  const file = req.file;
  if (!file) {
    return res.status(400).json({ code: 'AUDIO_FILE_REQUIRED', message: 'Bitte eine MP3-Datei hochladen.' });
  }

  try {
    const updated = await upsertTriggerFileFromUpload(key, {
      buffer: file.buffer,
      originalName: file.originalname || 'audio.mp3',
      mimeType: file.mimetype,
      label: req.body?.label ?? null
    });

    res.json(updated);
  } catch (error) {
    console.error('Trigger-Audiodatei konnte nicht gespeichert werden:', error);
    res.status(400).json({ code: 'AUDIO_FILE_SAVE_FAILED', message: error.message || 'Die Audiodatei konnte nicht gespeichert werden.' });
  }
});

router.post('/triggers/:key/play', async (req, res) => {
  const key = String(req.params.key ?? '').trim();
  if (!key) {
    return res.status(400).json({ code: 'INVALID_TRIGGER_KEY', message: 'Ungültiger Trigger-Key.' });
  }

  try {
    const trigger = await getAudioTrigger(key);
    if (!trigger) {
      return res.status(404).json({ code: 'TRIGGER_NOT_FOUND', message: 'Trigger wurde nicht gefunden.' });
    }
    if (!trigger.file) {
      return res.status(400).json({ code: 'TRIGGER_NO_AUDIO_FILE', message: 'Diesem Trigger ist keine Audiodatei zugewiesen.' });
    }

    const payload = await playAudioFileById(
      trigger.file.id,
      { triggerKey: key, manualPreview: true },
      'trigger-preview'
    );
    res.json(payload);
  } catch (error) {
    console.error('Trigger konnte nicht abgespielt werden:', error);
    res.status(500).json({ code: 'TRIGGER_PLAY_FAILED', message: 'Trigger konnte nicht abgespielt werden.' });
  }
});

router.get('/library', async (_req, res) => {
  try {
    const files = await listAudioFiles();
    res.json({ files });
  } catch (error) {
    console.error('Audio-Bibliothek konnte nicht geladen werden:', error);
    res.status(500).json({ code: 'AUDIO_LIBRARY_LOAD_FAILED', message: 'Audio-Bibliothek konnte nicht geladen werden.' });
  }
});

router.post('/library/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ code: 'AUDIO_FILE_REQUIRED', message: 'Bitte eine MP3-Datei hochladen.' });
  }

  try {
    const record = await storeLibraryUpload({
      buffer: file.buffer,
      originalName: file.originalname || 'audio.mp3',
      mimeType: file.mimetype,
      label: req.body?.label ?? null
    });
    res.status(201).json(record);
  } catch (error) {
    console.error('Audiodatei konnte nicht hochgeladen werden:', error);
    res.status(400).json({ code: 'AUDIO_UPLOAD_FAILED', message: error.message || 'Audiodatei konnte nicht hochgeladen werden.' });
  }
});

router.delete('/library/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ code: 'INVALID_AUDIO_ID', message: 'Ungültige Audio-ID.' });
  }

  try {
    const removed = await deleteAudioFile(id);
    if (!removed) {
      return res.status(404).json({ code: 'AUDIO_FILE_NOT_FOUND', message: 'Audiodatei nicht gefunden.' });
    }
    res.status(204).end();
  } catch (error) {
    console.error('Audiodatei konnte nicht gelöscht werden:', error);
    res.status(500).json({ code: 'AUDIO_DELETE_FAILED', message: 'Audiodatei konnte nicht gelöscht werden.' });
  }
});

router.post('/manual/play', async (req, res) => {
  const { fileId } = req.body ?? {};
  const numericId = Number(fileId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return res.status(400).json({ code: 'INVALID_AUDIO_ID', message: 'Ungültige Audio-ID.' });
  }

  try {
    const payload = await playAudioFileById(numericId, { manual: true }, 'manual');
    res.json(payload);
  } catch (error) {
    console.error('Audiodatei konnte nicht abgespielt werden:', error);
    res.status(400).json({ code: 'AUDIO_PLAY_FAILED', message: error.message || 'Audiodatei konnte nicht abgespielt werden.' });
  }
});

router.post('/triggers/:key/assign', async (req, res) => {
  const key = String(req.params.key ?? '').trim();
  const { fileId } = req.body ?? {};
  if (!key) {
    return res.status(400).json({ code: 'INVALID_TRIGGER_KEY', message: 'Ungültiger Trigger-Key.' });
  }

  try {
    const numericId = fileId === null || fileId === undefined ? null : Number(fileId);
    if (numericId !== null && (!Number.isInteger(numericId) || numericId <= 0)) {
      return res.status(400).json({ code: 'INVALID_AUDIO_ID', message: 'Ungültige Audio-ID.' });
    }

    if (numericId !== null) {
      const exists = await getAudioFileById(numericId);
      if (!exists) {
        return res.status(404).json({ code: 'AUDIO_FILE_NOT_FOUND', message: 'Audiodatei nicht gefunden.' });
      }
    }

    const updated = await assignFileToTrigger(key, numericId);
    if (!updated) {
      return res.status(404).json({ code: 'TRIGGER_NOT_FOUND', message: 'Trigger wurde nicht gefunden.' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Audiodatei konnte nicht zugewiesen werden:', error);
    res.status(400).json({ code: 'AUDIO_ASSIGN_FAILED', message: error.message || 'Audiodatei konnte nicht zugewiesen werden.' });
  }
});

router.get('/timer-cues', async (_req, res) => {
  try {
    const settings = await getTimerCueSettings();
    res.json(settings);
  } catch (error) {
    console.error('Timer-Cue-Einstellungen konnten nicht geladen werden:', error);
    res.status(500).json({ code: 'TIMER_CUE_SETTINGS_LOAD_FAILED', message: 'Timer-Cue-Einstellungen konnten nicht geladen werden.' });
  }
});

router.put('/timer-cues', async (req, res) => {
  const { warningSeconds, countdownFrom, halftimeAutoStart } = req.body ?? {};
  try {
    const updated = await updateTimerCueSettings({
      warningSeconds: warningSeconds === undefined ? undefined : Number(warningSeconds),
      countdownFrom: countdownFrom === undefined ? undefined : Number(countdownFrom),
      halftimeAutoStart: halftimeAutoStart === undefined ? undefined : Boolean(halftimeAutoStart)
    });
    res.json(updated);
  } catch (error) {
    console.error('Timer-Cue-Einstellungen konnten nicht gespeichert werden:', error);
    res.status(400).json({ code: 'TIMER_CUE_SETTINGS_SAVE_FAILED', message: error.message || 'Timer-Cue-Einstellungen konnten nicht gespeichert werden.' });
  }
});

export default router;
