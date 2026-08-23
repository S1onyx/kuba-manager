import { useTranslation } from 'react-i18next';
import { useAudioApp } from '../../context/AudioContext.jsx';
import DeviceSelector from '../controls/DeviceSelector.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import StatusIndicator from './StatusIndicator.jsx';

export default function StatusHeader() {
  const { t } = useTranslation();
  const { connection, playback, devices } = useAudioApp();
  const { audioDevices, selectedDeviceId, deviceError, selectDevice } = devices;
  const { audioReady, playbackError, enableAudio } = playback;

  return (
    <header style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      <div style={{ display: 'grid', gap: '0.35rem' }}>
        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(1.5rem, 6vw, 2.4rem)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            overflowWrap: 'break-word'
          }}
        >
          {t('header.title')}
        </h1>
        <p style={{ margin: 0, opacity: 0.78 }}>
          {t('header.subtitle')}
        </p>
      </div>

      <div className="status-header__actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <StatusIndicator
          color={connection.connected ? '#4caf50' : '#f44336'}
          label={connection.connected ? t('status.connected') : t('status.disconnected')}
        />
        <StatusIndicator
          color={audioReady ? '#4caf50' : '#ff9800'}
          label={audioReady ? t('status.audioOn') : t('status.audioOff')}
        />
        <DeviceSelector
          devices={audioDevices}
          value={selectedDeviceId}
          onChange={selectDevice}
          disabled={!audioReady}
        />
        <button type="button" className="button" onClick={enableAudio} disabled={audioReady}>
          {audioReady ? t('status.audioActive') : t('status.enableAudio')}
        </button>
        <LanguageSwitcher />
      </div>

      {playbackError ? <p style={{ margin: 0, color: '#ffb3b3' }}>{playbackError}</p> : null}
      {deviceError ? <p style={{ margin: 0, color: '#ffb3b3' }}>{deviceError}</p> : null}
    </header>
  );
}
