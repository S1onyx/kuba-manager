import { useEffect, useMemo, useState } from 'react';

const buttonBaseStyle = {
  zIndex: 1000,
  padding: '0.65rem 1.1rem',
  borderRadius: '999px',
  border: '1px solid rgba(255,255,255,0.35)',
  background: 'rgba(0, 0, 0, 0.45)',
  color: '#fff',
  fontSize: '0.95rem',
  letterSpacing: '0.08em',
  cursor: 'pointer',
  backdropFilter: 'blur(6px)',
  transition: 'transform 0.2s ease, opacity 0.2s ease'
};

export default function FullscreenToggle({ auto = false, fixed = true, style = {}, onChange }) {
  const [isFullscreen, setIsFullscreen] = useState(() =>
    typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false
  );
  const [autoRequested, setAutoRequested] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  useEffect(() => {
    if (!auto || autoRequested || isFullscreen) {
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.warn('Fullscreen request failed:', err);
      } finally {
        setAutoRequested(true);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [auto, autoRequested, isFullscreen]);

  useEffect(() => {
    onChange?.(isFullscreen);
  }, [onChange, isFullscreen]);

  const buttonStyle = useMemo(() => {
    const positioning = fixed
      ? { position: 'fixed', top: '1.5rem', right: '1.5rem' }
      : {};
    return {
      ...buttonBaseStyle,
      ...positioning,
      opacity: isFullscreen ? 0.75 : 1,
      ...style
    };
  }, [fixed, isFullscreen, style]);

  const handleToggle = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen toggle failed:', err);
    }
  };

  return (
    <button type="button" onClick={handleToggle} style={buttonStyle}>
      {isFullscreen ? 'Vollbild verlassen' : 'Vollbild'}
    </button>
  );
}
