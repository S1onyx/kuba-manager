export default function Timer({ time, isRunning }) {
  return (
    <div>
      <h2 style={{ fontSize: '3rem' }}>{time}</h2>
      <p>{isRunning ? 'Läuft' : 'Pausiert'}</p> {/* Anzeige des Status */}
    </div>
  );
}