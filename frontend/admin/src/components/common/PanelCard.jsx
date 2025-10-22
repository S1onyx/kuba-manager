export default function PanelCard({ title, description, action, children, tone }) {
  const background =
    tone === 'muted'
      ? 'rgba(14, 24, 38, 0.9)'
      : tone === 'accent'
        ? 'rgba(26, 48, 74, 0.92)'
        : 'rgba(12, 22, 35, 0.9)';
  const borderColor =
    tone === 'accent' ? 'rgba(96, 176, 255, 0.4)' : 'rgba(255, 255, 255, 0.08)';

  return (
    <section
      style={{
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${borderColor}`,
        background,
        padding: '1.5rem 1.75rem',
        display: 'grid',
        gap: '1.25rem'
      }}
    >
      {title ? (
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: '0.35rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{title}</h3>
            {description ? (
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div style={{ display: 'flex', alignItems: 'center' }}>{action}</div> : null}
        </header>
      ) : null}
      <div style={{ display: 'grid', gap: '1.25rem' }}>{children}</div>
    </section>
  );
}
