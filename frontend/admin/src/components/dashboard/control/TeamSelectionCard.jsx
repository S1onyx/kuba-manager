import PanelCard from '../../common/PanelCard.jsx';
import { useDashboard } from '../../../context/DashboardContext.jsx';

export default function TeamSelectionCard() {
  const {
    scoreboard: {
      teamForm,
      teamDirty,
      handleTeamInputChange,
      handleTeamSelectChange,
      handleTeamSubmit
    },
    teams: { teams, teamsLoading, teamsError }
  } = useDashboard();

  return (
    <PanelCard
      title="Teams auswählen"
      description="Wähle bestehende Teams oder verwalte freie Teamnamen für das Scoreboard."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleTeamSubmit();
        }}
        style={{ display: 'grid', gap: '1rem' }}
      >
        <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {[
            { idField: 'teamAId', nameField: 'teamAName', label: 'Team A' },
            { idField: 'teamBId', nameField: 'teamBName', label: 'Team B' }
          ].map(({ idField, nameField, label }) => {
            const currentId = teamForm[idField];
            const hasCurrentSelection = Boolean(currentId) && teams.some((team) => String(team.id) === currentId);
            return (
              <article key={idField} style={{ display: 'grid', gap: '0.65rem' }}>
                <label style={{ display: 'grid', gap: '0.3rem' }}>
                  {label} auswählen
                  <select
                    value={teamForm[idField]}
                    onChange={(event) => handleTeamSelectChange(idField, event.target.value, teams)}
                    disabled={teamsLoading}
                  >
                    <option value="">Freier Name</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                    {!hasCurrentSelection && currentId ? (
                      <option value={currentId}>
                        {teamForm[nameField] ? `${teamForm[nameField]} (nicht mehr verfügbar)` : 'Ehemaliges Team'}
                      </option>
                    ) : null}
                  </select>
                </label>

                <label style={{ display: 'grid', gap: '0.3rem' }}>
                  {label} Name
                  <input
                    value={teamForm[nameField]}
                    onChange={(event) => handleTeamInputChange(nameField, event.target.value)}
                    placeholder={`${label} Name`}
                  />
                </label>
              </article>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', alignItems: 'center' }}>
          {teamDirty ? (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Änderungen noch nicht übernommen.</span>
          ) : null}
          <button type="submit">Teams übernehmen</button>
        </div>
      </form>
      {teamsLoading ? <p style={{ margin: 0 }}>Teams werden geladen...</p> : null}
      {teamsError ? <p style={{ margin: 0, color: 'var(--warning)' }}>{teamsError}</p> : null}
    </PanelCard>
  );
}
