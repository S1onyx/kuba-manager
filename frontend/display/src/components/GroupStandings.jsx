const cellStyle = {
  border: '1px solid rgba(255,255,255,0.3)',
  padding: '0.5rem 0.75rem',
  textAlign: 'center'
};

export default function GroupStandings({ standings }) {
  if (!standings || standings.length === 0) {
    return <p style={{ textAlign: 'left' }}>Noch keine Ergebnisse vorhanden.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1.2rem' }}>
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
          </tr>
        </thead>
        <tbody>
          {standings.map((entry, index) => (
            <tr key={entry.team}>
              <td style={cellStyle}>{index + 1}</td>
              <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 600 }}>{entry.team}</td>
              <td style={cellStyle}>{entry.played}</td>
              <td style={cellStyle}>{entry.wins}</td>
              <td style={cellStyle}>{entry.draws}</td>
              <td style={cellStyle}>{entry.losses}</td>
              <td style={cellStyle}>{entry.goalsFor}:{entry.goalsAgainst}</td>
              <td style={cellStyle}>{entry.goalDiff}</td>
              <td style={cellStyle}>{entry.penalties}</td>
              <td style={cellStyle}>{entry.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
