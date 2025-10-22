import PanelCard from '../../common/PanelCard.jsx';
import { useDashboard } from '../../../context/DashboardContext.jsx';
import { formatDateTime } from '../../../utils/formatters.js';

export default function SchedulePlannerCard() {
  const {
    schedule: {
      scheduleChronological,
      scheduleDrafts,
      scheduleSaving,
      scheduleLoading,
      scheduleError,
      handleScheduleDraftChange,
      handleScheduleDraftSubmit,
      handleScheduleDraftClear
    },
    matchContext: { resolvedTournamentId }
  } = useDashboard();

  return (
    <PanelCard
      title="Spieltermine planen"
      description="Lege Datum und Uhrzeit für alle Paarungen fest, um den Spieltag zu strukturieren."
    >
      {!resolvedTournamentId ? (
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>Bitte zuerst ein Turnier auswählen.</p>
      ) : scheduleLoading ? (
        <p style={{ margin: 0 }}>Spielplan wird geladen...</p>
      ) : scheduleError ? (
        <p style={{ margin: 0, color: 'var(--warning)' }}>{scheduleError}</p>
      ) : scheduleChronological.length === 0 ? (
        <p style={{ margin: 0 }}>Noch keine Partien im Spielplan vorhanden.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {scheduleChronological.map((entry) => {
            const key = String(entry.id);
            const baseValue = entry.scheduled_at ? scheduleDrafts[key] ?? entry.scheduled_at : scheduleDrafts[key] ?? '';
            const saving = Boolean(scheduleSaving[key]);
            const hasScheduled = Boolean(entry.scheduled_at);
            const stageInfo =
              entry.phase === 'group' && entry.round_number
                ? `${entry.stage_label} · Runde ${entry.round_number}`
                : entry.stage_label || 'Phase';
            const statusLabel = hasScheduled
              ? `Geplant: ${formatDateTime(entry.scheduled_at)}`
              : 'Noch kein Zeitpunkt gesetzt';

            return (
              <article
                key={entry.id}
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  background: 'rgba(8, 20, 35, 0.55)',
                  display: 'grid',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.95rem' }}>{stageInfo}</strong>
                  <span style={{ opacity: 0.7 }}>
                    {entry.home_label} vs {entry.away_label}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
                  <input
                    type="datetime-local"
                    value={baseValue}
                    onChange={(event) => handleScheduleDraftChange(entry.id, event.target.value)}
                    disabled={saving}
                  />
                  <button
                    type="button"
                    onClick={() => handleScheduleDraftSubmit(entry.id)}
                    disabled={saving}
                  >
                    {saving ? 'Speichere...' : 'Speichern'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScheduleDraftClear(entry.id)}
                    disabled={saving || (!hasScheduled && (baseValue ?? '') === '')}
                  >
                    Löschen
                  </button>
                  <span style={{ fontSize: '0.85rem', opacity: 0.75 }}>{statusLabel}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PanelCard>
  );
}
