import { useEffect, useRef, useState } from 'react';

const wrapperStyle = {
  background: 'rgba(0,0,0,0.38)',
  borderRadius: '20px',
  padding: '1.25rem 1.5rem',
  display: 'grid',
  gap: '1rem',
  minWidth: 0
};

const cellStyle = {
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  padding: '0.4rem 0.5rem',
  textAlign: 'center',
  fontSize: '0.95rem'
};

const headerCellStyle = {
  ...cellStyle,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontSize: '0.75rem',
  opacity: 0.7,
  borderBottom: '1px solid rgba(255,255,255,0.18)'
};

const responsiveStyles = `
  @media (max-width: 768px) {
    .group-card {
      padding: 1.1rem 1.25rem;
      gap: 0.9rem;
    }
    .group-card__header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.4rem;
    }
    .group-card table {
      font-size: 0.85rem;
    }
  }

  @media (max-width: 480px) {
    .group-card {
      padding: 1rem;
    }
    .group-card table thead th,
    .group-card table tbody td {
      padding: 0.35rem;
    }
    .group-card table thead th {
      font-size: 0.7rem;
    }
  }
`;

export default function GroupStandingsCard({ group }) {
  const standings = group?.standings ?? [];
  const label = group?.label ?? 'Gruppe';
  const recordedGamesCount = group?.recordedGamesCount ?? 0;
  const scrollRef = useRef(null);
  const [isScrollable, setScrollable] = useState(false);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) {
      setScrollable(false);
      return;
    }

    const checkScrollable = () => {
      setScrollable(node.scrollWidth > node.clientWidth + 2);
    };

    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    return () => window.removeEventListener('resize', checkScrollable);
  }, [standings]);

  return (
    <>
      <section className="group-card" style={wrapperStyle}>
        <header
          className="group-card__header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
        >
          <h3 style={{ fontSize: '1.1rem', letterSpacing: '0.05em' }}>{label}</h3>
          <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Spiele: {recordedGamesCount}</span>
        </header>

      {standings.length === 0 ? (
        <p style={{ fontSize: '0.95rem', opacity: 0.75 }}>Noch keine Ergebnisse in dieser Gruppe.</p>
      ) : (
        <div
          ref={scrollRef}
          style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative' }}
        >
          <table>
            <thead>
              <tr>
                <th style={headerCellStyle}>#</th>
                <th style={{ ...headerCellStyle, textAlign: 'left' }}>Team</th>
                <th style={headerCellStyle}>Sp</th>
                <th style={headerCellStyle}>S</th>
                <th style={headerCellStyle}>U</th>
                <th style={headerCellStyle}>N</th>
                <th style={headerCellStyle}>Tore</th>
                <th style={headerCellStyle}>Diff</th>
                <th style={headerCellStyle}>Strafen</th>
                <th style={headerCellStyle}>Pkt</th>
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
                  <td style={cellStyle}>
                    {entry.goalsFor}:{entry.goalsAgainst}
                  </td>
                  <td style={cellStyle}>{entry.goalDiff}</td>
                  <td style={cellStyle}>{entry.penalties}</td>
                  <td style={cellStyle}>{entry.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {isScrollable ? (
        <div
          style={{
            marginTop: '0.4rem',
            fontSize: '0.8rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            opacity: 0.65,
            display: 'flex',
            gap: '0.4rem',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '1rem' }}>↔</span>
          <span>Zum Scrollen wischen</span>
        </div>
      ) : null}
      </section>
      <style>{responsiveStyles}</style>
    </>
  );
}
