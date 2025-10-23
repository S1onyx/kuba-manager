export default function PublicLayout({ children }) {
  return (
    <div
      className="public-app"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        padding: '2.5rem clamp(1.5rem, 4vw, 4rem)'
      }}
    >
      {children}
    </div>
  );
}
