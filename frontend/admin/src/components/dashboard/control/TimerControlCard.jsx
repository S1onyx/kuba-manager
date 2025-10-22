import PanelCard from '../../common/PanelCard.jsx';
import { useDashboard } from '../../../context/DashboardContext.jsx';
import { formatTime } from '../../../utils/formatters.js';

export default function TimerControlCard() {
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
      setTimerInput,
      setHalftimeInput,
      setHalftimePauseInput,
      setExtraTimeInput,
      setHalftimeDirty,
      setHalftimePauseDirty,
      setExtraDirty
    },
    scoreboardMeta: { formattedRemaining, statusLabel },
    ui,
    history
  } = useDashboard();

  return (
    <PanelCard
      title="Spielzeit & Ablauf"
      description="Verwalte Uhr, Halbzeiten und Nachspielzeit. Starte, pausiere oder beende Spiele zentral."
    >
      <div style={{ display: 'grid', gap: '1.1rem' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(8, 20, 35, 0.55)'
          }}
        >
          <div style={{ display: 'grid', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.18em', opacity: 0.65 }}>
              Restzeit
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
              {formattedRemaining}
            </div>
            <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Status: {statusLabel}</span>
            <span style={{ fontSize: '0.85rem', opacity: 0.65 }}>
              Halbzeit bei {formatTime(scoreboard.halftimeSeconds ?? 0)} · Pause {formatTime(scoreboard.halftimePauseSeconds ?? 0)}
            </span>
            {(scoreboard.extraSeconds ?? 0) > 0 || (scoreboard.extraElapsedSeconds ?? 0) > 0 ? (
              <span style={{ fontSize: '0.85rem', opacity: 0.65 }}>
                Nachspielzeit geplant {formatTime(scoreboard.extraSeconds ?? 0)} · gelaufen {formatTime(scoreboard.extraElapsedSeconds ?? 0)}
              </span>
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
            <button type="button" onClick={handleStart} disabled={scoreboard.isRunning}>
              Start
            </button>
            <button type="button" onClick={handlePause} disabled={!scoreboard.isRunning}>
              Pause
            </button>
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
            Neue Restzeit
            <input
              value={timerInput}
              onChange={(event) => setTimerInput(event.target.value)}
              placeholder="z.B. 10:00 oder 600"
            />
          </label>
          <button type="submit" disabled={submittingTimer}>
            {submittingTimer ? 'Setze...' : 'Zeit setzen'}
          </button>
        </form>

        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleHalftimeSubmit(halftimeInput);
            }}
            style={{ display: 'grid', gap: '0.4rem' }}
          >
            <label style={{ fontSize: '0.85rem' }}>
              Halbzeit bei
              <input
                style={{ marginTop: '0.35rem' }}
                value={halftimeInput}
                onChange={(event) => {
                  setHalftimeInput(event.target.value);
                  setHalftimeDirty(true);
                }}
                placeholder="z.B. 05:00"
              />
            </label>
            <button type="submit">Speichern</button>
          </form>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleHalftimePauseSubmit(halftimePauseInput);
            }}
            style={{ display: 'grid', gap: '0.4rem' }}
          >
            <label style={{ fontSize: '0.85rem' }}>
              Halbzeitpause
              <input
                style={{ marginTop: '0.35rem' }}
                value={halftimePauseInput}
                onChange={(event) => {
                  setHalftimePauseInput(event.target.value);
                  setHalftimePauseDirty(true);
                }}
                placeholder="z.B. 01:00"
              />
            </label>
            <button type="submit">Speichern</button>
          </form>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleExtraTimeSubmit(extraTimeInput);
            }}
            style={{ display: 'grid', gap: '0.4rem' }}
          >
            <label style={{ fontSize: '0.85rem' }}>
              Nachspielzeit
              <input
                style={{ marginTop: '0.35rem' }}
                value={extraTimeInput}
                onChange={(event) => {
                  setExtraTimeInput(event.target.value);
                  setExtraDirty(true);
                }}
                placeholder="z.B. 02:00"
              />
            </label>
            <button type="submit">Speichern</button>
          </form>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <button
            type="button"
            onClick={() =>
              handleFinishGame()
            }
            style={{ background: 'rgba(211,47,47,0.85)', color: '#fff' }}
          >
            Spiel beenden
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
            Spiel speichern
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
            Neues Spiel vorbereiten
          </button>
        </div>
      </div>
    </PanelCard>
  );
}
