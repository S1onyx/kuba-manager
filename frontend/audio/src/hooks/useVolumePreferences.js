import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_VOLUME_SETTINGS } from '../constants/volume.js';

const STORAGE_KEY = 'kuba-audio-volume';

function clampVolume(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 1;
  }
  return Math.min(1, Math.max(0, numeric));
}

function mergeWithDefaults(input) {
  const next = { ...DEFAULT_VOLUME_SETTINGS };
  if (!input || typeof input !== 'object') {
    return next;
  }
  Object.keys(DEFAULT_VOLUME_SETTINGS).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      next[key] = clampVolume(input[key]);
    }
  });
  return next;
}

export default function useVolumePreferences() {
  const [volumeSettings, setVolumeSettings] = useState(DEFAULT_VOLUME_SETTINGS);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      setVolumeSettings(mergeWithDefaults(parsed));
    } catch (error) {
      console.warn('Lautstärke-Einstellungen konnten nicht geladen werden:', error);
    }
  }, []);

  const setVolumeSetting = useCallback((key, value) => {
    setVolumeSettings((prev) => {
      const merged = { ...DEFAULT_VOLUME_SETTINGS, ...prev };
      if (!Object.prototype.hasOwnProperty.call(merged, key)) {
        merged[key] = 1;
      }
      const next = {
        ...merged,
        [key]: clampVolume(value)
      };
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (error) {
          console.warn('Lautstärke-Einstellungen konnten nicht gespeichert werden:', error);
        }
      }
      return next;
    });
  }, []);

  return {
    volumeSettings,
    setVolumeSetting
  };
}
