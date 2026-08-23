import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PanelCard from '../../common/PanelCard.jsx';
import { useDashboard } from '../../../context/DashboardContext.jsx';
import { SCHEDULE_PHASE_OPTIONS } from '../../../constants/dashboard.js';

export default function ScheduleBulkActionsCard() {
  const { t } = useTranslation();
  const {
    matchContext: { resolvedTournamentId },
    schedule: {
      scheduleChronological,
      scheduleLoading,
      scheduleError,
      handleScheduleApplyDate,
      handleScheduleAutoPlan,
      handleScheduleBulkPersist,
      bulkSaving
    }
  } = useDashboard();

  const [bulkDate, setBulkDate] = useState('');
  const [bulkDatePhase, setBulkDatePhase] = useState('all');
  const [autoStart, setAutoStart] = useState('');
  const [autoInterval, setAutoInterval] = useState('12');
  const [autoBreakAfter, setAutoBreakAfter] = useState('');
  const [autoBreakDuration, setAutoBreakDuration] = useState('5');
  const [autoPhase, setAutoPhase] = useState('all');
  const [autoSkipCompleted, setAutoSkipCompleted] = useState(true);
  const [autoOnlyEmpty, setAutoOnlyEmpty] = useState(false);
  const [bulkSavePhase, setBulkSavePhase] = useState('all');

  const stats = useMemo(() => {
    const total = scheduleChronological?.length ?? 0;
    const scheduled = scheduleChronological?.reduce((count, entry) => count + (entry.scheduled_at ? 1 : 0), 0) ?? 0;
    return {
      total,
      scheduled,
      unscheduled: Math.max(0, total - scheduled)
    };
  }, [scheduleChronological]);

  if (!resolvedTournamentId) {
    return (
      <PanelCard title={t('schedule.bulk.title')} description={t('schedule.bulk.descriptionNoTournament')}>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>{t('schedule.bulk.noTournament')}</p>
      </PanelCard>
    );
  }

  if (scheduleLoading) {
    return (
      <PanelCard title={t('schedule.bulk.title')} description={t('schedule.bulk.descriptionLoading')}>
        <p style={{ margin: 0 }}>{t('schedule.bulk.loading')}</p>
      </PanelCard>
    );
  }

  if (scheduleError) {
    return (
      <PanelCard title={t('schedule.bulk.title')} description={t('schedule.bulk.descriptionLoading')}>
        <p style={{ margin: 0, color: 'var(--warning)' }}>{scheduleError}</p>
      </PanelCard>
    );
  }

  if (!scheduleChronological || scheduleChronological.length === 0) {
    return (
      <PanelCard title={t('schedule.bulk.title')} description={t('schedule.bulk.descriptionList')}>
        <p style={{ margin: 0 }}>{t('schedule.bulk.noMatches')}</p>
      </PanelCard>
    );
  }

  return (
    <PanelCard
      title={t('schedule.bulk.title')}
      description={t('schedule.bulk.description')}
    >
      <div style={{ display: 'grid', gap: '1.25rem' }}>
        <div
          style={{
            display: 'grid',
            gap: '0.35rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            fontSize: '0.9rem',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(12, 28, 48, 0.55)'
          }}
        >
          <span>{t('schedule.bulk.total', { count: stats.total })}</span>
          <span>{t('schedule.bulk.scheduled', { count: stats.scheduled })}</span>
          <span>{t('schedule.bulk.open', { count: stats.unscheduled })}</span>
        </div>

        <section style={{ display: 'grid', gap: '0.75rem' }}>
          <header>
            <h3 style={{ margin: 0, fontSize: '1rem', letterSpacing: '0.04em' }}>{t('schedule.bulk.applyDateTitle')}</h3>
            <p style={{ margin: 0, opacity: 0.75 }}>{t('schedule.bulk.applyDateDescription')}</p>
          </header>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleScheduleApplyDate({ date: bulkDate, phase: bulkDatePhase });
            }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}
          >
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              {t('schedule.bulk.date')}
              <input type="date" value={bulkDate} onChange={(event) => setBulkDate(event.target.value)} required />
            </label>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              {t('schedule.bulk.phase')}
              <select value={bulkDatePhase} onChange={(event) => setBulkDatePhase(event.target.value)}>
                {SCHEDULE_PHASE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit">{t('schedule.bulk.applyDate')}</button>
          </form>
        </section>

        <section style={{ display: 'grid', gap: '0.75rem' }}>
          <header>
            <h3 style={{ margin: 0, fontSize: '1rem', letterSpacing: '0.04em' }}>{t('schedule.bulk.autoPlanTitle')}</h3>
            <p style={{ margin: 0, opacity: 0.75 }}>
              {t('schedule.bulk.autoPlanDescription')}
            </p>
          </header>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleScheduleAutoPlan({
                start: autoStart,
                intervalMinutes: autoInterval,
                breakAfter: autoBreakAfter,
                breakMinutes: autoBreakDuration,
                phase: autoPhase,
                skipCompleted: autoSkipCompleted,
                onlyEmpty: autoOnlyEmpty
              });
            }}
            style={{ display: 'grid', gap: '0.75rem' }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                {t('schedule.bulk.start')}
                <input
                  type="datetime-local"
                  value={autoStart}
                  onChange={(event) => setAutoStart(event.target.value)}
                  required
                />
              </label>
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                {t('schedule.bulk.interval')}
                <input
                  type="number"
                  min="1"
                  value={autoInterval}
                  onChange={(event) => setAutoInterval(event.target.value)}
                  required
                />
              </label>
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                {t('schedule.bulk.breakAfter')}
                <input
                  type="number"
                  min="1"
                  placeholder={t('schedule.bulk.breakAfterPlaceholder')}
                  value={autoBreakAfter}
                  onChange={(event) => setAutoBreakAfter(event.target.value)}
                />
              </label>
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                {t('schedule.bulk.breakDuration')}
                <input
                  type="number"
                  min="1"
                  value={autoBreakDuration}
                  onChange={(event) => setAutoBreakDuration(event.target.value)}
                />
              </label>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.9rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="checkbox"
                  checked={autoSkipCompleted}
                  onChange={(event) => setAutoSkipCompleted(event.target.checked)}
                />
                {t('schedule.bulk.skipCompleted')}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="checkbox"
                  checked={autoOnlyEmpty}
                  onChange={(event) => setAutoOnlyEmpty(event.target.checked)}
                />
                {t('schedule.bulk.onlyEmpty')}
              </label>
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                {t('schedule.bulk.phase')}
                <select value={autoPhase} onChange={(event) => setAutoPhase(event.target.value)}>
                  {SCHEDULE_PHASE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <button type="submit">{t('schedule.bulk.applyAutoPlan')}</button>
            </div>
          </form>
        </section>

        <section style={{ display: 'grid', gap: '0.75rem' }}>
          <header>
            <h3 style={{ margin: 0, fontSize: '1rem', letterSpacing: '0.04em' }}>{t('schedule.bulk.saveTitle')}</h3>
            <p style={{ margin: 0, opacity: 0.75 }}>
              {t('schedule.bulk.saveDescription')}
            </p>
          </header>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              {t('schedule.bulk.phase')}
              <select value={bulkSavePhase} onChange={(event) => setBulkSavePhase(event.target.value)}>
                {SCHEDULE_PHASE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => handleScheduleBulkPersist({ phase: bulkSavePhase })}
              disabled={bulkSaving}
            >
              {bulkSaving ? t('common.saving') : t('schedule.bulk.saveAll')}
            </button>
          </div>
        </section>
      </div>
    </PanelCard>
  );
}
