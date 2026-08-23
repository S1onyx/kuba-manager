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
    <div style={{ display: 'grid', gap: '1.75rem' }}>
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
                <article
                  key={team.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
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
                          onClick={() => handleTeamDelete(team.id)}
                          style={{ background: 'rgba(211,47,47,0.85)', color: '#fff' }}
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
