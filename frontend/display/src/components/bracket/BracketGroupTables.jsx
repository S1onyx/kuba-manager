import { useTranslation } from 'react-i18next';
import { formatGroupLabel } from '../../utils/formatting.js';

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

function formatStatus(t, status) {
  if (status === 'qualified') return t('bracket.status.qualified');
  if (status === 'in_position') return t('bracket.status.inPosition');
  if (status === 'contender') return t('bracket.status.contender');
  return '—';
}

export default function BracketGroupTables({ groups }) {
  const { t } = useTranslation();

  if (!Array.isArray(groups) || groups.length === 0) {
    return (
      <section style={containerStyle}>
        <h2 style={{ margin: 0, fontSize: 'clamp(1.3rem, 2.6vw, 1.8rem)', letterSpacing: '0.06em' }}>
          {t('bracket.groupStage')}
        </h2>
        <p style={{ margin: 0, opacity: 0.8 }}>{t('bracket.noGroupData')}</p>
      </section>
    );
  }

  return (
    <section style={containerStyle}>
      <h2 style={{ margin: 0, fontSize: 'clamp(1.3rem, 2.6vw, 1.8rem)', letterSpacing: '0.06em' }}>
        {t('bracket.groupStage')}
      </h2>
      <div style={gridStyle}>
        {groups.map((group) => {
          const entries = group?.standings?.entries ?? [];
          const recorded = group?.standings?.recordedGamesCount ?? 0;
          const total = group?.standings?.totalMatches ?? 0;

          return (
            <article key={group.label || group.canonicalLabel || group.id} style={cardStyle}>
              <div>
                <h3 style={headerStyle}>
                  {formatGroupLabel(group.label ?? group.canonicalLabel, t)}
                </h3>
                <p style={metaStyle}>
                  {t('bracket.matchesCompleted', { recorded, total: total > 0 ? total : '—' })}
                </p>
              </div>
              {entries.length === 0 ? (
                <p style={{ margin: 0, opacity: 0.75 }}>{t('bracket.noResults')}</p>
              ) : (
                <div style={tableWrapperStyle}>
                  <table style={tableStyle}>
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
                        <th style={cellStyle}>{t('standings.colStatus')}</th>
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
                            <td style={{ ...cellStyle, color: statusColor }}>{formatStatus(t, entry.status)}</td>
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
