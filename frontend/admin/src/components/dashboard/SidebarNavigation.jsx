import { CONTROL_TABS } from '../../constants/dashboard.js';

export default function SidebarNavigation({
  activeTab,
  onSelect,
  scoreboard,
  formattedRemaining,
  liveStateLabel,
  error,
  info
}) {
  const navItems = CONTROL_TABS;
  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <div style={{ display: 'grid', gap: '0.35rem' }}>
        <div
          style={{
            fontSize: '0.8rem',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            opacity: 0.7
          }}
        >
          Kuba Manager
        </div>
        <h1 style={{ margin: 0, fontSize: '1.8rem', letterSpacing: '0.06em' }}>Admin Panel</h1>
        <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-muted)' }}>
          Steuere Scoreboard, Audio und Turnierablauf zentral.
        </p>
      </div>

      {scoreboard ? (
        <div
          style={{
            display: 'grid',
            gap: '0.5rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(76,201,255,0.28)',
            background: 'rgba(18, 34, 52, 0.85)'
          }}
        >
          <span style={{ fontSize: '0.75rem', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.65 }}>
            Live
          </span>
          <div style={{ fontWeight: 600, fontSize: '0.98rem' }}>
            {scoreboard.teamAName} vs {scoreboard.teamBName}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', opacity: 0.8 }}>
            <span>
              {scoreboard.scoreA} : {scoreboard.scoreB}
            </span>
            <span>
              {formattedRemaining} · {liveStateLabel}
            </span>
          </div>
        </div>
      ) : null}

      <nav style={{ display: 'grid', gap: '0.65rem' }}>
        {navItems.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              style={{
                justifyContent: 'flex-start',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255,255,255,0.12)',
                background: isActive ? 'rgba(76, 201, 255, 0.16)' : 'rgba(8, 20, 35, 0.6)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
                transition: 'background var(--transition-base), border-color var(--transition-base), color var(--transition-base)'
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '999px',
                  background: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.18)'
                }}
              />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {error ? (
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255,95,95,0.12)',
            border: '1px solid rgba(255,95,95,0.4)',
            color: '#ff9e9e',
            fontSize: '0.9rem'
          }}
        >
          {error}
        </div>
      ) : null}
      {info ? (
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(122,229,130,0.12)',
            border: '1px solid rgba(122,229,130,0.4)',
            color: '#9ff0a4',
            fontSize: '0.9rem'
          }}
        >
          {info}
        </div>
      ) : null}
    </div>
  );
}
