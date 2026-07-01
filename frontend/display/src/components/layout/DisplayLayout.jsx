const rootWrapperStyle = {
  width: '100vw',
  height: '100vh',
  background: 'radial-gradient(circle at top, #1f3b73 0%, #0b1a2b 55%, #050d1a 100%)',
  color: '#ffffff',
  overflow: 'hidden',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  padding: 'clamp(0.75rem, 3vw, 1.5rem)',
  boxSizing: 'border-box'
};

const scaledLayoutStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  boxSizing: 'border-box'
};

const scaledContentBase = {
  transformOrigin: 'center center',
  width: 'min(1200px, 100%)',
  boxSizing: 'border-box'
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
