export default function NoticeBox({ tone = 'info', children }) {
  const palette = tone === 'error'
    ? { background: 'rgba(255, 82, 82, 0.2)', color: '#ffd8d8' }
    : tone === 'warning'
      ? { background: 'rgba(255, 171, 64, 0.18)', color: '#ffe0b2' }
      : { background: 'rgba(86, 160, 255, 0.18)', color: '#dcefff' };

  return (
    <div
      style={{
        padding: '1rem',
        borderRadius: '12px',
        textAlign: tone === 'warning' ? 'center' : 'left',
        ...palette
      }}
    >
      {children}
    </div>
  );
}
