import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { updateDisplayView } from '../utils/api.js';

const baseStyle = {
  padding: '0.55rem 1rem',
  // Touch-Target mindestens 44px (Mobile)
  minHeight: '44px',
  minWidth: '44px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '999px',
  border: '1px solid rgba(255,255,255,0.3)',
  background: 'rgba(0, 0, 0, 0.45)',
  color: '#fff',
  fontSize: '0.85rem',
  letterSpacing: '0.04em',
  cursor: 'pointer',
  backdropFilter: 'blur(6px)',
  transition: 'opacity 0.2s ease, transform 0.2s ease'
};

export default function DisplayViewToggle({ displayView, style = {} }) {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);

  const nextView = displayView === 'bracket' ? 'scoreboard' : 'bracket';
  const label = useMemo(
    () => (displayView === 'bracket' ? t('controls.showLive') : t('controls.showBracket')),
    [displayView, t]
  );

  const handleClick = async () => {
    if (pending || !nextView) return;
    setPending(true);
    try {
      await updateDisplayView(nextView);
    } catch (error) {
      console.error('Display view change failed:', error);
    } finally {
      setPending(false);
    }
  };

  const buttonStyle = {
    ...baseStyle,
    opacity: pending ? 0.6 : 1,
    cursor: pending ? 'not-allowed' : 'pointer',
    ...style
  };

  return (
    <button type="button" onClick={handleClick} disabled={pending || !displayView} style={buttonStyle}>
      {pending ? t('controls.updating') : label}
    </button>
  );
}
