import { DISPLAY_VIEW_OPTIONS } from '../../../constants/dashboard.js';
import PanelCard from '../../common/PanelCard.jsx';
import { useDashboard } from '../../../context/DashboardContext.jsx';

export default function DisplaySettingsCard() {
  const {
    scoreboard: { scoreboard, displayViewPending },
    scoreboardActions: { handleDisplayViewChange }
  } = useDashboard();

  const displayView = scoreboard?.displayView ?? 'scoreboard';

  return (
    <PanelCard
      title="Beameranzeige"
      description="Wechsle zwischen Live-Spielstand und Turnierbaum auf dem Beamer."
    >
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {DISPLAY_VIEW_OPTIONS.map((option) => {
          const isActive = displayView === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleDisplayViewChange(option.id)}
              disabled={isActive || displayViewPending}
              style={{
                padding: '0.65rem 1.3rem',
                borderRadius: '999px',
                background: isActive ? 'var(--accent)' : 'rgba(10, 28, 50, 0.5)',
                color: isActive ? '#061121' : 'var(--text-secondary)',
                border: '1px solid rgba(255,255,255,0.14)',
                boxShadow: isActive ? '0 16px 28px rgba(76,201,255,0.35)' : 'none',
                cursor: isActive ? 'default' : 'pointer'
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {displayView === 'bracket' && !scoreboard?.tournamentId ? (
        <p style={{ margin: 0, color: 'var(--warning)', fontSize: '0.9rem' }}>
          Hinweis: Für den Turnierbaum muss im Match-Kontext ein Turnier gesetzt sein.
        </p>
      ) : null}
      {displayViewPending ? (
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Anzeige wird aktualisiert...
        </p>
      ) : null}
    </PanelCard>
  );
}
