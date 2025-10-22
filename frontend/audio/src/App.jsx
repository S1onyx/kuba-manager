import { useCallback, useEffect, useRef, useState } from 'react';
import socket from './socket.js';
import { BACKEND_URL } from './config.js';
import './styles.css';

function describeAudioFile(file) {
  if (!file) {
    return '';
  }
  if (file.label && file.label.trim()) {
    return file.label.trim();
  }
  if (file.original_name) {
    return file.original_name;
  }
  return `Sound #${file.id ?? ''}`;
}

export default function App() {
  const [connected, setConnected] = useState(socket.connected);
  const [audioReady, setAudioReady] = useState(false);
  const [eventLog, setEventLog] = useState([]);
  const [playbackError, setPlaybackError] = useState('');
  const [deviceError, setDeviceError] = useState('');
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('default');

  const audioElementRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioReadyRef = useRef(false);
  const pendingEventsRef = useRef([]);

  const playAudioPayload = useCallback(async (payload) => {
    const fileUrl = payload?.file?.url;
    if (!fileUrl || !audioElementRef.current) {
      return;
    }

    const resolvedUrl = fileUrl.startsWith('http') ? fileUrl : `${BACKEND_URL}${fileUrl}`;
    const audioEl = audioElementRef.current;

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
      if (!audioReadyRef.current) {
        pendingEventsRef.current.push(payload);
        return;
      }
      playAudioPayload(payload);
    },
    [playAudioPayload]
  );

  useEffect(() => {
    audioReadyRef.current = audioReady;
    if (audioReady) {
      const queued = pendingEventsRef.current.slice();
      pendingEventsRef.current = [];
      queued.forEach((event, index) => {
        setTimeout(() => playAudioPayload(event), index * 120);
      });
    }
  }, [audioReady, playAudioPayload]);

  useEffect(() => {
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    const handleAudioPlay = (payload) => {
      setEventLog((prev) => [payload, ...prev].slice(0, 15));
      enqueuePlayback(payload);
    };
    const handleReady = (payload) => {
      if (payload?.timestamp) {
        setEventLog((prev) => [
          {
            key: 'audio_ready',
            triggeredAt: payload.timestamp,
            trigger: { label: 'Audio verbunden' },
            file: null,
            origin: 'system'
          },
          ...prev
        ].slice(0, 15));
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('audio:play', handleAudioPlay);
    socket.on('audio:ready', handleReady);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('audio:play', handleAudioPlay);
      socket.off('audio:ready', handleReady);
    };
  }, [enqueuePlayback]);

  const refreshAudioOutputs = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const outputs = devices.filter((device) => device.kind === 'audiooutput');
      setAudioDevices(outputs);
    } catch (error) {
      console.warn('Audioausgabegeräte konnten nicht ermittelt werden:', error);
      setDeviceError('Audioausgabegeräte konnten nicht ermittelt werden.');
    }
  }, []);

  const handleDeviceChange = useCallback(async (deviceId) => {
    setDeviceError('');
    setSelectedDeviceId(deviceId);

    const audioEl = audioElementRef.current;
    if (!audioEl) {
      return;
    }

    if (typeof audioEl.setSinkId !== 'function') {
      if (deviceId !== 'default') {
        setDeviceError('Ausgabegeräte-Auswahl wird von diesem Browser nicht unterstützt.');
      }
      return;
    }

    try {
      await audioEl.setSinkId(deviceId);
    } catch (error) {
      console.error('Ausgabegerät konnte nicht gesetzt werden:', error);
      setDeviceError('Ausgabegerät konnte nicht gesetzt werden.');
    }
  }, []);

  const handleEnableAudio = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass && !audioContextRef.current) {
          audioContextRef.current = new AudioContextClass();
        }
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
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

    await refreshAudioOutputs();
    await handleDeviceChange(selectedDeviceId);
    setAudioReady(true);
    setPlaybackError('');
  }, [handleDeviceChange, refreshAudioOutputs, selectedDeviceId]);

  useEffect(() => {
    if (audioReady) {
      refreshAudioOutputs();
    }
  }, [audioReady, refreshAudioOutputs]);

  useEffect(() => {
    if (audioDevices.length === 0) {
      return;
    }
    if (selectedDeviceId !== 'default' && !audioDevices.some((device) => device.deviceId === selectedDeviceId)) {
      setSelectedDeviceId('default');
    }
  }, [audioDevices, selectedDeviceId]);

  const renderEventRow = (event) => {
    const label = event.trigger?.label || event.key || (event.origin === 'manual' ? 'Manuell' : 'Ereignis');
    const fileLabel = describeAudioFile(event.file);
    const timeLabel = event.triggeredAt
      ? new Date(event.triggeredAt).toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      : '';

    return (
      <div key={`${event.eventId ?? event.triggeredAt ?? Math.random()}`} className="event-row">
        <strong>{label}</strong>
        {fileLabel ? <span>{fileLabel}</span> : null}
        {timeLabel ? <span>{timeLabel}</span> : null}
      </div>
    );
  };

  return (
    <div className="app-shell">
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'grid', gap: '0.35rem' }}>
          <h1 style={{ margin: 0, fontSize: '2.4rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Kunstrad Basketball – Audio
          </h1>
          <p style={{ margin: 0, opacity: 0.78 }}>
            Diese Seite spielt automatisch alle konfigurierten Spielsounds ab. Bitte Lautsprecher eingeschaltet lassen.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span>
            <span
              className="status-dot"
              style={{ background: connected ? '#4caf50' : '#f44336' }}
            />
            {connected ? 'Verbunden' : 'Nicht verbunden'}
          </span>
          <span>
            <span
              className="status-dot"
              style={{ background: audioReady ? '#4caf50' : '#ff9800' }}
            />
            {audioReady ? 'Audio aktiviert' : 'Audio deaktiviert'}
          </span>
          {audioDevices.length > 0 ? (
            <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.9rem' }}>
              Ausgabegerät
              <select
                value={selectedDeviceId}
                onChange={(event) => handleDeviceChange(event.target.value)}
                disabled={!audioReady}
                style={{ padding: '0.35rem 0.6rem', borderRadius: '0.35rem' }}
              >
                <option value="default">Systemstandard</option>
                {audioDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Gerät ${device.deviceId}`}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button type="button" className="button" onClick={handleEnableAudio} disabled={audioReady}>
            {audioReady ? 'Audio aktiv' : 'Audio aktivieren'}
          </button>
        </div>
        {playbackError ? (
          <p style={{ margin: 0, color: '#ffb3b3' }}>{playbackError}</p>
        ) : null}
        {deviceError ? (
          <p style={{ margin: 0, color: '#ffb3b3' }}>{deviceError}</p>
        ) : null}
      </header>

      <section className="card">
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.35rem', letterSpacing: '0.06em' }}>Letzte Ereignisse</h2>
          <span style={{ fontSize: '0.9rem', opacity: 0.75 }}>
            Eingehende Sounds werden automatisch nacheinander wiedergegeben.
          </span>
        </header>
        {eventLog.length === 0 ? (
          <p style={{ margin: 0, opacity: 0.7 }}>Noch keine Sound-Ereignisse empfangen.</p>
        ) : (
          <div className="event-log">
            {eventLog.map((event) => renderEventRow(event))}
          </div>
        )}
      </section>
      <audio ref={audioElementRef} preload="auto" style={{ display: 'none' }} crossOrigin="anonymous" />
    </div>
  );
}
