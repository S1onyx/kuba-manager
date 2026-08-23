import { useTranslation } from 'react-i18next';

const pageStyle = {
  width: '100%',
  maxWidth: '1600px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 4vw, 3rem)',
  gap: 'clamp(1.25rem, 4vw, 2rem)',
  boxSizing: 'border-box',
  color: '#ffffff'
};

const panelStyle = {
  width: '100%',
  borderRadius: '18px',
  padding: 'clamp(1.1rem, 3.5vw, 1.75rem)',
  background: 'rgba(5, 18, 35, 0.55)',
  boxShadow: '0 12px 28px rgba(0,0,0,0.3)'
};

const placementTableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'
};

const leaderGridStyle = {
  display: 'grid',
  gap: 'clamp(1rem, 3vw, 1.5rem)',
  width: '100%',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))'
};

function LeaderCard({ title, player, formatter, teamFallback }) {
  if (!player) {
    return null;
  }
  return (
    <article style={{ ...panelStyle, padding: 'clamp(1rem, 3vw, 1.4rem)' }}>
      <p style={{ margin: 0, opacity: 0.7, letterSpacing: '0.12em', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}>{title}</p>
      <h3 style={{ margin: '0.3rem 0 0.2rem', fontSize: 'clamp(1.2rem, 3vw, 1.4rem)' }}>{player.name}</h3>
      <p style={{ margin: 0, opacity: 0.75 }}>{player.teamName || teamFallback}</p>
      <strong style={{ display: 'block', marginTop: '0.5rem', fontSize: 'clamp(1.3rem, 3vw, 1.6rem)' }}>
        {formatter(player)}
      </strong>
    </article>
  );
}

export default function TournamentSummaryView({ scoreboard, summary, loading, error }) {
  const { t } = useTranslation();
  const tournamentName =
    scoreboard?.tournamentName || summary?.tournament?.name || t('summary.defaultTournamentName');

  if (loading) {
    return (
      <div style={pageStyle}>
        <p style={{ fontSize: '1.4rem', opacity: 0.8 }}>{t('summary.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <p style={{ fontSize: '1.4rem', color: '#ff8a80' }}>{error}</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div style={pageStyle}>
        <p style={{ fontSize: '1.4rem', opacity: 0.8 }}>{t('summary.empty')}</p>
      </div>
    );
  }

  const placements = summary.finalPlacements ?? [];
  const champion = placements[0];
  const runnerUp = placements[1];
  const leaders = summary.playerStats?.leaders ?? {};
  const bestScorer = leaders.topScorers?.[0];
  const clutchShooter = leaders.topThreePointers?.[0];
  const disciplined = leaders.mostPenalized?.[0];

  // Backend liefert sprachneutrale Codes (decidedByCode); das rohe decidedBy
  // (deutsches Label aus dem Spielplan) bleibt als Fallback.
  const formatDecidedBy = (entry) => {
    if (entry?.decidedByCode === 'overall_standings') return t('summary.overallStandings');
    if (entry?.decidedByCode === 'final') return t('stage.knockoutFinal');
    return entry?.decidedBy || t('summary.overallStandings');
  };

  return (
    <div style={pageStyle}>
      <header style={{ textAlign: 'center' }}>
        <p style={{ letterSpacing: '0.35em', fontSize: 'clamp(0.75rem, 2.2vw, 0.95rem)', opacity: 0.7, textTransform: 'uppercase' }}>
          {t('summary.title')}
        </p>
        <h1 style={{ fontSize: 'clamp(2.4rem, 6vw, 3.9rem)', letterSpacing: '0.08em', margin: '0.5rem 0' }}>{tournamentName}</h1>
        <p style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', opacity: 0.8 }}>
          {t('summary.description')}
        </p>
      </header>

      {champion ? (
        <section style={{ ...panelStyle, textAlign: 'center' }}>
          <p style={{ margin: 0, letterSpacing: '0.3em', fontSize: 'clamp(0.78rem, 2vw, 0.9rem)', opacity: 0.7 }}>{t('summary.champion')}</p>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', margin: '0.4rem 0' }}>{champion.teamName}</h2>
          <p style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)', opacity: 0.8, margin: 0 }}>
            {champion.decidedBy
              ? t('summary.championDecidedBy', { method: formatDecidedBy(champion) })
              : t('summary.championFinalWin')}
            {champion.score ? ` · ${t('summary.score', { score: champion.score })}` : ''}
          </p>
          {runnerUp ? (
            <p style={{ margin: '0.4rem 0 0', opacity: 0.7 }}>
              <strong>{t('summary.runnerUp')}</strong> {runnerUp.teamName}
            </p>
          ) : null}
        </section>
      ) : null}

      {placements.length > 0 ? (
        <section style={panelStyle}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: 'clamp(1.2rem, 3vw, 1.5rem)' }}>{t('summary.placementsTitle')}</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={placementTableStyle}>
              <thead style={{ opacity: 0.75, fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>{t('summary.colPlacement')}</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>{t('summary.colTeam')}</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>{t('summary.colDecision')}</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>{t('summary.colOpponent')}</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>{t('summary.colResult')}</th>
                </tr>
              </thead>
              <tbody>
                {placements.map((entry) => (
                  <tr key={`${entry.teamName}-${entry.placement}`} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700 }}>#{entry.placement}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>{entry.teamName}</td>
                    <td style={{ padding: '0.6rem 0.75rem', opacity: 0.8 }}>
                      {formatDecidedBy(entry)}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', opacity: 0.8 }}>{entry.opponent || '—'}</td>
                    <td style={{ padding: '0.6rem 0.75rem', opacity: 0.8 }}>{entry.score || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section style={leaderGridStyle}>
        <LeaderCard
          title={t('summary.topScorer')}
          player={bestScorer}
          teamFallback={t('summary.teamFallback')}
          formatter={(player) => t('summary.points', { count: player.points ?? 0 })}
        />
        <LeaderCard
          title={t('summary.threePointSpecialist')}
          player={clutchShooter}
          teamFallback={t('summary.teamFallback')}
          formatter={(player) => t('summary.threes', { count: player.breakdown?.['3'] ?? 0 })}
        />
        <LeaderCard
          title={t('summary.penaltyKing')}
          player={disciplined}
          teamFallback={t('summary.teamFallback')}
          formatter={(player) => t('summary.penaltySeconds', { count: player.penaltySeconds ?? 0 })}
        />
      </section>
    </div>
  );
}
