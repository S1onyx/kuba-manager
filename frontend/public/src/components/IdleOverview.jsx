import { useTranslation } from 'react-i18next';
import { formatResultScore } from '../utils/shootout.js';
import { useDateLocale } from '../i18n/index.js';
import { formatStageLabelI18n } from '../utils/stageLabels.js';
import { computeScheduleProgress, SCHEDULE_DELAY_THRESHOLD_MINUTES } from '../utils/scheduleProgress.js';

const UPCOMING_COUNT = 3;

const cardStyle = {
  display: 'grid',
  gap: '1.25rem',
  padding: '1.75rem',
  background: 'rgba(0, 0, 0, 0.35)',
  borderRadius: '22px',
  backdropFilter: 'blur(5px)',
  boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
  width: '100%'
};

const rowStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(4.5rem, auto) minmax(0, 1fr) auto minmax(0, 1fr)',
  gap: '0.75rem',
  alignItems: 'center',
  padding: '0.75rem 0.9rem',
  borderRadius: '14px',
  background: 'rgba(255,255,255,0.05)'
};

const teamStyle = { fontWeight: 600, overflowWrap: 'anywhere' };

function MatchRow({ entry, time, highlight, t }) {
  const stage = formatStageLabelI18n(t, entry.stageLabelI18n, entry.stageLabel);
  return (
    <div style={{ ...rowStyle, ...(highlight ? { background: 'rgba(86,160,255,0.16)', border: '1px solid rgba(86,160,255,0.4)' } : null) }}>
      <div style={{ display: 'grid', gap: '0.15rem' }}>
        <strong>{time}</strong>
        <small style={{ opacity: 0.7 }}>{stage}</small>
      </div>
      <span style={{ ...teamStyle, textAlign: 'right' }}>{entry.home || t('schedule.openTeam')}</span>
      <span style={{ opacity: 0.6 }}>vs</span>
      <span style={teamStyle}>{entry.away || t('schedule.openTeam')}</span>
    </div>
  );
}

export default function IdleOverview({ entries, recentGames, tournamentCompleted }) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const nowTs = Date.now();
  const progress = computeScheduleProgress(entries, null, nowTs, { completed: tournamentCompleted });
  const formatTime = (timestamp) =>
    timestamp == null ? t('schedule.openDate') : new Date(timestamp).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });
  const nextIndex = entries.findIndex((entry) => entry.key === progress.nextKey);
  const upcoming = nextIndex >= 0 ? entries.slice(nextIndex).filter((entry) => !entry.result?.hasResult).slice(0, UPCOMING_COUNT) : [];
  const lastGame = recentGames?.[0] ?? null;
  const firstEntry = entries.find((entry) => entry.timestamp !== null);
  const notStarted = !progress.hasStarted && firstEntry && firstEntry.timestamp > nowTs;
  const delayed = progress.hasStarted && (progress.delayMinutes ?? 0) >= SCHEDULE_DELAY_THRESHOLD_MINUTES;

  return (
    <section style={cardStyle}>
      <header style={{ display: 'grid', gap: '0.35rem' }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem, 4vw, 1.6rem)', letterSpacing: '0.04em' }}>
          {tournamentCompleted || (progress.hasStarted && upcoming.length === 0) ? t('idle.finishedTitle') : t('idle.title')}
        </h2>
        <p style={{ margin: 0, opacity: 0.8 }}>
          {tournamentCompleted || (progress.hasStarted && upcoming.length === 0)
            ? t('idle.finishedHint')
            : notStarted
              ? t('idle.startsAt', { time: formatTime(firstEntry.timestamp) })
              : delayed
                ? t('schedule.delayBehind', { minutes: progress.delayMinutes })
                : t('idle.hint')}
        </p>
      </header>

      {upcoming.length > 0 && !tournamentCompleted ? (
        <div style={{ display: 'grid', gap: '0.6rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85 }}>{t('idle.nextUp')}</h3>
          {upcoming.map((entry, index) => (
            <MatchRow
              key={entry.key}
              entry={entry}
              time={formatTime(progress.expectedTimestamp(entry) ?? entry.timestamp)}
              highlight={index === 0}
              t={t}
            />
          ))}
        </div>
      ) : null}

      {lastGame ? (
        <div style={{ display: 'grid', gap: '0.6rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85 }}>{t('idle.lastResult')}</h3>
          <div style={{ ...rowStyle, gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)' }}>
            <span style={{ ...teamStyle, textAlign: 'right' }}>{lastGame.teamA}</span>
            <strong style={{ fontSize: '1.25rem' }}>{formatResultScore(lastGame.scoreA, lastGame.scoreB, lastGame.shootout)}</strong>
            <span style={teamStyle}>{lastGame.teamB}</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
