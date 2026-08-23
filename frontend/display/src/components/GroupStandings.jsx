import { useTranslation } from 'react-i18next';

const cellStyle = {
  border: '1px solid rgba(255,255,255,0.3)',
  padding: '0.5rem 0.75rem',
  textAlign: 'center'
};

export default function GroupStandings({ standings }) {
  const { t } = useTranslation();

  if (!standings || standings.length === 0) {
    return <p style={{ textAlign: 'left' }}>{t('standings.noResults')}</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 'clamp(0.9rem, 1.2vw, 1.2rem)'
        }}
      >
        <thead>
          <tr>
            <th style={cellStyle}>{t('standings.colRank')}</th>
            <th style={{ ...cellStyle, textAlign: 'left' }}>{t('standings.colTeam')}</th>
            <th style={cellStyle}>{t('standings.colPlayed')}</th>
            <th style={cellStyle}>{t('standings.colWon')}</th>
            <th style={cellStyle}>{t('standings.colDrawn')}</th>
            <th style={cellStyle}>{t('standings.colLost')}</th>
            <th style={cellStyle}>{t('standings.colGoals')}</th>
            <th style={cellStyle}>{t('standings.colDiff')}</th>
            <th style={cellStyle}>{t('standings.colPenalties')}</th>
            <th style={cellStyle}>{t('standings.colPoints')}</th>
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
