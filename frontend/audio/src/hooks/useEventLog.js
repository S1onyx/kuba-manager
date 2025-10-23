import { useCallback, useState } from 'react';

const MAX_EVENTS = 15;

export default function useEventLog() {
  const [events, setEvents] = useState([]);

  const addEvent = useCallback((event) => {
    setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));
  }, []);

  const addSystemEvent = useCallback((timestamp, label = 'Audio verbunden') => {
    addEvent({
      key: 'audio_ready',
      triggeredAt: timestamp,
      trigger: { label },
      file: null,
      origin: 'system'
    });
  }, [addEvent]);

  return {
    events,
    addEvent,
    addSystemEvent
  };
}
