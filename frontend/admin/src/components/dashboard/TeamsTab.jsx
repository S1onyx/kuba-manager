import PanelCard from '../common/PanelCard.jsx';
import { useDashboard } from '../../context/DashboardContext.jsx';

export default function TeamsTab() {
  const {
    teams: {
      teams,
      teamsLoading,
      teamsError,
      teamCreateName,
      teamEdits,
      setTeamCreateName,
      handleTeamCreateSubmit,
      startTeamEdit,
      handleTeamEditChange,
      cancelTeamEdit,
      handleTeamSave,
      handleTeamDelete
    }
  } = useDashboard();

  return (
    <div style={{ display: 'grid', gap: '1.75rem' }}>
      <PanelCard
        title="Teams organisieren"
        description="Lege neue Teams an oder bearbeite bestehende Mannschaften. Diese stehen in Scoreboard und Turnierstruktur zur Auswahl."
      >
        <form
          onSubmit={handleTeamCreateSubmit}
          style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}
        >
          <input
            value={teamCreateName}
            onChange={(event) => setTeamCreateName(event.target.value)}
            placeholder="Teamname"
            style={{ flex: '1 1 260px' }}
          />
          <button type="submit">Team anlegen</button>
        </form>
      </PanelCard>

      <PanelCard
        title="Teamübersicht"
        description="Aktualisiere Teamnamen oder entferne Teams, die nicht mehr benötigt werden."
      >
        {teamsLoading ? (
          <p style={{ margin: 0 }}>Teams werden geladen...</p>
        ) : teamsError ? (
          <p style={{ margin: 0, color: 'var(--warning)' }}>{teamsError}</p>
        ) : teams.length === 0 ? (
          <p style={{ margin: 0 }}>Noch keine Teams angelegt.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            {teams.map((team) => {
              const edit = teamEdits[team.id];
              const isEditing = Boolean(edit);
              return (
                <article
                  key={team.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(8,20,35,0.5)'
                  }}
                >
                  {isEditing ? (
                    <input
                      value={edit.name}
                      onChange={(event) => handleTeamEditChange(team.id, event.target.value)}
                      style={{ flex: '1 1 auto' }}
                    />
                  ) : (
                    <strong>{team.name}</strong>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {isEditing ? (
                      <>
                        <button type="button" onClick={() => handleTeamSave(team.id)}>
                          Speichern
                        </button>
                        <button type="button" onClick={() => cancelTeamEdit(team.id)}>
                          Abbrechen
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => startTeamEdit(team)}>
                          Bearbeiten
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTeamDelete(team.id)}
                          style={{ background: 'rgba(211,47,47,0.85)', color: '#fff' }}
                        >
                          Löschen
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </PanelCard>
    </div>
  );
}
