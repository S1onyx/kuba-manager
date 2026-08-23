import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDateLocale } from '../i18n/index.js';
import BracketStageList from './BracketStageList.jsx';
import { formatStageLabelI18n } from '../utils/stageLabels.js';

const containerStyle = {
  background: 'rgba(0,0,0,0.28)',
  borderRadius: '20px',
  padding: '1.5rem',
  display: 'grid',
  gap: '1.5rem'
};

const groupCardStyle = {
  background: 'rgba(0,0,0,0.32)',
  borderRadius: '18px',
  padding: '1.1rem 1.25rem',
  display: 'grid',
  gap: '0.9rem'
};

const roundHeaderStyle = {
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  opacity: 0.7
};

const matchRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
  alignItems: 'center',
  columnGap: '0.7rem',
  fontSize: '0.95rem'
};

const matchTimeLabelStyle = {
  gridColumn: '1 / -1',
  fontSize: '0.8rem',
  letterSpacing: '0.06em',
  opacity: 0.7,
  textAlign: 'center'
};

const responsiveStyles = `
  @media (max-width: 768px) {
    .schedule-preview {
      padding: 1.25rem;
    }
    .schedule-preview__group {
      padding: 1rem 1.05rem;
    }
    .schedule-preview__match {
      column-gap: 0.45rem;
      font-size: 0.9rem;
    }
  }

  .schedule-preview__view-toggle {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .schedule-preview__view-button {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0.25rem 0.9rem;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.25);
    background: transparent;
    color: #f0f4ff;
    font-size: 0.85rem;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .schedule-preview__view-button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .schedule-preview__view-button--active {
    background: rgba(86,160,255,0.25);
    color: #dcefff;
    border-color: rgba(86,160,255,0.4);
    font-weight: 600;
  }

  .schedule-timeline {
    display: grid;
    gap: 1.2rem;
  }

  .schedule-timeline__list {
    display: grid;
    gap: 0.85rem;
  }

  .schedule-timeline__row {
    display: grid;
    grid-template-columns: minmax(110px, 0.5fr) 20px minmax(0, 1fr);
    gap: 0.85rem;
    align-items: stretch;
  }

  .schedule-timeline__time {
    font-size: 0.9rem;
    opacity: 0.85;
    display: grid;
    gap: 0.2rem;
  }

  .schedule-timeline__marker {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .schedule-timeline__dot {
    width: 12px;
    height: 12px;
    border-radius: 999px;
    background: rgba(255,255,255,0.5);
    border: 2px solid rgba(255,255,255,0.9);
  }

  .schedule-timeline__item--past .schedule-timeline__dot {
    opacity: 0.5;
    transform: scale(0.9);
  }

  .schedule-timeline__item--next .schedule-timeline__dot {
    background: #56a0ff;
    box-shadow: 0 0 0 6px rgba(86,160,255,0.2);
    border-color: #b5d9ff;
  }

  .schedule-timeline__item--now .schedule-timeline__dot {
    background: #ffe081;
    border-color: #fff;
    box-shadow: 0 0 0 6px rgba(255,224,129,0.25);
  }

  .schedule-timeline__item--unscheduled .schedule-timeline__time {
    opacity: 0.6;
  }

  .schedule-timeline__details {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 0.85rem 1rem;
    display: grid;
    gap: 0.35rem;
  }

  .schedule-timeline__teams {
    display: grid;
    grid-template-columns: minmax(0,1fr) auto minmax(0,1fr);
    gap: 0.6rem;
    align-items: center;
    font-weight: 600;
  }

  .schedule-timeline__score {
    font-weight: 700;
    letter-spacing: 0.02em;
    text-align: center;
  }

  .schedule-timeline__meta,
  .schedule-timeline__note {
    font-size: 0.8rem;
    opacity: 0.7;
  }

  .schedule-timeline__item--next .schedule-timeline__details {
    border-color: rgba(86,160,255,0.35);
    box-shadow: 0 12px 28px rgba(0,0,0,0.25);
  }

  .schedule-timeline__item--now .schedule-timeline__details {
    border-color: rgba(255,224,129,0.5);
    background: rgba(255,224,129,0.08);
  }

  .schedule-timeline__now-hint {
    font-weight: 600;
    color: #ffeab4;
  }

  @media (max-width: 768px) {
    .schedule-timeline__row {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .schedule-timeline__marker {
      display: none;
    }

    .schedule-preview__view-toggle {
      width: 100%;
    }
  }
`;

const scheduleViewModes = [
  { id: 'timeline', labelKey: 'schedule.viewTimeline' },
  { id: 'phases', labelKey: 'schedule.viewPhases' }
];

const phaseLabelKeys = {
  group: 'schedule.phaseGroup',
  knockout: 'schedule.phaseKnockout',
  placement: 'schedule.phasePlacement'
};

const phaseSortOrder = {
  group: 1,
  knockout: 2,
  placement: 3
};

function createMatchDateTimeFormatter(dateLocale, t) {
  const dateTimeFormatter = new Intl.DateTimeFormat(dateLocale, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  return (value) => {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    const formatted = dateTimeFormatter.format(date).split(', ').join(' · ');
    return t('schedule.timeValue', { time: formatted });
  };
}

function toScheduledTimestamp(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  const timestamp = date.getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function renderGroupSchedule(groupStages, formatDateTime, t) {
  if (!groupStages || groupStages.length === 0) {
    return null;
  }

  return (
    <section style={{ display: 'grid', gap: '1.25rem' }}>
      <header>
        <h3 style={{ fontSize: '1.2rem', letterSpacing: '0.05em' }}>{t('schedule.groupTitle')}</h3>
        <p style={{ fontSize: '0.95rem', opacity: 0.75 }}>{t('schedule.groupDescription')}</p>
      </header>
      <div style={{ display: 'grid', gap: '1.1rem' }}>
        {groupStages.map((group) => (
          <article key={group.stage_label} className="schedule-preview__group" style={groupCardStyle}>
            <strong style={{ fontSize: '1rem', letterSpacing: '0.05em' }}>{group.stage_label}</strong>
            <div style={{ display: 'grid', gap: '0.8rem' }}>
              {group.rounds.map((round) => (
                <div key={`${group.stage_label}-round-${round.round}`} style={{ display: 'grid', gap: '0.55rem' }}>
                  <span style={roundHeaderStyle}>{t('schedule.round', { round: round.round })}</span>
                  <div style={{ display: 'grid', gap: '0.35rem' }}>
                    {round.matches.map((match) => {
                      const scheduledLabel = formatDateTime ? formatDateTime(match.scheduled_at) : null;
                      return (
                        <div
                          key={match.id || `${group.stage_label}-${round.round}-${match.match_order}`}
                          className="schedule-preview__match"
                          style={matchRowStyle}
                        >
                          <span style={{ fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {match.home_label}
                          </span>
                          <span
                            style={{
                              opacity: match.result?.hasResult ? 1 : 0.7,
                              fontWeight: match.result?.hasResult ? 700 : 400,
                              letterSpacing: '0.02em',
                              minWidth: '3.5rem',
                              whiteSpace: 'nowrap',
                              textAlign: 'center'
                            }}
                          >
                            {match.result?.hasResult
                              ? `${match.result.scoreA ?? 0} : ${match.result.scoreB ?? 0}`
                              : 'vs'}
                          </span>
                          <span style={{ fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {match.away_label}
                          </span>
                          {scheduledLabel ? <span style={matchTimeLabelStyle}>{scheduledLabel}</span> : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function buildTimelineEntries(schedule, t, dateLocale) {
  if (!schedule) {
    return [];
  }

  const entries = [];
  let fallbackIndex = 0;

  const pushMatch = (match, meta = {}) => {
    if (!match) {
      return;
    }
    const scheduledRaw = match.scheduled_at ?? match.scheduledAt ?? null;
    const matchCode =
      match.code ??
      match.metadata?.code ??
      match.metadata?.schedule_code ??
      match.metadata?.scheduleCode ??
      null;
    const entry = {
      key: match.id ?? `${meta.phase || 'match'}-${fallbackIndex++}`,
      code: matchCode ? String(matchCode) : null,
      home: match.home_label ?? match.home ?? match.team_a ?? '',
      away: match.away_label ?? match.away ?? match.team_b ?? '',
      result: match.result ?? null,
      scheduledRaw,
      timestamp: toScheduledTimestamp(scheduledRaw),
      phase: meta.phase ?? match.phase ?? null,
      stageLabel: meta.stageLabel ?? match.stage_label ?? '',
      stageLabelI18n: meta.stageLabelI18n ?? match.stage_label_i18n ?? null,
      roundLabel: meta.roundLabel ?? null,
      metadata: match.metadata ?? {},
      matchOrder: match.match_order ?? meta.matchOrder ?? 0
    };
    entries.push(entry);
  };

  (schedule.group ?? []).forEach((stage) => {
    stage.rounds?.forEach((round) => {
      round.matches?.forEach((match, index) => {
        pushMatch(match, {
          phase: 'group',
          stageLabel: stage.stage_label,
          stageLabelI18n: stage.stage_label_i18n,
          roundLabel: round.round ? t('schedule.round', { round: round.round }) : null,
          matchOrder: index
        });
      });
    });
  });

  ['knockout', 'placement'].forEach((phase) => {
    (schedule[phase] ?? []).forEach((stage) => {
      stage.matches?.forEach((match, index) => {
        pushMatch(match, {
          phase,
          stageLabel: stage.stage_label,
          stageLabelI18n: stage.stage_label_i18n,
          matchOrder: index
        });
      });
    });
  });

  return entries
    .filter((entry) => entry.home || entry.away || entry.stageLabel)
    .sort((a, b) => {
      if (a.timestamp !== null && b.timestamp !== null && a.timestamp !== b.timestamp) {
        return a.timestamp - b.timestamp;
      }
      if (a.timestamp !== null && b.timestamp === null) {
        return -1;
      }
      if (a.timestamp === null && b.timestamp !== null) {
        return 1;
      }
      if (a.phase !== b.phase) {
        return (phaseSortOrder[a.phase] ?? 10) - (phaseSortOrder[b.phase] ?? 10);
      }
      if (a.stageLabel !== b.stageLabel) {
        return a.stageLabel.localeCompare(b.stageLabel, dateLocale, { sensitivity: 'base' });
      }
      return a.matchOrder - b.matchOrder;
    })
    .map((entry, index) => ({
      ...entry,
      key: entry.key ?? `match-${index}`,
      phaseLabel: phaseLabelKeys[entry.phase] ? t(phaseLabelKeys[entry.phase]) : entry.phase ?? t('schedule.phaseDefault')
    }));
}

function renderTimelineRow(entry, nextKey, nowTs, formatDateTime, activeKey, t) {
  const scheduledLabel = entry.timestamp !== null ? formatDateTime(entry.scheduledRaw) : null;
  const isPast = entry.timestamp !== null && entry.timestamp < nowTs;
  const isActive = Boolean(activeKey && entry.key === activeKey);
  const classNames = ['schedule-timeline__row', 'schedule-timeline__item'];
  if (isPast && !isActive) {
    classNames.push('schedule-timeline__item--past');
  }
  if (!activeKey && entry.key === nextKey) {
    classNames.push('schedule-timeline__item--next');
  }
  if (entry.timestamp === null) {
    classNames.push('schedule-timeline__item--unscheduled');
  }
  if (isActive) {
    classNames.push('schedule-timeline__item--now');
  }
  const scoreLabel = entry.result?.hasResult
    ? `${entry.result.scoreA ?? 0} : ${entry.result.scoreB ?? 0}`
    : 'vs';
  const metaParts = [];
  if (entry.phaseLabel) {
    metaParts.push(entry.phaseLabel);
  }
  if (entry.stageLabel) {
    metaParts.push(formatStageLabelI18n(t, entry.stageLabelI18n, entry.stageLabel));
  }
  if (entry.roundLabel) {
    metaParts.push(entry.roundLabel);
  }

  return (
    <div key={entry.key} className={classNames.join(' ')}>
      <div className="schedule-timeline__time">
        {scheduledLabel ? (
          <span>{scheduledLabel}</span>
        ) : (
          <>
            <span>{t('schedule.openDate')}</span>
            {entry.phaseLabel ? <small style={{ opacity: 0.7 }}>{entry.phaseLabel}</small> : null}
          </>
        )}
      </div>
      <div className="schedule-timeline__marker">
        <span className="schedule-timeline__dot" />
      </div>
      <div className="schedule-timeline__details">
        <div
          className="schedule-timeline__teams"
          style={{
            textAlign: 'center',
            gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)'
          }}
        >
          <span style={{ textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {entry.home || t('schedule.openTeam')}
          </span>
          <span className="schedule-timeline__score">{scoreLabel}</span>
          <span style={{ textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {entry.away || t('schedule.openTeam')}
          </span>
        </div>
        {entry.metadata?.description ? (
          <span className="schedule-timeline__note">{entry.metadata.description}</span>
        ) : null}
        {isActive ? (
          <span className="schedule-timeline__now-hint">{t('schedule.nowHint')}</span>
        ) : null}
        {metaParts.length ? <span className="schedule-timeline__meta">{metaParts.join(' · ')}</span> : null}
      </div>
    </div>
  );
}

function TimelineSchedule({ entries, formatDateTime, activeScheduleCode, t }) {
  const nowTs = Date.now();
  const hasTimeInfo = entries.some((entry) => entry.timestamp !== null);
  const nextEntry = entries.find((entry) => entry.timestamp !== null && entry.timestamp >= nowTs);
  const nextKey = nextEntry?.key ?? null;
  const normalizedActiveCode =
    typeof activeScheduleCode === 'string' && activeScheduleCode.trim().length > 0
      ? activeScheduleCode.trim().toLowerCase()
      : null;
  const activeEntry = normalizedActiveCode
    ? entries.find((entry) => (entry.code ?? '').toLowerCase() === normalizedActiveCode)
    : null;
  const activeKey = activeEntry?.key ?? null;
  const rows = [];

  if (activeKey) {
    entries.forEach((entry) => {
      rows.push(renderTimelineRow(entry, nextKey, nowTs, formatDateTime, activeKey, t));
    });
  } else {
    let nowInserted = !hasTimeInfo;

    const renderNowRow = (suffix) => (
      <div
        key={`timeline-now-${suffix}`}
        className="schedule-timeline__row schedule-timeline__item schedule-timeline__item--now"
      >
        <div className="schedule-timeline__time">
          <strong>{t('schedule.now')}</strong>
          <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>{formatDateTime(new Date())}</span>
        </div>
        <div className="schedule-timeline__marker">
          <span className="schedule-timeline__dot" />
        </div>
        <div className="schedule-timeline__details">
          <span className="schedule-timeline__now-hint">{t('schedule.nowHint')}</span>
          <span className="schedule-timeline__meta">{t('schedule.nowDescription')}</span>
        </div>
      </div>
    );

    entries.forEach((entry) => {
      if (!nowInserted && entry.timestamp !== null && entry.timestamp >= nowTs) {
        rows.push(renderNowRow(entry.key));
        nowInserted = true;
      }
      rows.push(renderTimelineRow(entry, nextKey, nowTs, formatDateTime, null, t));
    });

    if (!nowInserted && hasTimeInfo) {
      rows.push(renderNowRow('end'));
    }
  }

  return (
    <section className="schedule-timeline">
      <header>
        <h3 style={{ fontSize: '1.2rem', letterSpacing: '0.05em' }}>{t('schedule.timelineTitle')}</h3>
        <p style={{ fontSize: '0.95rem', opacity: 0.75 }}>{t('schedule.timelineDescription')}</p>
      </header>
      {entries.length === 0 ? (
        <p style={{ opacity: 0.75, fontSize: '0.95rem' }}>{t('schedule.timelineEmpty')}</p>
      ) : (
        <div className="schedule-timeline__list">{rows}</div>
      )}
    </section>
  );
}

export default function SchedulePreview({ schedule, activeScheduleCode = null }) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [viewMode, setViewMode] = useState(scheduleViewModes[0]?.id ?? 'timeline');
  const formatMatchDateTime = useMemo(
    () => createMatchDateTimeFormatter(dateLocale, t),
    [dateLocale, t]
  );
  const timelineEntries = useMemo(
    () => (schedule ? buildTimelineEntries(schedule, t, dateLocale) : []),
    [schedule, t, dateLocale]
  );

  if (!schedule) {
    return null;
  }
  const hasGroup = Array.isArray(schedule.group) && schedule.group.length > 0;
  const hasKnockout = Array.isArray(schedule.knockout) && schedule.knockout.length > 0;
  const hasPlacement = Array.isArray(schedule.placement) && schedule.placement.length > 0;
  const showEmptyNotice = !hasGroup && !hasKnockout && !hasPlacement;
  const timelineDisabled = timelineEntries.length === 0;

  return (
    <section className="schedule-preview" style={containerStyle}>
      <header style={{ display: 'grid', gap: '0.65rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', letterSpacing: '0.05em' }}>{t('schedule.title')}</h2>
          <p style={{ opacity: 0.75, fontSize: '0.95rem' }}>{t('schedule.intro')}</p>
        </div>
        {!showEmptyNotice ? (
          <div className="schedule-preview__view-toggle" role="group" aria-label={t('schedule.viewToggleLabel')}>
            {scheduleViewModes.map((mode) => {
              const isActive = viewMode === mode.id;
              const isTimelineMode = mode.id === 'timeline';
              const disabled = isTimelineMode && timelineDisabled;
              return (
                <button
                  key={mode.id}
                  type="button"
                  className={`schedule-preview__view-button${
                    isActive ? ' schedule-preview__view-button--active' : ''
                  }`}
                  disabled={disabled}
                  onClick={() => setViewMode(mode.id)}
                >
                  {t(mode.labelKey)}
                </button>
              );
            })}
          </div>
        ) : null}
      </header>

      {showEmptyNotice ? (
        <p style={{ opacity: 0.75, fontSize: '0.95rem' }}>{t('schedule.empty')}</p>
      ) : (
        <>
          {viewMode === 'timeline' ? (
            <TimelineSchedule
              entries={timelineEntries}
              formatDateTime={formatMatchDateTime}
              activeScheduleCode={activeScheduleCode}
              t={t}
            />
          ) : (
            <>
              {renderGroupSchedule(schedule.group, formatMatchDateTime, t)}

              {hasKnockout ? (
                <BracketStageList
                  stages={schedule.knockout}
                  title={t('schedule.knockoutTitle')}
                  description={t('schedule.knockoutDescription')}
                  formatDateTime={formatMatchDateTime}
                />
              ) : null}

              {hasPlacement ? (
                <BracketStageList
                  stages={schedule.placement}
                  title={t('schedule.placementTitle')}
                  description={t('schedule.placementDescription')}
                  formatDateTime={formatMatchDateTime}
                />
              ) : null}
            </>
          )}
        </>
      )}

      <style>{responsiveStyles}</style>
    </section>
  );
}
