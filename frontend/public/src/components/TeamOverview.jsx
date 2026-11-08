import { useTranslation } from 'react-i18next';
import { formatStageLabelI18n } from '../utils/stageLabels.js';

const gridStyle = {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))'
};

const cardStyle = {
  background: 'rgba(0,0,0,0.32)',
  borderRadius: '18px',
  padding: '1.1rem 1.25rem',
  display: 'grid',
  gap: '0.6rem',
  alignContent: 'start',
  boxShadow: '0 12px 28px rgba(0,0,0,0.28)'
};

const statLineStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.35rem 0.9rem',
  fontSize: '0.85rem',
  opacity: 0.85
};

const rosterStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gap: '0.3rem',
  fontSize: '0.92rem'
};

function sortRoster(a, b) {
  const jerseyA = Number.isFinite(Number(a.jerseyNumber)) && a.jerseyNumber !== null && a.jerseyNumber !== '' ? Number(a.jerseyNumber) : Infinity;
  const jerseyB = Number.isFinite(Number(b.jerseyNumber)) && b.jerseyNumber !== null && b.jerseyNumber !== '' ? Number(b.jerseyNumber) : Infinity;
  return jerseyA - jerseyB || String(a.name).localeCompare(String(b.name), 'de', { sensitivity: 'base' });
}

function TeamCard({ team, entry, roster, t }) {
  const played = (entry?.played ?? 0) > 0;
  return (
    <article style={cardStyle}>
      <strong style={{ fontSize: '1.1rem', letterSpacing: '0.04em', overflowWrap: 'anywhere' }}>{team}</strong>
      {played ? (
        <div style={statLineStyle}>
          <span>{t('teamOverview.points', { count: entry.points })}</span>
          <span>{t('teamOverview.record', { wins: entry.wins, draws: entry.draws, losses: entry.losses })}</span>
          <span>{t('teamOverview.baskets', { scored: entry.goalsFor, conceded: entry.goalsAgainst })}</span>
        </div>
      ) : null}
      {roster.length > 0 ? (
        <ul style={rosterStyle}>
          {roster.map((player) => (
            <li key={player.key ?? `${team}-${player.name}`} style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
              <span style={{ minWidth: '2.2rem', opacity: 0.65, fontVariantNumeric: 'tabular-nums' }}>
                {player.jerseyNumber !== null && player.jerseyNumber !== undefined && player.jerseyNumber !== '' ? `#${player.jerseyNumber}` : '–'}
              </span>
              <span style={{ flex: 1, overflowWrap: 'anywhere' }}>{player.name}</span>
              {(player.games ?? 0) > 0 ? (
                <span style={{ opacity: 0.75, fontSize: '0.85rem' }}>{t('teamOverview.playerPoints', { count: player.points ?? 0 })}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ margin: 0, opacity: 0.65, fontSize: '0.9rem' }}>{t('teamOverview.noRoster')}</p>
      )}
    </article>
  );
}

export default function TeamOverview({ summary }) {
  const { t } = useTranslation();
  const players = summary?.playerStats?.players ?? [];
  const rosterOf = (team) => players.filter((player) => player.teamName === team).sort(sortRoster);
  const groups = [...(summary?.groupStandings ?? [])].sort((a, b) =>
    String(a.canonicalLabel ?? a.label).localeCompare(String(b.canonicalLabel ?? b.label), 'de', { numeric: true })
  );
  const groupedTeams = new Set(groups.flatMap((group) => (group.standings ?? []).map((entry) => entry.team)));
  const otherTeams = [
    ...new Set([
      ...(summary?.overallStats ?? []).map((entry) => entry.team),
      ...players.map((player) => player.teamName)
    ])
  ].filter((team) => team && !groupedTeams.has(team));
  const anyPlayed = (summary?.totals?.totalGames ?? 0) > 0;
  const statsByTeam = new Map((summary?.overallStats ?? []).map((entry) => [entry.team, entry]));

  if (groups.length === 0 && otherTeams.length === 0) {
    return <p style={{ opacity: 0.75 }}>{t('teamOverview.empty')}</p>;
  }

  return (
    <section style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'grid', gap: '0.35rem' }}>
        <h2 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.4rem)', letterSpacing: '0.05em', margin: 0 }}>{t('teamOverview.title')}</h2>
        <p style={{ margin: 0, opacity: 0.75, fontSize: '0.95rem' }}>{t(anyPlayed ? 'teamOverview.descriptionPlayed' : 'teamOverview.description')}</p>
      </header>
      {groups.map((group) => (
        <section key={group.canonicalLabel ?? group.label} style={{ display: 'grid', gap: '0.8rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.9 }}>
            {formatStageLabelI18n(t, group.labelI18n, group.label)}
          </h3>
          <div style={gridStyle}>
            {(group.standings ?? []).map((entry) => (
              <TeamCard key={entry.team} team={entry.team} entry={statsByTeam.get(entry.team) ?? entry} roster={rosterOf(entry.team)} t={t} />
            ))}
          </div>
        </section>
      ))}
      {otherTeams.length > 0 ? (
        <div style={gridStyle}>
          {otherTeams.map((team) => (
            <TeamCard key={team} team={team} entry={statsByTeam.get(team)} roster={rosterOf(team)} t={t} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
