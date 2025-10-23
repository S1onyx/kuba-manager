import { formatTime } from '../../utils/formatting.js';

const penaltiesWrapperStyle = {
  width: '100%',
  maxWidth: '1200px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1.75rem'
};

const penaltyCardStyle = {
  padding: '1.5rem',
  background: 'rgba(0,0,0,0.35)',
  borderRadius: '18px',
  boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
  backdropFilter: 'blur(4px)',
  textAlign: 'left'
};

const penaltyListStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'grid',
  gap: '0.65rem'
};

const penaltyItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'rgba(255,255,255,0.12)',
  padding: '0.6rem 0.9rem',
  borderRadius: '10px',
  fontSize: '1.2rem'
};

function PenaltyList({ entries }) {
  if (!entries || entries.length === 0) {
    return <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.1rem' }}>Keine laufenden Strafen</p>;
  }

  return (
    <ul style={penaltyListStyle}>
      {entries.map((penalty) => (
        <li
          key={penalty.id}
          style={{
            ...penaltyItemStyle,
            opacity: penalty.isExpired ? 0.6 : 1
          }}
        >
          <span>{penalty.name}</span>
          <span>{penalty.isExpired ? 'abgelaufen' : formatTime(penalty.remainingSeconds)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PenaltiesSection({ penalties, teamNames }) {
  const safePenalties = penalties ?? { a: [], b: [] };

  return (
    <section style={penaltiesWrapperStyle}>
      {['a', 'b'].map((teamKey) => {
        const list = safePenalties[teamKey] ?? [];
        const name = teamKey === 'a' ? teamNames.teamA : teamNames.teamB;

        return (
          <article key={teamKey} style={penaltyCardStyle}>
            <h3
              style={{
                margin: 0,
                marginBottom: '1rem',
                textTransform: 'uppercase',
                fontSize: '1.5rem',
                letterSpacing: '0.08em'
              }}
            >
              Zeitstrafen {name}
            </h3>
            <PenaltyList entries={list} />
          </article>
        );
      })}
    </section>
  );
}
