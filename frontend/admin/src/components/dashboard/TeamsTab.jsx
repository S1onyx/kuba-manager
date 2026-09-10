import { useTranslation } from 'react-i18next';
import PanelCard from '../common/PanelCard.jsx';
import { useDashboard } from '../../context/DashboardContext.jsx';

export default function TeamsTab() {
  const { t } = useTranslation();
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
    <div className="tab-container">
      <PanelCard
        title={t('teams.organizeTitle')}
        description={t('teams.organizeDescription')}
      >
        <form
          onSubmit={handleTeamCreateSubmit}
          style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}
        >
          <input
            value={teamCreateName}
            onChange={(event) => setTeamCreateName(event.target.value)}
            placeholder={t('teams.namePlaceholder')}
            style={{ flex: '1 1 260px' }}
          />
          <button type="submit">{t('teams.create')}</button>
        </form>
      </PanelCard>

      <PanelCard
        title={t('teams.listTitle')}
        description={t('teams.listDescription')}
      >
        {teamsLoading ? (
          <p style={{ margin: 0 }}>{t('teams.loading')}</p>
        ) : teamsError ? (
          <p style={{ margin: 0, color: 'var(--warning)' }}>{teamsError}</p>
        ) : teams.length === 0 ? (
          <p style={{ margin: 0 }}>{t('teams.empty')}</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            {teams.map((team) => {
              const edit = teamEdits[team.id];
              const isEditing = Boolean(edit);
              return (
                <article key={team.id} className="card-item--flat">
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
                          {t('common.save')}
                        </button>
                        <button type="button" onClick={() => cancelTeamEdit(team.id)}>
                          {t('common.cancel')}
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => startTeamEdit(team)}>
                          {t('common.edit')}
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => handleTeamDelete(team.id)}
                        >
                          {t('common.delete')}
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
