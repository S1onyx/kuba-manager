import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AppShell from './components/layout/AppShell.jsx';
import StatusHeader from './components/header/StatusHeader.jsx';
import EventLogSection from './components/events/EventLogSection.jsx';
import HiddenAudioElement from './components/media/HiddenAudioElement.jsx';
import VolumeControls from './components/controls/VolumeControls.jsx';
import { AudioProvider } from './context/AudioContext.jsx';
import './styles.css';

function DocumentLanguageSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n, i18n.language]);

  return null;
}

export default function App() {
  return (
    <AudioProvider>
      <AppShell>
        <DocumentLanguageSync />
        <StatusHeader />
        <VolumeControls />
        <EventLogSection />
        <HiddenAudioElement />
      </AppShell>
    </AudioProvider>
  );
}
