import { useTranslation } from 'react-i18next';
import { usePublicApp } from '../../context/PublicAppContext.jsx';
import { formatGroupLabel } from '../../utils/formatters.js';
import { formatStageLabelI18n } from '../../utils/stageLabels.js';
import CurrentMatchCard from '../CurrentMatchCard.jsx';
import GroupStandingsCard from '../GroupStandingsCard.jsx';
import RecentResults from '../RecentResults.jsx';
import SchedulePreview, { buildTimelineEntries } from '../SchedulePreview.jsx';
import IdleOverview from '../IdleOverview.jsx';
import { isMatchLive } from '../../utils/scheduleProgress.js';
import { useDateLocale } from '../../i18n/index.js';
import StatHighlights from '../StatHighlights.jsx';
import TeamOverview from '../TeamOverview.jsx';
import PlayerStatsTable from '../PlayerStatsTable.jsx';
import TournamentFinalOverview from '../TournamentFinalOverview.jsx';

export default function SummaryContent() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const {
    summary: {
      activeTab,
      tournamentSummary,
      showCurrentGroup,
      currentCardData,
      tournamentCompleted
    },
    scoreboardState: { scoreboard, currentGroupStandings, recordedGamesCount }
  } = usePublicApp();

  if (!tournamentSummary) {
    return null;
  }

  if (activeTab === 'live') {
    const entries = buildTimelineEntries(tournamentSummary.schedule, t, dateLocale);
    if (!isMatchLive(currentCardData, entries, tournamentSummary.tournament?.id)) {
      return (
        <IdleOverview
          entries={entries}
          recentGames={tournamentSummary.recentGames}
          tournamentCompleted={Boolean(tournamentCompleted)}
        />
      );
    }
    return (
      <section style={{ display: 'grid', gap: '1.5rem' }}>
        <CurrentMatchCard scoreboard={currentCardData} />
        {showCurrentGroup ? (
          <section style={{ display: 'grid', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', letterSpacing: '0.05em' }}>{t('summary.currentGroup')}</h3>
            <GroupStandingsCard
              group={{
                label: formatGroupLabel(scoreboard?.stageLabel, t),
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
    return (
      <SchedulePreview
        schedule={tournamentSummary.schedule}
        tournamentCompleted={Boolean(tournamentCompleted)}
        liveMatch={
          scoreboard?.tournamentId === tournamentSummary.tournament?.id && scoreboard?.scheduleCode
            ? {
                code: scoreboard.scheduleCode,
                durationSeconds: scoreboard.durationSeconds,
                remainingSeconds: scoreboard.remainingSeconds
              }
            : null
        }
      />
    );
  }

  if (activeTab === 'groups') {
    const groups = Array.isArray(tournamentSummary.groupStandings) ? tournamentSummary.groupStandings : [];
    if (groups.length === 0) {
      return <p style={{ opacity: 0.75 }}>{t('summary.noGroupResults')}</p>;
    }

    return (
      <section style={{ display: 'grid', gap: '1.25rem' }}>
        <h2 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.4rem)', letterSpacing: '0.05em' }}>{t('summary.groupsTitle')}</h2>
        <div
          style={{
            display: 'grid',
            gap: '1.25rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))'
          }}
        >
          {groups.map((group) => (
            <GroupStandingsCard
              key={group.canonicalLabel}
              group={{ ...group, label: formatStageLabelI18n(t, group.labelI18n, group.label) }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (activeTab === 'tournament') {
    return <StatHighlights totals={tournamentSummary.totals} />;
  }

  if (activeTab === 'teams') {
    return <TeamOverview summary={tournamentSummary} />;
  }

  if (activeTab === 'players') {
    return <PlayerStatsTable stats={tournamentSummary.playerStats} />;
  }

  return null;
}
