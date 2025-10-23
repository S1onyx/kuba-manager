import { useCallback, useEffect, useRef, useState } from 'react';
import { BACKEND_URL } from '../config.js';

export default function useAudioPlayback() {
  const audioElementRef = useRef(null);
  const audioContextRef = useRef(null);
  const pendingQueueRef = useRef([]);
  const readyRef = useRef(false);

  const [audioReady, setAudioReady] = useState(false);
  const [playbackError, setPlaybackError] = useState('');

  const playAudioPayload = useCallback(async (payload) => {
    const fileUrl = payload?.file?.url;
    const audioEl = audioElementRef.current;
    if (!fileUrl || !audioEl) {
      return;
    }

    const resolvedUrl = fileUrl.startsWith('http') ? fileUrl : `${BACKEND_URL}${fileUrl}`;

    try {
      audioEl.pause();
      audioEl.currentTime = 0;
      audioEl.src = resolvedUrl;
      await audioEl.play();
      setPlaybackError('');
    } catch (error) {
      console.error('Sound konnte nicht abgespielt werden:', error);
      setPlaybackError('Sound konnte nicht abgespielt werden. Bitte Lautsprecher prüfen.');
    }
  }, []);

  const enqueuePlayback = useCallback(
    (payload) => {
      if (!readyRef.current) {
        pendingQueueRef.current.push(payload);
        return;
      }
      playAudioPayload(payload);
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
    queued.forEach((event, index) => {
      setTimeout(() => {
        playAudioPayload(event);
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
