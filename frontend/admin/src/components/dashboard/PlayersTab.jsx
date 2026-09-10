import { useTranslation } from 'react-i18next';
import PanelCard from '../common/PanelCard.jsx';
import { useDashboard } from '../../context/DashboardContext.jsx';

export default function PlayersTab() {
  const { t } = useTranslation();
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
    <div className="tab-container">
      <PanelCard
        title={t('players.createTitle')}
        description={t('players.createDescription')}
      >
        <form onSubmit={handlePlayerCreateSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div className="form-grid">
            <label className="form-field">
              {t('players.team')}
              <select
                value={playerCreate.teamId}
                onChange={(event) => handlePlayerCreateChange('teamId', event.target.value)}
                required
              >
                <option value="">{t('players.selectTeam')}</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              {t('players.playerName')}
              <input
                value={playerCreate.name}
                onChange={(event) => handlePlayerCreateChange('name', event.target.value)}
                placeholder={t('players.namePlaceholder')}
                required
              />
            </label>
            <label className="form-field">
              {t('players.jerseyNumber')}
              <input
                value={playerCreate.jerseyNumber}
                onChange={(event) => handlePlayerCreateChange('jerseyNumber', event.target.value)}
                placeholder={t('players.jerseyPlaceholder')}
              />
            </label>
            <label className="form-field">
              {t('players.positionOptional')}
              <input
                value={playerCreate.position}
                onChange={(event) => handlePlayerCreateChange('position', event.target.value)}
                placeholder={t('players.positionPlaceholder')}
              />
            </label>
          </div>
          <div>
            <button type="submit">{t('players.create')}</button>
          </div>
        </form>
      </PanelCard>

      <PanelCard
        title={t('players.listTitle')}
        description={t('players.listDescription')}
      >
        {playersLoading ? (
          <p className="status-text">{t('players.loading')}</p>
        ) : playersError ? (
          <p className="status-text status-text--error">{playersError}</p>
        ) : (
          <div style={{ display: 'grid', gap: '1.2rem' }}>
            {teams.map((team) => {
              const teamPlayers = playersByTeam.get(String(team.id)) ?? [];
              return (
                <article key={team.id} className="card-item">
                  <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{team.name}</strong>
                    <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{t('players.count', { count: teamPlayers.length })}</span>
                  </header>
                  {teamPlayers.length === 0 ? (
                    <p className="status-text status-text--muted">{t('players.empty')}</p>
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
                                <div className="form-grid">
                                  <input
                                    value={edit.name}
                                    onChange={(event) => handlePlayerEditChange(player.id, 'name', event.target.value)}
                                    placeholder={t('players.namePlaceholder')}
                                    required
                                  />
                                  <input
                                    value={edit.jerseyNumber}
                                    onChange={(event) => handlePlayerEditChange(player.id, 'jerseyNumber', event.target.value)}
                                    placeholder={t('players.jerseyShort')}
                                  />
                                  <input
                                    value={edit.position}
                                    onChange={(event) => handlePlayerEditChange(player.id, 'position', event.target.value)}
                                    placeholder={t('players.position')}
                                  />
                                  <select
                                    value={edit.teamId}
                                    onChange={(event) => handlePlayerEditChange(player.id, 'teamId', event.target.value)}
                                  >
                                    <option value="">{t('players.selectTeam')}</option>
                                    {teams.map((otherTeam) => (
                                      <option key={otherTeam.id} value={otherTeam.id}>
                                        {otherTeam.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="btn-row">
                                  <button type="submit">{t('common.save')}</button>
                                  <button type="button" onClick={() => cancelPlayerEdit(player.id)}>
                                    {t('common.cancel')}
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
                                <div className="btn-row">
                                  <button type="button" onClick={() => startPlayerEdit(player)}>
                                    {t('common.edit')}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-danger"
                                    onClick={() => handlePlayerDelete(player.id)}
                                  >
                                    {t('common.delete')}
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
                <strong>{t('players.unassigned')}</strong>
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
