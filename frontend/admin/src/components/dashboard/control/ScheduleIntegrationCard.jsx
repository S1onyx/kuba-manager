import PanelCard from '../../common/PanelCard.jsx';
import { useDashboard } from '../../../context/DashboardContext.jsx';

export default function ScheduleIntegrationCard() {
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
      title="Spielplan-Match übernehmen"
      description="Übernehme Teams, Phase und Matchcode direkt aus dem Spielplan."
    >
      {!resolvedTournamentId ? (
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>Bitte zuerst ein Turnier auswählen.</p>
      ) : scheduleLoading ? (
        <p style={{ margin: 0 }}>Spielplan wird geladen...</p>
      ) : scheduleError ? (
        <p style={{ margin: 0, color: 'var(--warning)' }}>{scheduleError}</p>
      ) : scheduleOptionData.options.length === 0 ? (
        <p style={{ margin: 0 }}>Keine Partien im Spielplan vorhanden.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <label style={{ display: 'grid', gap: '0.3rem' }}>
            Match auswählen
            <select
              value={schedulePickerCode}
              onChange={(event) => setSchedulePickerCode(event.target.value)}
            >
              <option value="">Bitte wählen</option>
              {scheduleOptionData.options.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                  {option.hasResult ? ' (bereits gespielt)' : ''}
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
              Match übernehmen
            </button>
            {scheduleSelection ? (
              <span style={{ fontSize: '0.88rem', opacity: 0.7 }}>Übernehme Match...</span>
            ) : null}
            {activeScheduleMatch ? (
              <span style={{ fontSize: '0.88rem', opacity: 0.78 }}>
                Aktuelles Scoreboard-Match: {describeScheduleMatch(activeScheduleMatch)}
              </span>
            ) : null}
          </div>
          {selectedScheduleMatch ? (
            <p style={{ margin: 0, fontSize: '0.88rem', opacity: 0.8 }}>
              Auswahl: {describeScheduleMatch(selectedScheduleMatch)}
            </p>
          ) : null}
          {selectedScheduleMatch?.result?.hasResult ? (
            <p style={{ margin: 0, color: 'var(--warning)', fontSize: '0.85rem' }}>
              Hinweis: Für dieses Match existiert bereits ein Ergebnis (
              {selectedScheduleMatch.result.scoreA ?? 0}:{selectedScheduleMatch.result.scoreB ?? 0}).
            </p>
          ) : null}
        </div>
      )}
    </PanelCard>
  );
}
