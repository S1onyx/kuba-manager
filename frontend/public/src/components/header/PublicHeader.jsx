import { usePublicApp } from '../../context/PublicAppContext.jsx';

export default function PublicHeader() {
  const {
    navigation: { goHome, goReglement },
    isReglementView
  } = usePublicApp();

  const buttonStyle = (active) => ({
    padding: '0.5rem 1.05rem',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.3)',
    background: active ? 'rgba(86, 160, 255, 0.35)' : 'transparent',
    color: active ? '#dcefff' : '#f0f4ff',
    fontWeight: active ? 600 : 500,
    letterSpacing: '0.05em',
    cursor: 'pointer'
  });

  return (
    <header style={{ display: 'grid', gap: '0.75rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.8rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Kunstrad Basketball – Public
      </h1>
      <p style={{ opacity: 0.75, fontSize: '1rem' }}>
        Live-Spielstand, Tabellen und Statistiken zum aktuell ausgewählten Turnier.
      </p>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          marginTop: '0.25rem'
        }}
      >
        <button type="button" onClick={goHome} style={buttonStyle(!isReglementView)}>
          Übersicht
        </button>
        <button type="button" onClick={goReglement} style={buttonStyle(isReglementView)}>
          Reglement
        </button>
      </div>
    </header>
  );
}
