export default function StatusIndicator({ color, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem' }}>
      <span className="status-dot" style={{ background: color }} />
      {label}
    </span>
  );
}
