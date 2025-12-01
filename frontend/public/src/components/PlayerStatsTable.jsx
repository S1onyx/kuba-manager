import { useMemo, useState } from 'react';

const gridLayout = {
  display: 'grid',
  gap: '1.15rem'
};

const leaderGridStyle = {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
};

const leaderCardStyle = {
  borderRadius: '16px',
  background: 'rgba(0, 0, 0, 0.25)',
  padding: '1rem 1.1rem',
  display: 'grid',
  gap: '0.4rem',
  boxShadow: '0 10px 22px rgba(0,0,0,0.25)'
};

const responsiveStyles = `
  .player-sort-button {
    font-weight: 600;
    letter-spacing: 0.03em;
  }

  .player-sort-button:hover {
    background: rgba(255,255,255,0.22) !important;
    border-color: rgba(255,255,255,0.55) !important;
  }

  .player-sort-button:focus-visible {
    outline: 2px solid rgba(255,255,255,0.9);
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    .player-leader__card {
      padding: 0.85rem 0.95rem;
    }
    .player-leader__name {
      font-size: 1rem;
    }
  }
`;

function LeaderList({ title, entries = [], valueLabel }) {
  if (!entries.length) {
    return null;
  }

  return (
    <article className="player-leader__card" style={leaderCardStyle}>
      <header style={{ display: 'grid', gap: '0.2rem' }}>
        <span style={{ fontSize: '0.75rem', opacity: 0.7, letterSpacing: '0.08em' }}>{title}</span>
      </header>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.4rem' }}>
        {entries.slice(0, 5).map((entry, index) => (
          <li key={`${title}-${entry.playerId ?? entry.name ?? index}`} style={{ display: 'grid', gap: '0.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>#{index + 1}</span>
              <strong className="player-leader__name" style={{ letterSpacing: '0.04em' }}>
                {entry.name}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', opacity: 0.8 }}>
              <span>{entry.teamName ?? 'Team'}</span>
              <span>{valueLabel(entry)}</span>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

const sortButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.35rem',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: '999px',
  padding: '0.25rem 0.65rem',
  margin: 0,
  color: 'inherit',
  font: 'inherit',
  cursor: 'pointer',
  transition: 'background 0.2s ease, border-color 0.2s ease',
  width: '100%'
};

const SORTABLE_KEYS = ['name', 'teamName', 'points', 'games', 'pointsPerGame', 'penalties', 'penaltySeconds'];

const getSortableValue = (player, key) => {
  if (key === 'name') {
    return String(player.name ?? '').toLowerCase();
  }
  if (key === 'teamName') {
    return String(player.teamName ?? '').toLowerCase();
  }
  return Number(player[key] ?? 0);
};

export default function PlayerStatsTable({ stats }) {
  const [sortConfig, setSortConfig] = useState({ key: 'points', direction: 'desc' });

  if (!stats) {
    return <p style={{ opacity: 0.75 }}>Noch keine Spielerstatistiken verfügbar.</p>;
  }

  const topScorers = stats.leaders?.topScorers ?? [];
  const mostPenalized = stats.leaders?.mostPenalized ?? [];
  const topThreePointers = stats.leaders?.topThreePointers ?? [];
  const allPlayers = stats.players ?? [];

  if (
    topScorers.length === 0 &&
    mostPenalized.length === 0 &&
    topThreePointers.length === 0 &&
    allPlayers.length === 0
  ) {
    return <p style={{ opacity: 0.75 }}>Noch keine Spielerstatistiken verfügbar.</p>;
  }

  const handleSortChange = (key) => {
    if (!SORTABLE_KEYS.includes(key)) {
      return;
    }

    setSortConfig((prev) => {
      if (prev?.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'desc' };
    });
  };

  const sortedPlayers = useMemo(() => {
    if (!Array.isArray(allPlayers)) {
      return [];
    }
    const entries = allPlayers.slice();
    const { key, direction } = sortConfig || {};
    if (!key || !SORTABLE_KEYS.includes(key)) {
      return entries;
    }
    const multiplier = direction === 'asc' ? 1 : -1;
    return entries.sort((a, b) => {
      const aVal = getSortableValue(a, key);
      const bVal = getSortableValue(b, key);
      if (typeof aVal === 'string' || typeof bVal === 'string') {
        return aVal.localeCompare(bVal, 'de', { sensitivity: 'base' }) * multiplier;
      }
      return (aVal - bVal) * multiplier;
    });
  }, [allPlayers, sortConfig]);

  const tableEntries = sortedPlayers;

  const renderSortIndicator = (key) => {
    if (sortConfig?.key !== key) {
      return null;
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const buildSortButtonStyle = (key, alignment = 'left') => ({
    ...sortButtonStyle,
    justifyContent: alignment === 'right' ? 'flex-end' : 'flex-start',
    textAlign: alignment === 'right' ? 'right' : 'left',
    background:
      sortConfig?.key === key ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
    borderColor:
      sortConfig?.key === key ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.18)'
  });

  return (
    <section style={gridLayout}>
      <header style={{ display: 'grid', gap: '0.35rem' }}>
        <h3 style={{ fontSize: '1.25rem', letterSpacing: '0.05em' }}>Spielerstatistiken</h3>
        <p style={{ opacity: 0.75, fontSize: '0.95rem' }}>
          Top-Leistungen nach Punkten, Strafen und Dreiern. Die Tabelle listet die aktivsten Spieler des Turniers.
        </p>
      </header>

      <div style={leaderGridStyle}>
        <LeaderList
          title="Topscorer"
          entries={topScorers}
          valueLabel={(entry) => `${entry.points ?? 0} Pkt`}
        />
        <LeaderList
          title="Meiste Strafminuten"
          entries={mostPenalized}
          valueLabel={(entry) => `${entry.penaltySeconds ?? 0}s`}
        />
        <LeaderList
          title="Dreier-Spezialisten"
          entries={topThreePointers}
          valueLabel={(entry) => `${entry.breakdown?.['3'] ?? 0} Dreier`}
        />
      </div>

      {tableEntries.length > 0 ? (
        <div style={{ overflowX: 'auto', borderRadius: '12px', background: 'rgba(0,0,0,0.18)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
            <thead>
              <tr style={{ textAlign: 'left', opacity: 0.75, fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem 1rem' }}>
                  <button
                    type="button"
                    className="player-sort-button"
                    style={buildSortButtonStyle('name')}
                    onClick={() => handleSortChange('name')}
                  >
                    Spieler {renderSortIndicator('name')}
                  </button>
                </th>
                <th style={{ padding: '0.75rem 1rem' }}>
                  <button
                    type="button"
                    className="player-sort-button"
                    style={buildSortButtonStyle('teamName')}
                    onClick={() => handleSortChange('teamName')}
                  >
                    Team {renderSortIndicator('teamName')}
                  </button>
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                  <button
                    type="button"
                    className="player-sort-button"
                    style={buildSortButtonStyle('points', 'right')}
                    onClick={() => handleSortChange('points')}
                  >
                    Punkte {renderSortIndicator('points')}
                  </button>
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                  <button
                    type="button"
                    className="player-sort-button"
                    style={buildSortButtonStyle('games', 'right')}
                    onClick={() => handleSortChange('games')}
                  >
                    Spiele {renderSortIndicator('games')}
                  </button>
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                  <button
                    type="button"
                    className="player-sort-button"
                    style={buildSortButtonStyle('pointsPerGame', 'right')}
                    onClick={() => handleSortChange('pointsPerGame')}
                  >
                    Punkte/Spiel {renderSortIndicator('pointsPerGame')}
                  </button>
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                  <button
                    type="button"
                    className="player-sort-button"
                    style={buildSortButtonStyle('penalties', 'right')}
                    onClick={() => handleSortChange('penalties')}
                  >
                    Strafen {renderSortIndicator('penalties')}
                  </button>
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                  <button
                    type="button"
                    className="player-sort-button"
                    style={buildSortButtonStyle('penaltySeconds', 'right')}
                    onClick={() => handleSortChange('penaltySeconds')}
                  >
                    Strafsek. {renderSortIndicator('penaltySeconds')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {tableEntries.map((player) => (
                <tr key={`player-row-${player.playerId ?? player.key ?? player.name}`} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                    {player.name}
                    {player.jerseyNumber != null ? ` · #${player.jerseyNumber}` : ''}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', opacity: 0.8 }}>{player.teamName ?? '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{player.points ?? 0}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{player.games ?? 0}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    {(player.pointsPerGame ?? 0).toFixed(1)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{player.penalties ?? 0}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{player.penaltySeconds ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <style>{responsiveStyles}</style>
    </section>
  );
}
