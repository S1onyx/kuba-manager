import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import socket from '../socket.js';
import useSocketConnection from '../hooks/useSocketConnection.js';
import useAudioPlayback from '../hooks/useAudioPlayback.js';
import useAudioDevices from '../hooks/useAudioDevices.js';
import useEventLog from '../hooks/useEventLog.js';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const { connected } = useSocketConnection();

  const {
    audioElementRef,
    audioReady,
    setAudioReady,
    playbackError,
    setPlaybackError,
    enqueuePlayback,
    initializeAudioChain
  } = useAudioPlayback();

  const {
    audioDevices,
    selectedDeviceId,
    deviceError,
    setDeviceError,
    refreshAudioOutputs,
    selectDevice,
    applyCurrentDevice
  } = useAudioDevices(audioElementRef);

  const { events, addEvent, addSystemEvent } = useEventLog();

  const handleEnableAudio = useCallback(async () => {
    await initializeAudioChain();
    setDeviceError('');
    setPlaybackError('');
    await refreshAudioOutputs();
    await applyCurrentDevice();
    setAudioReady(true);
  }, [initializeAudioChain, refreshAudioOutputs, applyCurrentDevice, setAudioReady, setDeviceError, setPlaybackError]);

  useEffect(() => {
    const handleAudioPlay = (payload) => {
      addEvent(payload);
      enqueuePlayback(payload);
    };
    const handleAudioReady = (payload) => {
      if (payload?.timestamp) {
        addSystemEvent(payload.timestamp);
      }
    };

    socket.on('audio:play', handleAudioPlay);
    socket.on('audio:ready', handleAudioReady);

    return () => {
      socket.off('audio:play', handleAudioPlay);
      socket.off('audio:ready', handleAudioReady);
    };
  }, [addEvent, addSystemEvent, enqueuePlayback]);

  useEffect(() => {
    if (!audioReady) {
      return;
    }
    refreshAudioOutputs();
  }, [audioReady, refreshAudioOutputs]);

  const value = useMemo(
    () => ({
      connection: { connected },
      playback: {
        audioReady,
        playbackError,
        enableAudio: handleEnableAudio
      },
      devices: {
        audioDevices,
        selectedDeviceId,
        deviceError,
        selectDevice
      },
      events: {
        list: events
      },
      media: {
        audioElementRef
      }
    }),
    [
      connected,
      audioReady,
      playbackError,
      handleEnableAudio,
      audioDevices,
      selectedDeviceId,
      deviceError,
      selectDevice,
      events,
      audioElementRef
    ]
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudioApp() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioApp must be used within an AudioProvider');
  }
  return context;
}
