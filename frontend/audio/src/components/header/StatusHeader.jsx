import { useAudioApp } from '../../context/AudioContext.jsx';
import DeviceSelector from '../controls/DeviceSelector.jsx';
import StatusIndicator from './StatusIndicator.jsx';

export default function StatusHeader() {
  const { connection, playback, devices } = useAudioApp();
  const { audioDevices, selectedDeviceId, deviceError, selectDevice } = devices;
  const { audioReady, playbackError, enableAudio } = playback;

  return (
    <header style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      <div style={{ display: 'grid', gap: '0.35rem' }}>
        <h1 style={{ margin: 0, fontSize: '2.4rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Kunstrad Basketball – Audio
        </h1>
        <p style={{ margin: 0, opacity: 0.78 }}>
          Diese Seite spielt automatisch alle konfigurierten Spielsounds ab. Bitte Lautsprecher eingeschaltet lassen.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <StatusIndicator
          color={connection.connected ? '#4caf50' : '#f44336'}
          label={connection.connected ? 'Verbunden' : 'Nicht verbunden'}
        />
        <StatusIndicator
          color={audioReady ? '#4caf50' : '#ff9800'}
          label={audioReady ? 'Audio aktiviert' : 'Audio deaktiviert'}
        />
        <DeviceSelector
          devices={audioDevices}
          value={selectedDeviceId}
          onChange={selectDevice}
          disabled={!audioReady}
        />
        <button type="button" className="button" onClick={enableAudio} disabled={audioReady}>
          {audioReady ? 'Audio aktiv' : 'Audio aktivieren'}
        </button>
      </div>

      {playbackError ? <p style={{ margin: 0, color: '#ffb3b3' }}>{playbackError}</p> : null}
      {deviceError ? <p style={{ margin: 0, color: '#ffb3b3' }}>{deviceError}</p> : null}
    </header>
  );
}
