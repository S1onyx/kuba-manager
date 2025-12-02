import { useEffect, useState } from 'react';
import useMediaQuery from '../../hooks/useMediaQuery.js';

const desktopShellStyle = {
  minHeight: '100vh',
  display: 'grid',
  gridTemplateColumns: 'minmax(260px, var(--sidebar-width)) minmax(0, 1fr)',
  alignItems: 'stretch'
};

const desktopContentStyle = {
  display: 'grid',
  gridTemplateRows: 'auto 1fr auto',
  minHeight: '100vh',
  backdropFilter: 'blur(12px)'
};

const desktopHeaderPadding = '2.25rem clamp(2.5rem, 5vw, 4rem) 1.75rem';
const desktopMainPadding = '1.5rem clamp(2.5rem, 5vw, 4rem) 3rem';
const desktopFooterPadding = '1.5rem clamp(2.5rem, 5vw, 4rem) 2.5rem';

const mobileWrapperStyle = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: 'linear-gradient(180deg, rgba(8,16,28,0.95) 0%, rgba(4,9,16,0.92) 100%)'
};

const mobileTopBarStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 30,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  padding: '1rem clamp(1rem, 4vw, 1.75rem)',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(7,14,24,0.95)',
  backdropFilter: 'blur(10px)'
};

const mobileMainPadding = '1.25rem clamp(1rem, 4vw, 1.5rem) 2.5rem';

export default function AdminLayout({ sidebar, header, children, footer }) {
  const isCompact = useMediaQuery('(max-width: 1100px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isCompact) {
      setSidebarOpen(false);
    }
  }, [isCompact]);

  useEffect(() => {
    if (!isCompact || !sidebarOpen) {
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCompact, sidebarOpen]);

  const closeSidebar = () => setSidebarOpen(false);

  const mobileSidebar = isCompact ? (
    <div
      aria-hidden={!sidebarOpen}
      onClick={closeSidebar}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        display: 'flex',
        justifyContent: 'flex-end',
        pointerEvents: sidebarOpen ? 'auto' : 'none',
        opacity: sidebarOpen ? 1 : 0,
        transition: 'opacity 160ms ease',
        background: 'rgba(2,6,14,0.75)'
      }}
    >
      <aside
        onClick={(event) => event.stopPropagation()}
        style={{
          width: 'min(86vw, 320px)',
          maxWidth: '100%',
          height: '100%',
          padding: '1.5rem',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, rgba(12,26,46,0.98) 0%, rgba(6,16,29,0.95) 100%)',
          boxShadow: '0 10px 60px rgba(0,0,0,0.5)',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 200ms ease',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ fontWeight: 600 }}>Navigation</div>
          <button
            type="button"
            onClick={closeSidebar}
            style={{
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(14,24,38,0.8)',
              padding: '0.35rem 0.75rem',
              fontSize: '0.85rem'
            }}
          >
            Schließen
          </button>
        </div>
        <div style={{ display: 'grid', gap: '1.75rem' }}>{sidebar}</div>
      </aside>
    </div>
  ) : null;

  if (isCompact) {
    return (
      <div style={mobileWrapperStyle}>
        {mobileSidebar}
        <div style={mobileTopBarStyle}>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(13,25,42,0.9)',
              color: '#fff',
              fontWeight: 600,
              letterSpacing: '0.08em'
            }}
          >
            Menü
          </button>
          <div style={{ fontSize: '0.78rem', letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.7 }}>
            Kuba Admin
          </div>
        </div>

        {header ? (
          <header
            style={{
              padding: '1.25rem clamp(1rem, 4vw, 1.75rem) 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            {header}
          </header>
        ) : null}

        <main
          style={{
            padding: mobileMainPadding,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}
        >
          {children}
        </main>

        {footer ? (
          <footer
            style={{
              padding: '0 clamp(1rem, 4vw, 1.75rem) 1.75rem',
              color: 'var(--text-muted)',
              fontSize: '0.82rem'
            }}
          >
            {footer}
          </footer>
        ) : null}
      </div>
    );
  }

  return (
    <div style={desktopShellStyle}>
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

      <div style={desktopContentStyle}>
        <header
          style={{
            padding: desktopHeaderPadding,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}
        >
          {header}
        </header>

        <main
          style={{
            padding: desktopMainPadding,
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
              padding: desktopFooterPadding,
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
