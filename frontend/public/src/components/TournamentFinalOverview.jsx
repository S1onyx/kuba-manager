const sectionStyle = {
  display: 'grid',
  gap: '1.5rem'
};

const panelStyle = {
  borderRadius: '14px',
  padding: '1.4rem 1.7rem',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)'
};

const placementTableStyle = {
  width: '100%',
  borderCollapse: 'collapse'
};

const leadersGridStyle = {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
};

function LeaderCard({ title, player, formatter }) {
  if (!player) {
    return null;
  }
  return (
    <article style={panelStyle}>
      <p style={{ margin: 0, opacity: 0.7, letterSpacing: '0.08em', fontSize: '0.8rem' }}>{title}</p>
      <h3 style={{ margin: '0.4rem 0 0.2rem', fontSize: '1.3rem' }}>{player.name}</h3>
      <p style={{ margin: 0, opacity: 0.75 }}>{player.teamName || 'Team'}</p>
      <strong style={{ display: 'block', marginTop: '0.5rem', fontSize: '1.4rem' }}>
        {formatter(player)}
      </strong>
    </article>
  );
}

export default function TournamentFinalOverview({ summary }) {
  if (!summary) {
    return (
      <section style={sectionStyle}>
        <p style={{ opacity: 0.75 }}>Noch keine Abschlussdaten vorhanden.</p>
      </section>
    );
  }

  const placements = summary.finalPlacements ?? [];
  const champion = placements[0];
  const runnerUp = placements[1];
  const leaders = summary.playerStats?.leaders ?? {};

  return (
    <section style={sectionStyle}>
      <header>
        <h2 style={{ margin: 0, fontSize: '1.4rem', letterSpacing: '0.05em' }}>Turnierende</h2>
        <p style={{ margin: '0.35rem 0 0', opacity: 0.75 }}>
          Finale Platzierungen, Siegerinformationen und herausragende Spieler des Turniers.
        </p>
      </header>

      {champion ? (
        <article style={{ ...panelStyle, textAlign: 'center' }}>
          <p style={{ margin: 0, letterSpacing: '0.2em', fontSize: '0.85rem', opacity: 0.7 }}>Champion</p>
          <h3 style={{ fontSize: '2rem', margin: '0.35rem 0' }}>{champion.teamName}</h3>
          <p style={{ margin: 0, opacity: 0.75 }}>
            {champion.decidedBy ? `Entschieden im ${champion.decidedBy}` : 'Finalsieg'}
            {champion.score ? ` · ${champion.score}` : ''}
          </p>
          {runnerUp ? (
            <p style={{ margin: '0.4rem 0 0', opacity: 0.7 }}>
              <strong>Runner-Up:</strong> {runnerUp.teamName}
            </p>
          ) : null}
        </article>
      ) : null}

      {placements.length > 0 ? (
        <article style={panelStyle}>
          <h3 style={{ marginTop: 0, fontSize: '1.2rem' }}>Platzierungen</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={placementTableStyle}>
              <thead style={{ opacity: 0.7, fontSize: '0.85rem' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.4rem' }}>Platz</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.4rem' }}>Team</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.4rem' }}>Entscheidung</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.4rem' }}>Gegner</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.4rem' }}>Ergebnis</th>
                </tr>
              </thead>
              <tbody>
                {placements.map((entry) => (
                  <tr key={`${entry.teamName}-${entry.placement}`} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <td style={{ padding: '0.5rem 0.4rem', fontWeight: 700 }}>#{entry.placement}</td>
                    <td style={{ padding: '0.5rem 0.4rem' }}>{entry.teamName}</td>
                    <td style={{ padding: '0.5rem 0.4rem', opacity: 0.75 }}>{entry.decidedBy || 'Gesamtbilanz'}</td>
                    <td style={{ padding: '0.5rem 0.4rem', opacity: 0.75 }}>{entry.opponent || '—'}</td>
                    <td style={{ padding: '0.5rem 0.4rem', opacity: 0.75 }}>{entry.score || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}

      <section style={leadersGridStyle}>
        <LeaderCard
          title="Topscorer"
          player={leaders.topScorers?.[0]}
          formatter={(player) => `${player.points ?? 0} Punkte`}
        />
        <LeaderCard
          title="Dreier-Spezialist"
          player={leaders.topThreePointers?.[0]}
          formatter={(player) => `${player.breakdown?.['3'] ?? 0} Dreier`}
        />
        <LeaderCard
          title="Strafsekunden"
          player={leaders.mostPenalized?.[0]}
          formatter={(player) => `${player.penaltySeconds ?? 0} Sek.`}
        />
      </section>
    </section>
  );
}
