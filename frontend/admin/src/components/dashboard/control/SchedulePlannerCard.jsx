import { useTranslation } from 'react-i18next';
import PanelCard from '../../common/PanelCard.jsx';
import { useDashboard } from '../../../context/DashboardContext.jsx';
import { formatDateTime } from '../../../utils/formatters.js';
import { useDateLocale } from '../../../i18n/index.js';
import { useFormatStageLabel } from '../../../utils/stageLabels.js';

export default function SchedulePlannerCard() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const formatStageLabel = useFormatStageLabel();
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
      title={t('schedule.planner.title')}
      description={t('schedule.planner.description')}
    >
      {!resolvedTournamentId ? (
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>{t('schedule.planner.selectTournamentFirst')}</p>
      ) : scheduleLoading ? (
        <p style={{ margin: 0 }}>{t('schedule.planner.loading')}</p>
      ) : scheduleError ? (
        <p style={{ margin: 0, color: 'var(--warning)' }}>{scheduleError}</p>
      ) : scheduleChronological.length === 0 ? (
        <p style={{ margin: 0 }}>{t('schedule.planner.noMatches')}</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {scheduleChronological.map((entry) => {
            const key = String(entry.id);
            const baseValue = entry.scheduled_at ? scheduleDrafts[key] ?? entry.scheduled_at : scheduleDrafts[key] ?? '';
            const saving = Boolean(scheduleSaving[key]);
            const hasScheduled = Boolean(entry.scheduled_at);
            const stageName = formatStageLabel(
              entry.stage_label_i18n,
              entry.stage_label || t('phases.fallback')
            );
            const stageInfo =
              entry.phase === 'group' && entry.round_number
                ? `${stageName} · ${t('phases.round', { round: entry.round_number })}`
                : stageName;
            const statusLabel = hasScheduled
              ? t('schedule.planner.scheduledAt', { time: formatDateTime(entry.scheduled_at, dateLocale) })
              : t('schedule.planner.notScheduled');

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
                    {saving ? t('common.saving') : t('common.save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScheduleDraftClear(entry.id)}
                    disabled={saving || (!hasScheduled && (baseValue ?? '') === '')}
                  >
                    {t('schedule.planner.clear')}
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
