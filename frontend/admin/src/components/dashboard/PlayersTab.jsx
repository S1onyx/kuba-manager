import PanelCard from '../common/PanelCard.jsx';
import { useDashboard } from '../../context/DashboardContext.jsx';

export default function PlayersTab() {
  const {
    teams: { teams },
    players: {
      playersLoading,
      playersError,
      playerCreate,
      playerEdits,
      playersByTeam,
      unassignedPlayers,
      handlePlayerCreateChange,
      handlePlayerCreateSubmit,
      startPlayerEdit,
      cancelPlayerEdit,
      handlePlayerEditChange,
      handlePlayerUpdateSubmit,
      handlePlayerDelete
    }
  } = useDashboard();

  return (
    <div style={{ display: 'grid', gap: '1.75rem' }}>
      <PanelCard
        title="Spieler anlegen"
        description="Lege Spieler für die Statistik an und ordne sie Teams zu. Danach lassen sich Punkte Aktionen Spielern zuweisen."
      >
        <form onSubmit={handlePlayerCreateSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.85rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              Team
              <select
                value={playerCreate.teamId}
                onChange={(event) => handlePlayerCreateChange('teamId', event.target.value)}
                required
              >
                <option value="">Team wählen</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              Spielername
              <input
                value={playerCreate.name}
                onChange={(event) => handlePlayerCreateChange('name', event.target.value)}
                placeholder="Name"
                required
              />
            </label>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              Rückennummer
              <input
                value={playerCreate.jerseyNumber}
                onChange={(event) => handlePlayerCreateChange('jerseyNumber', event.target.value)}
                placeholder="z.B. 12"
              />
            </label>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              Position (optional)
              <input
                value={playerCreate.position}
                onChange={(event) => handlePlayerCreateChange('position', event.target.value)}
                placeholder="z.B. Center"
              />
            </label>
          </div>
          <div>
            <button type="submit">Spieler anlegen</button>
          </div>
        </form>
      </PanelCard>

      <PanelCard
        title="Spielerübersicht"
        description="Bearbeite oder lösche Spieler. Ziehe unzugeordnete Spieler Teams zu, um sie im Scoreboard nutzen zu können."
      >
        {playersLoading ? (
          <p style={{ margin: 0 }}>Spieler werden geladen...</p>
        ) : playersError ? (
          <p style={{ margin: 0, color: 'var(--warning)' }}>{playersError}</p>
        ) : (
          <div style={{ display: 'grid', gap: '1.2rem' }}>
            {teams.map((team) => {
              const teamPlayers = playersByTeam.get(String(team.id)) ?? [];
              return (
                <article
                  key={team.id}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(8,20,35,0.55)',
                    padding: '1rem 1.2rem',
                    display: 'grid',
                    gap: '0.75rem'
                  }}
                >
                  <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{team.name}</strong>
                    <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{teamPlayers.length} Spieler</span>
                  </header>
                  {teamPlayers.length === 0 ? (
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>Noch keine Spieler erfasst.</p>
                  ) : (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.75rem' }}>
                      {teamPlayers.map((player) => {
                        const edit = playerEdits[player.id];
                        const isEditing = Boolean(edit?.editing);
                        return (
                          <li
                            key={player.id}
                            style={{
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              background: 'rgba(12, 28, 48, 0.6)',
                              padding: '0.75rem 0.85rem'
                            }}
                          >
                            {isEditing ? (
                              <form
                                onSubmit={(event) => {
                                  event.preventDefault();
                                  handlePlayerUpdateSubmit(player.id);
                                }}
                                style={{ display: 'grid', gap: '0.6rem' }}
                              >
                                <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                                  <input
                                    value={edit.name}
                                    onChange={(event) => handlePlayerEditChange(player.id, 'name', event.target.value)}
                                    placeholder="Name"
                                    required
                                  />
                                  <input
                                    value={edit.jerseyNumber}
                                    onChange={(event) => handlePlayerEditChange(player.id, 'jerseyNumber', event.target.value)}
                                    placeholder="Nr."
                                  />
                                  <input
                                    value={edit.position}
                                    onChange={(event) => handlePlayerEditChange(player.id, 'position', event.target.value)}
                                    placeholder="Position"
                                  />
                                  <select
                                    value={edit.teamId}
                                    onChange={(event) => handlePlayerEditChange(player.id, 'teamId', event.target.value)}
                                  >
                                    <option value="">Team wählen</option>
                                    {teams.map((otherTeam) => (
                                      <option key={otherTeam.id} value={otherTeam.id}>
                                        {otherTeam.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <button type="submit">Speichern</button>
                                  <button type="button" onClick={() => cancelPlayerEdit(player.id)}>
                                    Abbrechen
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <div style={{ display: 'grid', gap: '0.2rem' }}>
                                  <div style={{ fontWeight: 600 }}>
                                    {player.name}
                                    {player.jersey_number != null ? ` · #${player.jersey_number}` : ''}
                                  </div>
                                  {player.position ? (
                                    <span style={{ fontSize: '0.8rem', opacity: 0.75 }}>{player.position}</span>
                                  ) : null}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <button type="button" onClick={() => startPlayerEdit(player)}>
                                    Bearbeiten
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handlePlayerDelete(player.id)}
                                    style={{ background: 'rgba(211,47,47,0.85)', color: '#fff' }}
                                  >
                                    Löschen
                                  </button>
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </article>
              );
            })}

            {unassignedPlayers.length > 0 ? (
              <article
                style={{
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.05)',
                  padding: '1rem 1.2rem',
                  display: 'grid',
                  gap: '0.6rem'
                }}
              >
                <strong>Unzugeordnete Spieler</strong>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.35rem' }}>
                  {unassignedPlayers.map((player) => (
                    <li key={player.id} style={{ opacity: 0.8 }}>
                      {player.name}
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}
          </div>
        )}
      </PanelCard>
    </div>
  );
}
