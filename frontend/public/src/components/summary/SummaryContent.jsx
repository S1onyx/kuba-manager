import { usePublicApp } from '../../context/PublicAppContext.jsx';
import { formatGroupLabel } from '../../utils/formatters.js';
import CurrentMatchCard from '../CurrentMatchCard.jsx';
import GroupStandingsCard from '../GroupStandingsCard.jsx';
import RecentResults from '../RecentResults.jsx';
import SchedulePreview from '../SchedulePreview.jsx';
import StatHighlights from '../StatHighlights.jsx';
import TeamStatsGrid from '../TeamStatsGrid.jsx';
import PlayerStatsTable from '../PlayerStatsTable.jsx';
import TournamentFinalOverview from '../TournamentFinalOverview.jsx';

export default function SummaryContent() {
  const {
    summary: {
      activeTab,
      tournamentSummary,
      showCurrentGroup,
      currentCardData
    },
    scoreboardState: { scoreboard, currentGroupStandings, recordedGamesCount }
  } = usePublicApp();

  if (!tournamentSummary) {
    return null;
  }

  if (activeTab === 'live') {
    return (
      <section style={{ display: 'grid', gap: '1.5rem' }}>
        <CurrentMatchCard scoreboard={currentCardData} />
        {showCurrentGroup ? (
          <section style={{ display: 'grid', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', letterSpacing: '0.05em' }}>Aktuelle Gruppentabelle</h3>
            <GroupStandingsCard
              group={{
                label: formatGroupLabel(scoreboard?.stageLabel),
                standings: currentGroupStandings,
                recordedGamesCount
              }}
            />
          </section>
        ) : null}
      </section>
    );
  }

  if (activeTab === 'final') {
    return <TournamentFinalOverview summary={tournamentSummary} />;
  }

  if (activeTab === 'results') {
    return <RecentResults games={tournamentSummary.recentGames} />;
  }

  if (activeTab === 'schedule') {
    return <SchedulePreview schedule={tournamentSummary.schedule} />;
  }

  if (activeTab === 'groups') {
    const groups = Array.isArray(tournamentSummary.groupStandings) ? tournamentSummary.groupStandings : [];
    if (groups.length === 0) {
      return <p style={{ opacity: 0.75 }}>Noch keine Gruppenergebnisse verfügbar.</p>;
    }

    return (
      <section style={{ display: 'grid', gap: '1.25rem' }}>
        <h2 style={{ fontSize: '1.4rem', letterSpacing: '0.05em' }}>Gruppenübersicht</h2>
        <div
          style={{
            display: 'grid',
            gap: '1.25rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))'
          }}
        >
          {groups.map((group) => (
            <GroupStandingsCard key={group.canonicalLabel} group={group} />
          ))}
        </div>
      </section>
    );
  }

  if (activeTab === 'tournament') {
    return <StatHighlights totals={tournamentSummary.totals} />;
  }

  if (activeTab === 'teams') {
    return <TeamStatsGrid stats={tournamentSummary.overallStats} />;
  }

  if (activeTab === 'players') {
    return <PlayerStatsTable stats={tournamentSummary.playerStats} />;
  }

  return null;
}
