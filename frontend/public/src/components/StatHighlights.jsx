const gridStyle = {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))'
};

const cardStyle = {
  padding: '1rem 1.1rem',
  borderRadius: '16px',
  background: 'rgba(255,255,255,0.08)',
  textAlign: 'center'
};

const labelStyle = {
  fontSize: '0.8rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  opacity: 0.7
};

const valueStyle = {
  fontSize: '1.6rem',
  fontWeight: 700
};

const responsiveStyles = `
  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0.85rem;
    }
    .stats-grid__card {
      padding: 0.9rem 0.95rem;
    }
  }

  @media (max-width: 480px) {
    .stats-grid {
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    }
    .stats-grid__value {
      font-size: 1.4rem;
    }
  }
`;

export default function StatHighlights({ totals }) {
  if (!totals) {
    return null;
  }

  const items = [
    { label: 'Teams', value: totals.totalTeams ?? 0 },
    { label: 'Spiele', value: totals.totalGames ?? 0 },
    { label: 'Gesamtpunkte', value: totals.totalGoals ?? 0 },
    { label: 'Strafen', value: totals.totalPenalties ?? 0 }
  ];

  return (
    <section>
      <header style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.2rem', letterSpacing: '0.05em' }}>Turnier-Statistiken</h3>
      </header>
      <div className="stats-grid" style={gridStyle}>
        {items.map((item) => (
          <article key={item.label} className="stats-grid__card" style={cardStyle}>
            <div style={labelStyle}>{item.label}</div>
            <div className="stats-grid__value" style={valueStyle}>{item.value}</div>
          </article>
        ))}
      </div>
      <style>{responsiveStyles}</style>
    </section>
  );
}
