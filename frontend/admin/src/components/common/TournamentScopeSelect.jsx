import { useTranslation } from 'react-i18next';
import PanelCard from './PanelCard.jsx';
import { useDashboard } from '../../context/DashboardContext.jsx';

export default function TournamentScopeSelect() {
  const { t } = useTranslation();
  const {
    tournaments: { tournaments },
    teamScope: { tournamentId, setTournamentId }
  } = useDashboard();

  return (
    <PanelCard title={t('teams.scopeTitle')} description={t('teams.scopeDescription')}>
      <select
        value={tournamentId ?? ''}
        onChange={(event) => setTournamentId(event.target.value ? Number(event.target.value) : null)}
        style={{ maxWidth: '360px' }}
      >
        {tournaments.map((tournament) => (
          <option key={tournament.id} value={tournament.id}>
            {tournament.name}
          </option>
        ))}
      </select>
    </PanelCard>
  );
}
