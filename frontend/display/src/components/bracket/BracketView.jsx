import BracketGroupTables from './BracketGroupTables.jsx';
import BracketStageMatches from './BracketStageMatches.jsx';

const containerStyle = {
  display: 'grid',
  gap: '2.5rem'
};

const headerStyle = {
  display: 'grid',
  gap: '0.4rem',
  textAlign: 'center'
};

const titleStyle = {
  margin: 0,
  fontSize: '2.4rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em'
};

const subtitleStyle = {
  margin: 0,
  fontSize: '1rem',
  opacity: 0.75,
  letterSpacing: '0.08em'
};

export default function BracketView({ tournamentName, structure }) {
  const knockoutStages = structure?.schedule?.knockout ?? [];
  const placementStages = structure?.schedule?.placement ?? [];

  return (
    <div style={containerStyle}>
      {tournamentName ? (
        <header style={headerStyle}>
          <h2 style={titleStyle}>{tournamentName}</h2>
          <p style={subtitleStyle}>Gruppentabellen und KO-Spiele im Überblick</p>
        </header>
      ) : null}

      <BracketGroupTables groups={structure?.groups ?? []} />
      <BracketStageMatches title="KO-Runde" stages={knockoutStages} />
      <BracketStageMatches title="Platzierungsspiele" stages={placementStages} />
    </div>
  );
}
