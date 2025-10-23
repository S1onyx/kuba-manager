const rootWrapperStyle = {
  width: '100vw',
  height: '100vh',
  background: 'radial-gradient(circle at top, #1f3b73 0%, #0b1a2b 55%, #050d1a 100%)',
  color: '#ffffff',
  overflow: 'hidden',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  position: 'relative'
};

const scaledLayoutStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  overflow: 'hidden',
  boxSizing: 'border-box'
};

const scaledContentBase = {
  transformOrigin: 'top center',
  width: '1600px',
  margin: '0 auto'
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
