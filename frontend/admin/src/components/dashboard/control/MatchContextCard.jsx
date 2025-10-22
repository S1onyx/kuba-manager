import PanelCard from '../../common/PanelCard.jsx';
import { useDashboard } from '../../../context/DashboardContext.jsx';

export default function MatchContextCard() {
  const {
    matchContext: {
      contextForm,
      stageOptions,
      stageOptionsLoading,
      stageSuggestionEntries,
      stageHintLines,
      stageLabelPlaceholder,
      stageListId,
      handleContextFormChange,
      handleContextSubmit
    },
    tournaments: { tournaments, tournamentsLoading, tournamentsError }
  } = useDashboard();

  return (
    <PanelCard
      title="Match-Kontext"
      description="Bestimme Turnier, Phase und Label für den aktuellen Livemodus."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleContextSubmit();
        }}
        style={{ display: 'grid', gap: '1rem' }}
      >
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          Turnier
          <select
            value={contextForm.tournamentId}
            onChange={(event) => handleContextFormChange('tournamentId', event.target.value)}
            disabled={tournamentsLoading}
          >
            <option value="">Kein Turnier</option>
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: '0.35rem' }}>
          Phase
          <select
            value={contextForm.stageType}
            onChange={(event) => handleContextFormChange('stageType', event.target.value)}
          >
            <option value="">Keine Phase</option>
            <option value="group">Gruppenphase</option>
            <option value="knockout">KO-Runde</option>
            <option value="placement">Platzierung</option>
          </select>
        </label>

        {contextForm.stageType ? (
          <label style={{ display: 'grid', gap: '0.35rem' }}>
            {contextForm.stageType === 'group'
              ? 'Gruppenbezeichnung'
              : contextForm.stageType === 'knockout'
                ? 'Rundenbezeichnung'
                : 'Platzierungsbezeichnung'}
            <input
              value={contextForm.stageLabel}
              onChange={(event) => handleContextFormChange('stageLabel', event.target.value)}
              placeholder={stageLabelPlaceholder}
              list={stageListId}
            />
            {stageListId ? (
              <datalist id={stageListId}>
                {stageSuggestionEntries.map((entry) => (
                  <option key={`${stageListId}-${entry.label}`} value={entry.label} />
                ))}
              </datalist>
            ) : null}
            {stageOptionsLoading ? (
              <span style={{ fontSize: '0.8rem', opacity: 0.65 }}>Lade verfügbare Phasen ...</span>
            ) : stageHintLines.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.2rem', fontSize: '0.8rem', opacity: 0.68 }}>
                <span>Vorschläge: {stageHintLines.join(' · ')}</span>
                <span>Tipp: Bekannte Labels setzen automatisch die passende Phase.</span>
              </div>
            ) : (
              <span style={{ fontSize: '0.8rem', opacity: 0.65 }}>Noch keine Vorschläge verfügbar.</span>
            )}
          </label>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit">Match-Kontext speichern</button>
        </div>
      </form>
      {tournamentsError ? (
        <p style={{ margin: 0, color: 'var(--warning)' }}>{tournamentsError}</p>
      ) : null}
    </PanelCard>
  );
}
