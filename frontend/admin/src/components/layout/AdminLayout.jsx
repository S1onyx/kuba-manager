/**
 * Root layout wrapper for the admin application.
 * Creates a full-height, two-column shell with a fixed sidebar on large screens.
 */
export default function AdminLayout({ sidebar, header, children, footer }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: 'minmax(260px, var(--sidebar-width)) minmax(0, 1fr)',
        alignItems: 'stretch'
      }}
    >
      <aside
        style={{
          position: 'relative',
          padding: '1.75rem',
          borderRight: `1px solid var(--border-color)`,
          background: 'linear-gradient(180deg, rgba(12,26,46,0.95) 0%, rgba(6,16,29,0.88) 100%)',
          boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.04)'
        }}
      >
        <div
          style={{
            position: 'sticky',
            top: '1.75rem',
            display: 'grid',
            gap: '1.75rem'
          }}
        >
          {sidebar}
        </div>
      </aside>

      <div
        style={{
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          minHeight: '100vh',
          backdropFilter: 'blur(12px)'
        }}
      >
        <header
          style={{
            padding: '2.25rem clamp(2.5rem, 5vw, 4rem) 1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}
        >
          {header}
        </header>

        <main
          style={{
            padding: '1.5rem clamp(2.5rem, 5vw, 4rem) 3rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem'
          }}
        >
          {children}
        </main>

        {footer ? (
          <footer
            style={{
              padding: '1.5rem clamp(2.5rem, 5vw, 4rem) 2.5rem',
              color: 'var(--text-muted)',
              fontSize: '0.85rem'
            }}
          >
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
