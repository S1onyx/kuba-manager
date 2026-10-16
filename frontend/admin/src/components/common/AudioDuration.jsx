import { useEffect, useState } from 'react';
import { resolveMediaUrl } from '../../config.js';

export default function AudioDuration({ fileName, path }) {
  const [durationSeconds, setDurationSeconds] = useState(null);

  useEffect(() => {
    const source = path ?? (fileName ? `/media/audio/${encodeURIComponent(fileName)}` : null);
    if (!source) {
      setDurationSeconds(null);
      return undefined;
    }
    const audio = new Audio();
    audio.preload = 'metadata';
    const handleLoaded = () => setDurationSeconds(audio.duration);
    const handleError = () => setDurationSeconds(null);
    audio.addEventListener('loadedmetadata', handleLoaded);
    audio.addEventListener('error', handleError);
    audio.src = resolveMediaUrl(source);
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoaded);
      audio.removeEventListener('error', handleError);
      audio.src = '';
    };
  }, [fileName, path]);

  if (!Number.isFinite(durationSeconds)) {
    return null;
  }
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = Math.round(durationSeconds % 60);
  return (
    <span style={{ fontSize: '0.8rem', opacity: 0.6, whiteSpace: 'nowrap' }}>
      {minutes}:{String(seconds).padStart(2, '0')}
    </span>
  );
}
