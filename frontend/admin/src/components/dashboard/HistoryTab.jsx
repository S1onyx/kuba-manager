import PanelCard from '../common/PanelCard.jsx';
import { useDashboard } from '../../context/DashboardContext.jsx';
import { formatTime } from '../../utils/formatters.js';

export default function HistoryTab() {
  const {
    history: {
      history,
      historyLoading,
      historyError,
      editingGameId,
      editForm,
      loadHistory,
      startHistoryEdit,
      handleHistoryEditChange,
      cancelHistoryEdit,
      handleHistoryEditSubmit,
      handleHistoryDelete,
      formatDateTime
    }
  } = useDashboard();

  return (
    <PanelCard
      title="Historie"
      description="Archivierte Spiele bearbeiten oder löschen. Ideal für Ergebnis-Validierung und Turnierstatistiken."
      action={
        <button type="button" onClick={loadHistory}>
          Aktualisieren
        </button>
      }
    >
      {historyLoading ? (
        <p style={{ margin: 0 }}>Gespeicherte Spiele werden geladen...</p>
      ) : historyError ? (
        <p style={{ margin: 0, color: 'var(--warning)' }}>{historyError}</p>
      ) : history.length === 0 ? (
        <p style={{ margin: 0 }}>Noch keine Spiele gespeichert.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1.2rem' }}>
          {history.map((game) => {
            const penalties = game.penalties ?? { a: [], b: [] };
            const plannedExtra = game.extra_seconds > 0 ? `+${formatTime(game.extra_seconds)}` : '—';
            const playedExtra = game.extra_elapsed_seconds > 0 ? formatTime(game.extra_elapsed_seconds) : '—';
            const isEditing = editingGameId === game.id;

            return (
              <article
                key={game.id}
                style={{
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(8, 20, 35, 0.55)',
                  padding: '1.1rem 1.25rem',
                  display: 'grid',
                  gap: '0.9rem'
                }}
              >
                <header
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    alignItems: 'center'
                  }}
                >
                  <strong>#{game.id}</strong>
                  <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>{formatDateTime(game.created_at)}</span>
                </header>

                {isEditing && editForm ? (
                  <form
                    onSubmit={handleHistoryEditSubmit}
                    style={{ display: 'grid', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}
                  >
                    <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                      <label style={{ display: 'grid', gap: '0.3rem' }}>
                        Team A
                        <input value={editForm.team_a} onChange={(event) => handleHistoryEditChange('team_a', event.target.value)} />
                      </label>
                      <label style={{ display: 'grid', gap: '0.3rem' }}>
                        Team B
                        <input value={editForm.team_b} onChange={(event) => handleHistoryEditChange('team_b', event.target.value)} />
                      </label>
                      <label style={{ display: 'grid', gap: '0.3rem' }}>
                        Score Team A
                        <input
                          type="number"
                          min="0"
                          value={editForm.score_a}
                          onChange={(event) => handleHistoryEditChange('score_a', event.target.value)}
                        />
                      </label>
                      <label style={{ display: 'grid', gap: '0.3rem' }}>
                        Score Team B
                        <input
                          type="number"
                          min="0"
                          value={editForm.score_b}
                          onChange={(event) => handleHistoryEditChange('score_b', event.target.value)}
                        />
                      </label>
                    </div>

                    <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                      <label style={{ display: 'grid', gap: '0.3rem' }}>
                        Nachspielzeit (geplant)
                        <input
                          value={editForm.extra_seconds}
                          onChange={(event) => handleHistoryEditChange('extra_seconds', event.target.value)}
                          placeholder="MM:SS oder Sekunden"
                        />
                      </label>
                      <label style={{ display: 'grid', gap: '0.3rem' }}>
                        Nachspielzeit (gelaufen)
                        <input
                          value={editForm.extra_elapsed_seconds}
                          onChange={(event) => handleHistoryEditChange('extra_elapsed_seconds', event.target.value)}
                          placeholder="MM:SS oder Sekunden"
                        />
                      </label>
                      <label style={{ display: 'grid', gap: '0.3rem' }}>
                        Strafen Team A (Anzahl)
                        <input
                          type="number"
                          min="0"
                          value={editForm.penalty_count_a}
                          onChange={(event) => handleHistoryEditChange('penalty_count_a', event.target.value)}
                        />
                      </label>
                      <label style={{ display: 'grid', gap: '0.3rem' }}>
                        Strafen Team B (Anzahl)
                        <input
                          type="number"
                          min="0"
                          value={editForm.penalty_count_b}
                          onChange={(event) => handleHistoryEditChange('penalty_count_b', event.target.value)}
                        />
                      </label>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button type="submit">Speichern</button>
                      <button type="button" onClick={cancelHistoryEdit}>
                        Abbrechen
                      </button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'grid', gap: '0.4rem' }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>
                      {game.team_a} {game.score_a} : {game.score_b} {game.team_b}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.88rem', opacity: 0.75 }}>
                      Turnier: {game.tournament_name ?? '—'}
                      {game.stage_type === 'group' && game.stage_label
                        ? ` · Gruppe ${game.stage_label}`
                        : game.stage_type === 'knockout' && game.stage_label
                          ? ` · ${game.stage_label}`
                          : ''}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.88rem', opacity: 0.75 }}>
                      Spielzeit: {formatTime(game.duration_seconds)} · Halbzeit bei {formatTime(game.halftime_seconds)} · Pause {formatTime(game.halftime_pause_seconds)}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.88rem', opacity: 0.75 }}>
                      Nachspielzeit geplant: {plannedExtra} · gelaufen: {playedExtra}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.88rem', opacity: 0.75 }}>
                      Strafen – {game.team_a}: {penalties.a?.length ?? 0} · {game.team_b}: {penalties.b?.length ?? 0}
                    </p>
                    <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => startHistoryEdit(game)}>
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHistoryDelete(game.id)}
                        style={{ background: 'rgba(211,47,47,0.85)', color: '#fff' }}
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </PanelCard>
  );
}
