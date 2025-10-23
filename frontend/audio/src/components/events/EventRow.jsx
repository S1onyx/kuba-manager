import { describeAudioFile, formatEventTime } from '../../utils/audio.js';

export default function EventRow({ event }) {
  const label =
    event.trigger?.label || event.key || (event.origin === 'manual' ? 'Manuell' : 'Ereignis');
  const fileLabel = describeAudioFile(event.file);
  const timeLabel = formatEventTime(event.triggeredAt);

  return (
    <div className="event-row">
      <strong>{label}</strong>
      {fileLabel ? <span>{fileLabel}</span> : null}
      {timeLabel ? <span>{timeLabel}</span> : null}
    </div>
  );
}
