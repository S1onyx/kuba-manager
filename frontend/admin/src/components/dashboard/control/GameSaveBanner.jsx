import { useTranslation } from 'react-i18next';
import { useDashboard } from '../../../context/DashboardContext.jsx';
import { getSaveStatus } from '../../../utils/gameStatus.js';

const TONES = {
  needsSave: { border: '#f97316', background: 'rgba(249,115,22,0.16)', accent: '#fdba74' },
  changed: { border: '#f97316', background: 'rgba(249,115,22,0.16)', accent: '#fdba74' },
  blocked: { border: '#facc15', background: 'rgba(250,204,21,0.12)', accent: '#fde68a' },
  saved: { border: '#4ade80', background: 'rgba(74,222,128,0.12)', accent: '#86efac' }
};

export default function GameSaveBanner() {
  const { t } = useTranslation();
  const {
    scoreboard: { scoreboard, handleSaveGame, handleNewGame },
    history
  } = useDashboard();
  const status = getSaveStatus(scoreboard);
  const tone = TONES[status];
  if (!tone) return null;

  const action =
    status === 'needsSave' || status === 'changed'
      ? { label: t(status === 'changed' ? 'control.saveBanner.resave' : 'control.saveBanner.save'), run: () => handleSaveGame({ onSaved: () => history.loadHistory() }) }
      : status === 'saved'
        ? { label: t('control.saveBanner.reset'), run: () => handleNewGame({ onReset: () => history.loadHistory() }) }
        : null;

  return (
    <section
      className={status === 'needsSave' || status === 'changed' ? 'save-banner save-banner--pulse' : 'save-banner'}
      style={{ border: `2px solid ${tone.border}`, background: tone.background }}
    >
      <div style={{ display: 'grid', gap: '0.3rem' }}>
        <strong style={{ fontSize: '1.15rem', color: tone.accent }}>{t(`control.saveBanner.${status}Title`)}</strong>
        <span style={{ fontSize: '0.95rem' }}>
          {scoreboard.teamAName} <strong>{scoreboard.scoreA} : {scoreboard.scoreB}</strong> {scoreboard.teamBName}
        </span>
        <span style={{ fontSize: '0.88rem', opacity: 0.85 }}>{t(`control.saveBanner.${status}Text`)}</span>
      </div>
      {action ? (
        <button type="button" onClick={action.run} className="save-banner__button" style={{ borderColor: tone.border }}>
          {action.label}
        </button>
      ) : null}
    </section>
  );
}
