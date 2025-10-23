import BracketView from '../bracket/BracketView.jsx';

const pageStyle = {
  width: '1600px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '2.5rem 3rem',
  gap: '2.5rem',
  boxSizing: 'border-box',
  color: '#ffffff'
};

export default function BracketPage({
  scoreboard,
  error,
  structure,
  structureError,
  structureLoading
}) {
  const tournamentName = scoreboard?.tournamentName || structure?.tournament?.name || '';

  let content;
  if (!scoreboard?.tournamentId) {
    content = (
      <p style={{ fontSize: '1.4rem', opacity: 0.8, textAlign: 'center' }}>
        Kein Turnier ausgewählt. Bitte im Admin-Panel ein Turnier für das Scoreboard setzen.
      </p>
    );
  } else if (structureLoading) {
    content = <p style={{ fontSize: '1.4rem', textAlign: 'center' }}>Lade Turnierstruktur…</p>;
  } else if (structureError) {
    content = (
      <p style={{ fontSize: '1.4rem', textAlign: 'center', color: '#ff8a80' }}>{structureError}</p>
    );
  } else if (!structure) {
    content = (
      <p style={{ fontSize: '1.4rem', textAlign: 'center', opacity: 0.8 }}>
        Noch keine Turnierstruktur verfügbar. Bitte im Admin-Panel Spielplan und Gruppen pflegen.
      </p>
    );
  } else {
    content = (
      <div style={{ width: '100%' }}>
        <BracketView tournamentName={tournamentName} structure={structure} />
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <header style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '4.2rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '1rem'
          }}
        >
          Kunstrad Basketball
        </h1>
        <p style={{ fontSize: '1.4rem', opacity: 0.8, letterSpacing: '0.05em' }}>
          Turnierbaum &amp; Gruppenübersicht
        </p>
        {error ? (
          <p style={{ color: '#ff8a80', fontSize: '1.2rem', marginTop: '0.75rem' }}>{error}</p>
        ) : null}
      </header>

      {content}
    </div>
  );
}
