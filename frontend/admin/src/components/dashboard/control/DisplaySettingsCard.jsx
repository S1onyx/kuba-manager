import { useTranslation } from 'react-i18next';
import { DISPLAY_VIEW_OPTIONS } from '../../../constants/dashboard.js';
import PanelCard from '../../common/PanelCard.jsx';
import { useDashboard } from '../../../context/DashboardContext.jsx';

export default function DisplaySettingsCard() {
  const { t } = useTranslation();
  const {
    scoreboard: { scoreboard, displayViewPending },
    scoreboardActions: { handleDisplayViewChange }
  } = useDashboard();

  const displayView = scoreboard?.displayView ?? 'scoreboard';

  return (
    <PanelCard
      title={t('control.display.title')}
      description={t('control.display.description')}
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
              {t(option.labelKey)}
            </button>
          );
        })}
      </div>
      {displayView === 'bracket' && !scoreboard?.tournamentId ? (
        <p style={{ margin: 0, color: 'var(--warning)', fontSize: '0.9rem' }}>
          {t('control.display.bracketHint')}
        </p>
      ) : null}
      {displayViewPending ? (
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('control.display.updating')}
        </p>
      ) : null}
    </PanelCard>
  );
}
