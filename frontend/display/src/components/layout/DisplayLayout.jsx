const rootWrapperStyle = {
  width: '100vw',
  minHeight: '100vh',
  background: 'radial-gradient(circle at top, #1f3b73 0%, #0b1a2b 55%, #050d1a 100%)',
  color: '#ffffff',
  overflowX: 'hidden',
  overflowY: 'auto',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  position: 'relative',
  padding: 'clamp(0.75rem, 3vw, 1.5rem)',
  boxSizing: 'border-box'
};

const scaledLayoutStyle = {
  width: '100%',
  minHeight: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  overflow: 'hidden',
  boxSizing: 'border-box'
};

const scaledContentBase = {
  transformOrigin: 'top center',
  width: 'min(1600px, 100vw)',
  maxWidth: '100%',
  margin: '0 auto',
  boxSizing: 'border-box',
  padding: '0 clamp(0.5rem, 3vw, 1.5rem)'
};

export default function DisplayLayout({ rootRef, contentRef, scale, children, overlay = null }) {
  return (
    <div ref={rootRef} style={rootWrapperStyle}>
      <div style={scaledLayoutStyle}>
        <div
          ref={contentRef}
          style={{
            ...scaledContentBase,
            transform: `scale(${scale})`
          }}
        >
          {children}
        </div>
      </div>
      {overlay}
    </div>
  );
}
