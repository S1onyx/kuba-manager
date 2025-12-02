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

function LeaderCard({ title, player, formatter }) {
  if (!player) {
    return null;
  }
  return (
    <article style={{ ...panelStyle, padding: 'clamp(1rem, 3vw, 1.4rem)' }}>
      <p style={{ margin: 0, opacity: 0.7, letterSpacing: '0.12em', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}>{title}</p>
      <h3 style={{ margin: '0.3rem 0 0.2rem', fontSize: 'clamp(1.2rem, 3vw, 1.4rem)' }}>{player.name}</h3>
      <p style={{ margin: 0, opacity: 0.75 }}>{player.teamName || 'Team'}</p>
      <strong style={{ display: 'block', marginTop: '0.5rem', fontSize: 'clamp(1.3rem, 3vw, 1.6rem)' }}>
        {formatter(player)}
      </strong>
    </article>
  );
}

export default function TournamentSummaryView({ scoreboard, summary, loading, error }) {
  const tournamentName = scoreboard?.tournamentName || summary?.tournament?.name || 'Turnier';

  if (loading) {
    return (
      <div style={pageStyle}>
        <p style={{ fontSize: '1.4rem', opacity: 0.8 }}>Lade Abschlussübersicht…</p>
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
        <p style={{ fontSize: '1.4rem', opacity: 0.8 }}>
          Noch keine Abschlussdaten verfügbar. Bitte Turnier im Admin-Panel abschließen.
        </p>
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

  return (
    <div style={pageStyle}>
      <header style={{ textAlign: 'center' }}>
        <p style={{ letterSpacing: '0.35em', fontSize: 'clamp(0.75rem, 2.2vw, 0.95rem)', opacity: 0.7, textTransform: 'uppercase' }}>
          Turnierende
        </p>
        <h1 style={{ fontSize: 'clamp(2.4rem, 6vw, 3.9rem)', letterSpacing: '0.08em', margin: '0.5rem 0' }}>{tournamentName}</h1>
        <p style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', opacity: 0.8 }}>
          Abschlusstabelle, Finalplatzierungen und herausragende Spielerleistungen auf einen Blick.
        </p>
      </header>

      {champion ? (
        <section style={{ ...panelStyle, textAlign: 'center' }}>
          <p style={{ margin: 0, letterSpacing: '0.3em', fontSize: 'clamp(0.78rem, 2vw, 0.9rem)', opacity: 0.7 }}>Champion</p>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', margin: '0.4rem 0' }}>{champion.teamName}</h2>
          <p style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)', opacity: 0.8, margin: 0 }}>
            {champion.decidedBy ? `Entschieden im ${champion.decidedBy}` : 'Finalsieg'}
            {champion.score ? ` · Ergebnis ${champion.score}` : ''}
          </p>
          {runnerUp ? (
            <p style={{ margin: '0.4rem 0 0', opacity: 0.7 }}>
              <strong>Runner-Up:</strong> {runnerUp.teamName}
            </p>
          ) : null}
        </section>
      ) : null}

      {placements.length > 0 ? (
        <section style={panelStyle}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: 'clamp(1.2rem, 3vw, 1.5rem)' }}>Finale Platzierungen</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={placementTableStyle}>
              <thead style={{ opacity: 0.75, fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>Platz</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>Team</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>Entscheidung</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>Gegner</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>Ergebnis</th>
                </tr>
              </thead>
              <tbody>
                {placements.map((entry) => (
                  <tr key={`${entry.teamName}-${entry.placement}`} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700 }}>#{entry.placement}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>{entry.teamName}</td>
                    <td style={{ padding: '0.6rem 0.75rem', opacity: 0.8 }}>
                      {entry.decidedBy || 'Gesamtbilanz'}
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
          title="Topscorer"
          player={bestScorer}
          formatter={(player) => `${player.points ?? 0} Punkte`}
        />
        <LeaderCard
          title="Dreier-Spezialist"
          player={clutchShooter}
          formatter={(player) => `${player.breakdown?.['3'] ?? 0} Dreier`}
        />
        <LeaderCard
          title="Strafbank-König"
          player={disciplined}
          formatter={(player) => `${player.penaltySeconds ?? 0} Sek. Strafe`}
        />
      </section>
    </div>
  );
}
