import { useTranslation } from 'react-i18next';
import { useDateLocale } from '../../i18n/index.js';
import { describeAudioFile, formatEventTime } from '../../utils/audio.js';

export default function EventRow({ event }) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const label =
    event.origin === 'system'
      ? t('events.audioConnected')
      : event.trigger?.label || event.key || (event.origin === 'manual' ? t('events.manual') : t('events.event'));
  const fileLabel = describeAudioFile(
    event.file,
    event.file ? t('events.soundFallback', { id: event.file.id ?? '' }) : ''
  );
  const timeLabel = formatEventTime(event.triggeredAt, dateLocale);

  return (
    <div className="event-row">
      <strong>{label}</strong>
      {fileLabel ? <span>{fileLabel}</span> : null}
      {timeLabel ? <span>{timeLabel}</span> : null}
    </div>
  );
}
