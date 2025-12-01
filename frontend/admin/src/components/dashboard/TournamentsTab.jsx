import PanelCard from '../common/PanelCard.jsx';
import { useDashboard } from '../../context/DashboardContext.jsx';
import { TOURNAMENT_CLASSIFICATION_OPTIONS } from '../../constants/dashboard.js';
import TournamentDetailsPanel from './tournaments/TournamentDetailsPanel.jsx';

export default function TournamentsTab() {
  const {
    tournaments: {
      tournaments,
      tournamentsLoading,
      tournamentsError,
      tournamentForm,
      tournamentEdits,
      expandedTournamentId,
      setExpandedTournamentId,
      handleTournamentFormChange,
      handleTournamentFormSubmit,
      startTournamentEdit,
      handleTournamentEditChange,
      cancelTournamentEdit,
      handleTournamentSave,
      handleTournamentDelete,
      handleTournamentCompletionChange,
      tournamentCompletionSaving
    },
    tournamentStructure,
    teams
  } = useDashboard();

  return (
    <div style={{ display: 'grid', gap: '1.75rem' }}>
      <PanelCard
        title="Turnier erstellen"
        description="Definiere Name, Gruppenanzahl, KO-Runden und Sichtbarkeit für neue Turniere."
      >
        <form onSubmit={handleTournamentFormSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.85rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              Turniername
              <input
                value={tournamentForm.name}
                onChange={(event) => handleTournamentFormChange('name', event.target.value)}
                placeholder="Name des Turniers"
                required
              />
            </label>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              Gruppen
              <input
                type="number"
                min="0"
                value={tournamentForm.group_count}
                onChange={(event) => handleTournamentFormChange('group_count', event.target.value)}
              />
            </label>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              KO-Runden
              <input
                type="number"
                min="0"
                value={tournamentForm.knockout_rounds}
                onChange={(event) => handleTournamentFormChange('knockout_rounds', event.target.value)}
              />
            </label>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              Mannschaften
              <input
                type="number"
                min="0"
                value={tournamentForm.team_count}
                onChange={(event) => handleTournamentFormChange('team_count', event.target.value)}
              />
            </label>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              Platzierungsmodus
              <select
                value={tournamentForm.classification_mode}
                onChange={(event) => handleTournamentFormChange('classification_mode', event.target.value)}
              >
                {TOURNAMENT_CLASSIFICATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1.65rem' }}>
              <input
                type="checkbox"
                checked={Boolean(tournamentForm.is_public)}
                onChange={(event) => handleTournamentFormChange('is_public', event.target.checked)}
              />
              Öffentlich anzeigen
            </label>
          </div>
          <div>
            <button type="submit">Turnier anlegen</button>
          </div>
        </form>
      </PanelCard>

      <PanelCard
        title="Turnierliste"
        description="Bearbeite Turnierparameter oder lösche nicht mehr benötigte Wettbewerbe."
      >
        {tournamentsLoading ? (
          <p style={{ margin: 0 }}>Turniere werden geladen...</p>
        ) : tournamentsError ? (
          <p style={{ margin: 0, color: 'var(--warning)' }}>{tournamentsError}</p>
        ) : tournaments.length === 0 ? (
          <p style={{ margin: 0 }}>Noch keine Turniere vorhanden.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1.1rem' }}>
            {tournaments.map((tournament) => {
              const edit = tournamentEdits[tournament.id];
              const isEditing = Boolean(edit);
              const isExpanded = expandedTournamentId === tournament.id;
              const completionSaving = Boolean(
                tournamentCompletionSaving?.[String(tournament.id)] ?? false
              );

              return (
                <div
                  key={tournament.id}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(8,20,35,0.55)',
                    padding: '1rem 1.2rem',
                    display: 'grid',
                    gap: '0.9rem'
                  }}
                >
                  {isEditing ? (
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <input
                        value={edit.name}
                        onChange={(event) => handleTournamentEditChange(tournament.id, 'name', event.target.value)}
                      />
                      <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                        <label>
                          Gruppen
                          <input
                            type="number"
                            min="0"
                            value={edit.group_count}
                            onChange={(event) => handleTournamentEditChange(tournament.id, 'group_count', event.target.value)}
                          />
                        </label>
                        <label>
                          KO-Runden
                          <input
                            type="number"
                            min="0"
                            value={edit.knockout_rounds}
                            onChange={(event) => handleTournamentEditChange(tournament.id, 'knockout_rounds', event.target.value)}
                          />
                        </label>
                      </div>
                      <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                        <label>
                          Mannschaften
                          <input
                            type="number"
                            min="0"
                            value={edit.team_count}
                            onChange={(event) => handleTournamentEditChange(tournament.id, 'team_count', event.target.value)}
                          />
                        </label>
                        <label>
                          Platzierungsmodus
                          <select
                            value={edit.classification_mode}
                            onChange={(event) => handleTournamentEditChange(tournament.id, 'classification_mode', event.target.value)}
                          >
                            {TOURNAMENT_CLASSIFICATION_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(edit.is_public)}
                          onChange={(event) => handleTournamentEditChange(tournament.id, 'is_public', event.target.checked)}
                        />
                        Öffentlich anzeigen
                      </label>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <strong>{tournament.name}</strong>
                      <span style={{ fontSize: '0.9rem', opacity: 0.75 }}>
                        Gruppen: {tournament.group_count ?? 0} · KO-Runden: {tournament.knockout_rounds ?? 0}
                      </span>
                      <span style={{ fontSize: '0.9rem', opacity: 0.75 }}>
                        Teams: {tournament.team_count ?? 0} · Platzierungen: {tournament.classification_mode === 'all' ? 'alle Plätze' : 'Top 4'}
                      </span>
                      <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                        Status: {tournament.is_public ? 'öffentlich' : 'privat'}
                      </span>
                      <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                        Turnier: {tournament.is_completed ? 'abgeschlossen' : 'läuft'}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => setExpandedTournamentId(isExpanded ? null : tournament.id)}>
                      {isExpanded ? 'Details verbergen' : 'Details anzeigen'}
                    </button>
                    {isEditing ? (
                      <>
                        <button type="button" onClick={() => handleTournamentSave(tournament.id)}>
                          Speichern
                        </button>
                        <button type="button" onClick={() => cancelTournamentEdit(tournament.id)}>
                          Abbrechen
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => startTournamentEdit(tournament)}>
                          Bearbeiten
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTournamentDelete(tournament.id)}
                          style={{ background: 'rgba(211,47,47,0.85)', color: '#fff' }}
                        >
                          Löschen
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleTournamentCompletionChange(tournament.id, !tournament.is_completed)}
                      disabled={completionSaving}
                      style={{
                        borderRadius: '999px',
                        border: '1px solid rgba(255,255,255,0.35)',
                        background: tournament.is_completed ? 'rgba(0, 180, 120, 0.25)' : 'transparent',
                        color: '#fff',
                        padding: '0.35rem 0.9rem',
                        fontSize: '0.85rem',
                        opacity: completionSaving ? 0.6 : 1,
                        cursor: completionSaving ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {completionSaving
                        ? 'Aktualisiere...'
                        : tournament.is_completed
                          ? 'Turnier wieder öffnen'
                          : 'Turnier abschließen'}
                    </button>
                  </div>

                  {isExpanded ? (
                    <TournamentDetailsPanel
                      tournament={tournament}
                      structureState={tournamentStructure}
                      teams={teams.teams}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </PanelCard>
    </div>
  );
}
