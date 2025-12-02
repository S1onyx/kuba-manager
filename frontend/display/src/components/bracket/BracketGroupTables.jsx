const containerStyle = {
  width: '100%',
  display: 'grid',
  gap: 'clamp(1.2rem, 3vw, 1.5rem)'
};

const gridStyle = {
  display: 'grid',
  gap: 'clamp(1rem, 3vw, 1.5rem)',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))'
};

const cardStyle = {
  padding: 'clamp(1rem, 2.5vw, 1.25rem)',
  borderRadius: '18px',
  background: 'rgba(0, 0, 0, 0.28)',
  boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
  backdropFilter: 'blur(6px)',
  display: 'grid',
  gap: '0.75rem'
};

const headerStyle = {
  margin: 0,
  fontSize: 'clamp(1.1rem, 2.6vw, 1.4rem)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em'
};

const metaStyle = {
  margin: 0,
  fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
  opacity: 0.75,
  letterSpacing: '0.04em'
};

const tableWrapperStyle = {
  overflowX: 'auto'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 'clamp(0.85rem, 2vw, 0.95rem)'
};

const cellStyle = {
  border: '1px solid rgba(255,255,255,0.25)',
  padding: '0.45rem 0.6rem',
  textAlign: 'center'
};

const statusColors = {
  qualified: '#9effa8',
  in_position: '#ffe082',
  contender: '#80d8ff'
};

function formatStatus(status) {
  if (status === 'qualified') return 'qualifiziert';
  if (status === 'in_position') return 'auf Kurs';
  if (status === 'contender') return 'verfolgt';
  return '—';
}

export default function BracketGroupTables({ groups }) {
  if (!Array.isArray(groups) || groups.length === 0) {
    return (
      <section style={containerStyle}>
        <h2 style={{ margin: 0, fontSize: 'clamp(1.3rem, 2.6vw, 1.8rem)', letterSpacing: '0.06em' }}>
          Gruppenphase
        </h2>
        <p style={{ margin: 0, opacity: 0.8 }}>Noch keine Gruppendaten vorhanden.</p>
      </section>
    );
  }

  return (
    <section style={containerStyle}>
      <h2 style={{ margin: 0, fontSize: 'clamp(1.3rem, 2.6vw, 1.8rem)', letterSpacing: '0.06em' }}>
        Gruppenphase
      </h2>
      <div style={gridStyle}>
        {groups.map((group) => {
          const entries = group?.standings?.entries ?? [];
          const recorded = group?.standings?.recordedGamesCount ?? 0;
          const total = group?.standings?.totalMatches ?? 0;

          return (
            <article key={group.label || group.canonicalLabel || group.id} style={cardStyle}>
              <div>
                <h3 style={headerStyle}>{group.label || `Gruppe ${group.canonicalLabel ?? ''}`}</h3>
                <p style={metaStyle}>
                  Spiele abgeschlossen: {recorded}/{total > 0 ? total : '—'}
                </p>
              </div>
              {entries.length === 0 ? (
                <p style={{ margin: 0, opacity: 0.75 }}>Keine Ergebnisse gespeichert.</p>
              ) : (
                <div style={tableWrapperStyle}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={cellStyle}>#</th>
                        <th style={{ ...cellStyle, textAlign: 'left' }}>Team</th>
                        <th style={cellStyle}>Spiele</th>
                        <th style={cellStyle}>S</th>
                        <th style={cellStyle}>U</th>
                        <th style={cellStyle}>N</th>
                        <th style={cellStyle}>Tore</th>
                        <th style={cellStyle}>Diff</th>
                        <th style={cellStyle}>Strafen</th>
                        <th style={cellStyle}>Punkte</th>
                        <th style={cellStyle}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => {
                        const statusColor = statusColors[entry.status] || 'rgba(255,255,255,0.6)';
                        return (
                          <tr key={`${group.label}-${entry.position}-${entry.team || entry.placeholder || entry.position}`}>
                            <td style={cellStyle}>{entry.position}</td>
                            <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 600 }}>{entry.team || entry.placeholder || '—'}</td>
                            <td style={cellStyle}>{entry.played}</td>
                            <td style={cellStyle}>{entry.wins}</td>
                            <td style={cellStyle}>{entry.draws}</td>
                            <td style={cellStyle}>{entry.losses}</td>
                            <td style={cellStyle}>{entry.goalsFor}:{entry.goalsAgainst}</td>
                            <td style={cellStyle}>{entry.goalDiff}</td>
                            <td style={cellStyle}>{entry.penalties}</td>
                            <td style={cellStyle}>{entry.points}</td>
                            <td style={{ ...cellStyle, color: statusColor }}>{formatStatus(entry.status)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
