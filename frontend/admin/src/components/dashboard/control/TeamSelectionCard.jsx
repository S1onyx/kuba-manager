import { useTranslation } from 'react-i18next';
import PanelCard from '../../common/PanelCard.jsx';
import { useDashboard } from '../../../context/DashboardContext.jsx';

export default function TeamSelectionCard() {
  const { t } = useTranslation();
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
      title={t('control.teamSelection.title')}
      description={t('control.teamSelection.description')}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleTeamSubmit();
        }}
        style={{ display: 'grid', gap: '1rem' }}
      >
        <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))' }}>
          {[
            { idField: 'teamAId', nameField: 'teamAName', teamKey: 'teamA' },
            { idField: 'teamBId', nameField: 'teamBName', teamKey: 'teamB' }
          ].map(({ idField, nameField, teamKey }) => {
            const teamLabel = t(`common.${teamKey}`);
            const currentId = teamForm[idField];
            const hasCurrentSelection = Boolean(currentId) && teams.some((team) => String(team.id) === currentId);
            return (
              <article key={idField} style={{ display: 'grid', gap: '0.65rem' }}>
                <label style={{ display: 'grid', gap: '0.3rem' }}>
                  {t('control.teamSelection.selectLabel', { team: teamLabel })}
                  <select
                    value={teamForm[idField]}
                    onChange={(event) => handleTeamSelectChange(idField, event.target.value, teams)}
                    disabled={teamsLoading}
                  >
                    <option value="">{t('control.teamSelection.freeName')}</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                    {!hasCurrentSelection && currentId ? (
                      <option value={currentId}>
                        {teamForm[nameField]
                          ? t('control.teamSelection.notAvailable', { name: teamForm[nameField] })
                          : t('control.teamSelection.formerTeam')}
                      </option>
                    ) : null}
                  </select>
                </label>

                <label style={{ display: 'grid', gap: '0.3rem' }}>
                  {t('control.teamSelection.nameLabel', { team: teamLabel })}
                  <input
                    value={teamForm[nameField]}
                    onChange={(event) => handleTeamInputChange(nameField, event.target.value)}
                    placeholder={t('control.teamSelection.nameLabel', { team: teamLabel })}
                  />
                </label>
              </article>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', alignItems: 'center' }}>
          {teamDirty ? (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('control.teamSelection.dirtyHint')}</span>
          ) : null}
          <button type="submit">{t('control.teamSelection.submit')}</button>
        </div>
      </form>
      {teamsLoading ? <p style={{ margin: 0 }}>{t('control.teamSelection.loading')}</p> : null}
      {teamsError ? <p style={{ margin: 0, color: 'var(--warning)' }}>{teamsError}</p> : null}
    </PanelCard>
  );
}
