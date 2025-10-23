import { useAudioApp } from '../../context/AudioContext.jsx';

export default function HiddenAudioElement() {
  const {
    media: { audioElementRef }
  } = useAudioApp();

  return <audio ref={audioElementRef} preload="auto" style={{ display: 'none' }} crossOrigin="anonymous" />;
}
