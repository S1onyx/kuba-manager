import { useTranslation } from 'react-i18next';
import PanelCard from '../../common/PanelCard.jsx';
import { useDashboard } from '../../../context/DashboardContext.jsx';
import { formatTime } from '../../../utils/formatters.js';

export default function TimerControlCard() {
  const { t } = useTranslation();
  const {
    scoreboard: {
      scoreboard,
      timerInput,
      submittingTimer,
      halftimeInput,
      halftimePauseInput,
      extraTimeInput,
      handleStart,
      handlePause,
      handleTimerSubmit,
      handleFinishGame,
      handleSaveGame,
      handleNewGame,
      handleHalftimeSubmit,
      handleHalftimePauseSubmit,
      handleExtraTimeSubmit,
      handleExtraTimeAdjust
    },
    scoreboardState: {
      setTimerInput,
      setHalftimeInput,
      setHalftimePauseInput,
      setExtraTimeInput,
      setHalftimeDirty,
      setHalftimePauseDirty,
      setExtraDirty
    },
    scoreboardMeta: { formattedRemaining, statusLabel },
    audio: { timerCueSettings, timerCueBusy, handleTimerCueSave },
    ui,
    history
  } = useDashboard();

  const autoStart = Boolean(timerCueSettings?.halftimeAutoStart);

  return (
    <PanelCard
      title={t('control.timer.title')}
      description={t('control.timer.description')}
    >
      <div style={{ display: 'grid', gap: '1.1rem' }}>
        <div className="admin-timer-bar">
          <div style={{ display: 'grid', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.18em', opacity: 0.65 }}>
              {t('control.timer.remaining')}
            </span>
            <div style={{ fontSize: 'clamp(1.4rem, 6vw, 1.8rem)', fontWeight: 700 }}>
              {formattedRemaining}
            </div>
            <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>{t('control.timer.status', { status: statusLabel })}</span>
            <span style={{ fontSize: '0.85rem', opacity: 0.65 }}>
              {t('control.timer.halftimeInfo', {
                halftime: formatTime(scoreboard.halftimeSeconds ?? 0),
                pause: formatTime(scoreboard.halftimePauseSeconds ?? 0)
              })}
            </span>
            {scoreboard.isHalftimeBreak ? (
              <span style={{ fontSize: '0.85rem', opacity: 0.75 }}>
                {t('control.timer.halftimeBreakRunning', {
                  remaining: formatTime(scoreboard.halftimePauseRemaining ?? 0),
                  mode: autoStart ? t('control.timer.autoStart') : t('control.timer.manualStart')
                })}
              </span>
            ) : null}
            {(scoreboard.extraSeconds ?? 0) > 0 || (scoreboard.extraElapsedSeconds ?? 0) > 0 ? (
              <span style={{ fontSize: '0.85rem', opacity: 0.65 }}>
                {t('control.timer.extraTimeInfo', {
                  planned: formatTime(scoreboard.extraSeconds ?? 0),
                  elapsed: formatTime(scoreboard.extraElapsedSeconds ?? 0)
                })}
              </span>
            ) : null}
          </div>

          <div className="admin-timer-bar__controls">
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button type="button" onClick={handleStart} disabled={scoreboard.isRunning}>
                {t('control.timer.start')}
              </button>
              <button type="button" onClick={handlePause} disabled={!scoreboard.isRunning}>
                {t('control.timer.pause')}
              </button>
            </div>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', opacity: 0.9 }}>
              <input
                type="checkbox"
                checked={autoStart}
                disabled={timerCueBusy}
                onChange={(e) => handleTimerCueSave({ halftimeAutoStart: e.target.checked })}
              />
              {t('control.timer.autoStartSecondHalf')}
            </label>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleTimerSubmit(timerInput);
          }}
          style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}
        >
          <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.9rem' }}>
            {t('control.timer.newRemaining')}
            <input
              value={timerInput}
              onChange={(event) => setTimerInput(event.target.value)}
              placeholder={t('control.timer.timerPlaceholder')}
            />
          </label>
          <button type="submit" disabled={submittingTimer}>
            {submittingTimer ? t('control.timer.settingTime') : t('control.timer.setTime')}
          </button>
        </form>

        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))' }}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleHalftimeSubmit(halftimeInput);
            }}
            style={{ display: 'grid', gap: '0.4rem' }}
          >
            <label style={{ fontSize: '0.85rem' }}>
              {t('control.timer.halftimeAt')}
              <input
                style={{ marginTop: '0.35rem' }}
                value={halftimeInput}
                onChange={(event) => {
                  setHalftimeInput(event.target.value);
                  setHalftimeDirty(true);
                }}
                placeholder={t('control.timer.halftimePlaceholder')}
              />
            </label>
            <button type="submit">{t('common.save')}</button>
          </form>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleHalftimePauseSubmit(halftimePauseInput);
            }}
            style={{ display: 'grid', gap: '0.4rem' }}
          >
            <label style={{ fontSize: '0.85rem' }}>
              {t('control.timer.halftimePause')}
              <input
                style={{ marginTop: '0.35rem' }}
                value={halftimePauseInput}
                onChange={(event) => {
                  setHalftimePauseInput(event.target.value);
                  setHalftimePauseDirty(true);
                }}
                placeholder={t('control.timer.halftimePausePlaceholder')}
              />
            </label>
            <button type="submit">{t('common.save')}</button>
          </form>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleExtraTimeSubmit(extraTimeInput);
            }}
            style={{ display: 'grid', gap: '0.4rem' }}
          >
            <label style={{ fontSize: '0.85rem' }}>
              {t('control.timer.extraTime')}
              <input
                style={{ marginTop: '0.35rem' }}
                value={extraTimeInput}
                onChange={(event) => {
                  setExtraTimeInput(event.target.value);
                  setExtraDirty(true);
                }}
                placeholder={t('control.timer.extraTimePlaceholder')}
              />
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {[
                { label: '-30s', value: -30 },
                { label: '-10s', value: -10 },
                { label: '+10s', value: 10 },
                { label: '+30s', value: 30 }
              ].map((option) => (
                <button
                  type="button"
                  key={option.label}
                  onClick={() => handleExtraTimeAdjust(option.value)}
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button type="submit">{t('common.save')}</button>
          </form>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <button
            type="button"
            onClick={() =>
              handleFinishGame()
            }
            className="btn-danger"
          >
            {t('control.timer.finishGame')}
          </button>
          <button
            type="button"
            onClick={() =>
              handleSaveGame({
                onSaved: () => {
                  history.loadHistory();
                  ui.setActiveTab('history');
                }
              })
            }
            disabled={scoreboard.isRunning}
            style={{ background: 'rgba(11,26,43,0.95)', color: '#fff' }}
          >
            {t('control.timer.saveGame')}
          </button>
          <button
            type="button"
            onClick={() =>
              handleNewGame({
                onReset: () => {
                  history.loadHistory();
                  ui.setActiveTab('control');
                }
              })
            }
          >
            {t('control.timer.newGame')}
          </button>
        </div>
      </div>
    </PanelCard>
  );
}
