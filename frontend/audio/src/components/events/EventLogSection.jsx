import { useAudioApp } from '../../context/AudioContext.jsx';
import EventRow from './EventRow.jsx';

export default function EventLogSection() {
  const { events } = useAudioApp();
  const entries = events.list;

  return (
    <section className="card">
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.35rem', letterSpacing: '0.06em' }}>Letzte Ereignisse</h2>
        <span style={{ fontSize: '0.9rem', opacity: 0.75 }}>
          Eingehende Sounds werden automatisch nacheinander wiedergegeben.
        </span>
      </header>
      {entries.length === 0 ? (
        <p style={{ margin: 0, opacity: 0.7 }}>Noch keine Sound-Ereignisse empfangen.</p>
      ) : (
        <div className="event-log">
          {entries.map((event) => (
            <EventRow key={`${event.eventId ?? event.triggeredAt ?? Math.random()}`} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
