import { useCallback, useEffect, useRef, useState } from 'react';
import { BACKEND_URL } from '../config.js';
import { DEFAULT_VOLUME_SETTINGS } from '../constants/volume.js';

const CATEGORY_DEFAULT = 'events';

function clampVolume(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 1;
  }
  return Math.min(1, Math.max(0, numeric));
}

function resolveCategoryFromPayload(payload) {
  const key = (payload?.key ?? '').toLowerCase();
  if (key.startsWith('score_')) {
    return 'score';
  }
  if (key.startsWith('game_')) {
    return 'game';
  }
  if (!key && payload?.origin === 'manual') {
    return 'manual';
  }
  return CATEGORY_DEFAULT;
}

export default function useAudioPlayback(volumeSettings = DEFAULT_VOLUME_SETTINGS) {
  const audioElementRef = useRef(null);
  const audioContextRef = useRef(null);
  const pendingQueueRef = useRef([]);
  const readyRef = useRef(false);
  const volumeSettingsRef = useRef(DEFAULT_VOLUME_SETTINGS);

  const [audioReady, setAudioReady] = useState(false);
  const [playbackError, setPlaybackError] = useState('');

  useEffect(() => {
    volumeSettingsRef.current = { ...DEFAULT_VOLUME_SETTINGS, ...volumeSettings };
    const audioEl = audioElementRef.current;
    if (audioEl) {
      const currentCategory = audioEl.dataset?.playbackCategory || CATEGORY_DEFAULT;
      const volume = clampVolume(volumeSettingsRef.current[currentCategory] ?? volumeSettingsRef.current[CATEGORY_DEFAULT]);
      audioEl.volume = volume;
    }
  }, [volumeSettings]);

  const playAudioPayload = useCallback(async (payload, categoryOverride = null) => {
    const fileUrl = payload?.file?.url;
    const audioEl = audioElementRef.current;
    if (!fileUrl || !audioEl) {
      return;
    }

    const resolvedUrl = fileUrl.startsWith('http') ? fileUrl : `${BACKEND_URL}${fileUrl}`;

    const category = categoryOverride ?? resolveCategoryFromPayload(payload);
    const volume =
      volumeSettingsRef.current[category] ??
      volumeSettingsRef.current[CATEGORY_DEFAULT] ??
      DEFAULT_VOLUME_SETTINGS[CATEGORY_DEFAULT];

    try {
      audioEl.dataset.playbackCategory = category;
      audioEl.pause();
      audioEl.currentTime = 0;
      audioEl.src = resolvedUrl;
      audioEl.volume = clampVolume(volume);
      await audioEl.play();
      setPlaybackError('');
    } catch (error) {
      console.error('Sound konnte nicht abgespielt werden:', error);
      setPlaybackError('Sound konnte nicht abgespielt werden. Bitte Lautsprecher prüfen.');
    }
  }, []);

  const enqueuePlayback = useCallback(
    (payload) => {
      const category = resolveCategoryFromPayload(payload);
      if (!readyRef.current) {
        pendingQueueRef.current.push({ payload, category });
        return;
      }
      playAudioPayload(payload, category);
    },
    [playAudioPayload]
  );

  useEffect(() => {
    readyRef.current = audioReady;
    if (!audioReady || pendingQueueRef.current.length === 0) {
      return;
    }

    const queued = pendingQueueRef.current.slice();
    pendingQueueRef.current = [];
    queued.forEach(({ payload, category }, index) => {
      setTimeout(() => {
        playAudioPayload(payload, category);
      }, index * 120);
    });
  }, [audioReady, playAudioPayload]);

  const initializeAudioChain = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass && !audioContextRef.current) {
          audioContextRef.current = new AudioContextClass();
        }

        if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume();
        }
      }
    } catch (error) {
      console.warn('AudioContext konnte nicht aktiviert werden:', error);
    }

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (error) {
      console.warn('Aufnahmeberechtigung wurde verweigert oder ist nicht verfügbar:', error);
    }
  }, []);

  return {
    audioElementRef,
    audioReady,
    setAudioReady,
    playbackError,
    setPlaybackError,
    enqueuePlayback,
    initializeAudioChain
  };
}
