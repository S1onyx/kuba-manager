export default function Scoreboard({ score, teamNames }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '3rem', margin: '2rem 0' }}>
      <div>
        <p>{teamNames.teamA}</p>
        <p>{score.teamA}</p>
      </div>
      <div>
        <p>{teamNames.teamB}</p>
        <p>{score.teamB}</p>
      </div>
    </div>
  );
}