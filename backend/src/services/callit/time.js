// Uhrzeiten der Sonderwette "Finale-Startzeit" gelten in Ortszeit des Turniers (Deutschland).
export const VENUE_TIME_ZONE = 'Europe/Berlin';
export const MINUTES_PER_DAY = 24 * 60;

const venueClock = new Intl.DateTimeFormat('en-GB', { timeZone: VENUE_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export const isMinuteOfDay = (value) => Number.isInteger(value) && value >= 0 && value < MINUTES_PER_DAY;

export function minutesOfDayInVenue(iso) {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  const parts = Object.fromEntries(venueClock.formatToParts(time).map((part) => [part.type, part.value]));
  return Number(parts.hour) * 60 + Number(parts.minute);
}

export function formatClock(minutes) {
  if (!isMinuteOfDay(minutes)) return null;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
