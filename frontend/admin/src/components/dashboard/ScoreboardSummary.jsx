import { useTranslation } from 'react-i18next';
import PanelCard from '../common/PanelCard.jsx';
import { useFormatStageLabel } from '../../utils/stageLabels.js';

export default function ScoreboardSummary({
  scoreboard,
  formattedRemaining,
  liveStateLabel,
  onToggleDisplayView,
  displayViewPending = false
}) {
  const { t } = useTranslation();
  const formatStageLabel = useFormatStageLabel();

  if (!scoreboard) {
    return null;
  }

  const stageSuffix = scoreboard.stageType && scoreboard.stageLabel
    ? scoreboard.stageType === 'group'
      ? formatStageLabel(
          scoreboard.stageLabelI18n ?? { type: 'group', group: scoreboard.stageLabel },
          scoreboard.stageLabel
        )
      : formatStageLabel(scoreboard.stageLabelI18n, scoreboard.stageLabel)
    : '';

  const tournamentBadge = scoreboard.tournamentName
    ? `${scoreboard.tournamentName}${stageSuffix ? ` · ${stageSuffix}` : ''}`
    : t('summary.noTournament');

  const displayViewLabel =
    scoreboard.displayView === 'bracket' ? t('displayViews.bracket') : t('displayViews.scoreboard');

  return (
    <PanelCard
      tone="accent"
      title={t('summary.title')}
      description={t('summary.description')}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'grid', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.72 }}>
            {t('summary.teams')}
          </span>
          <div style={{ fontSize: 'clamp(1.15rem, 4.5vw, 1.6rem)', fontWeight: 700, letterSpacing: '0.01em' }}>
            {scoreboard.teamAName} <span style={{ opacity: 0.7 }}>vs</span> {scoreboard.teamBName}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.6rem 1rem',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(5, 18, 35, 0.65)',
            fontWeight: 600,
            boxShadow: '0 16px 25px rgba(0,0,0,0.25)'
          }}
        >
          <span style={{ fontSize: 'clamp(1.25rem, 5vw, 1.7rem)' }}>
            {scoreboard.scoreA ?? 0} : {scoreboard.scoreB ?? 0}
          </span>
          <span style={{ opacity: 0.8, fontSize: '0.95rem' }}>
            {formattedRemaining} · {liveStateLabel}
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.25rem',
          fontSize: '0.9rem',
          opacity: 0.83,
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <span>{tournamentBadge}</span>
          {scoreboard.scheduleCode ? <span>{t('summary.matchCode', { code: scoreboard.scheduleCode })}</span> : null}
          <span>
            {t('summary.display', { view: displayViewLabel })}
          </span>
          {scoreboard.tournamentId ? (
            <span style={{ fontWeight: 600 }}>
              {t('summary.tournamentStatus', {
                status: scoreboard.tournamentCompleted
                  ? t('summary.statusCompleted')
                  : t('summary.statusRunning')
              })}
            </span>
          ) : null}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={() => onToggleDisplayView?.(scoreboard.displayView === 'bracket' ? 'scoreboard' : 'bracket')}
            disabled={!onToggleDisplayView || displayViewPending}
            style={{
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.35)',
              background: 'transparent',
              color: '#fff',
              padding: '0.35rem 0.9rem',
              fontSize: '0.85rem',
              opacity: displayViewPending ? 0.6 : 1,
              cursor: displayViewPending || !onToggleDisplayView ? 'not-allowed' : 'pointer'
            }}
          >
            {displayViewPending
              ? t('summary.switching')
              : scoreboard.displayView === 'bracket'
                ? t('summary.showLive')
                : t('summary.showBracket')}
          </button>
        </div>
      </div>
    </PanelCard>
  );
}
