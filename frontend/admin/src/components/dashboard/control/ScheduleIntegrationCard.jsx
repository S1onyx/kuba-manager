import { useTranslation } from 'react-i18next';
import PanelCard from '../../common/PanelCard.jsx';
import { useDashboard } from '../../../context/DashboardContext.jsx';

export default function ScheduleIntegrationCard() {
  const { t } = useTranslation();
  const {
    schedule: {
      scheduleOptionData,
      schedulePickerCode,
      setSchedulePickerCode,
      scheduleSelection,
      selectedScheduleMatch,
      activeScheduleMatch,
      scheduleLoading,
      scheduleError,
      handleScheduleMatchApply,
      describeScheduleMatch
    },
    matchContext: { resolvedTournamentId }
  } = useDashboard();

  return (
    <PanelCard
      title={t('control.scheduleIntegration.title')}
      description={t('control.scheduleIntegration.description')}
    >
      {!resolvedTournamentId ? (
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>{t('control.scheduleIntegration.selectTournamentFirst')}</p>
      ) : scheduleLoading ? (
        <p style={{ margin: 0 }}>{t('control.scheduleIntegration.loading')}</p>
      ) : scheduleError ? (
        <p style={{ margin: 0, color: 'var(--warning)' }}>{scheduleError}</p>
      ) : scheduleOptionData.options.length === 0 ? (
        <p style={{ margin: 0 }}>{t('control.scheduleIntegration.noMatches')}</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <label style={{ display: 'grid', gap: '0.3rem' }}>
            {t('control.scheduleIntegration.selectMatch')}
            <select
              value={schedulePickerCode}
              onChange={(event) => setSchedulePickerCode(event.target.value)}
            >
              <option value="">{t('control.scheduleIntegration.pleaseSelect')}</option>
              {scheduleOptionData.options.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                  {option.hasResult ? ` ${t('control.scheduleIntegration.alreadyPlayed')}` : ''}
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => handleScheduleMatchApply(schedulePickerCode)}
              disabled={!schedulePickerCode || Boolean(scheduleSelection)}
            >
              {t('control.scheduleIntegration.apply')}
            </button>
            {scheduleSelection ? (
              <span style={{ fontSize: '0.88rem', opacity: 0.7 }}>{t('control.scheduleIntegration.applying')}</span>
            ) : null}
            {activeScheduleMatch ? (
              <span style={{ fontSize: '0.88rem', opacity: 0.78 }}>
                {t('control.scheduleIntegration.currentMatch', { match: describeScheduleMatch(activeScheduleMatch) })}
              </span>
            ) : null}
          </div>
          {selectedScheduleMatch ? (
            <p style={{ margin: 0, fontSize: '0.88rem', opacity: 0.8 }}>
              {t('control.scheduleIntegration.selection', { match: describeScheduleMatch(selectedScheduleMatch) })}
            </p>
          ) : null}
          {selectedScheduleMatch?.result?.hasResult ? (
            <p style={{ margin: 0, color: 'var(--warning)', fontSize: '0.85rem' }}>
              {t('control.scheduleIntegration.resultNotice', {
                scoreA: selectedScheduleMatch.result.scoreA ?? 0,
                scoreB: selectedScheduleMatch.result.scoreB ?? 0
              })}
            </p>
          ) : null}
        </div>
      )}
    </PanelCard>
  );
}
