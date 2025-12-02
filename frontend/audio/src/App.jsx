import AppShell from './components/layout/AppShell.jsx';
import StatusHeader from './components/header/StatusHeader.jsx';
import EventLogSection from './components/events/EventLogSection.jsx';
import HiddenAudioElement from './components/media/HiddenAudioElement.jsx';
import VolumeControls from './components/controls/VolumeControls.jsx';
import { AudioProvider } from './context/AudioContext.jsx';
import './styles.css';

export default function App() {
  return (
    <AudioProvider>
      <AppShell>
        <StatusHeader />
        <VolumeControls />
        <EventLogSection />
        <HiddenAudioElement />
      </AppShell>
    </AudioProvider>
  );
}
