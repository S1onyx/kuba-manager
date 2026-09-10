import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import PanelCard from '../common/PanelCard.jsx';
import { useDashboard } from '../../context/DashboardContext.jsx';
import { fetchTournamentSummary } from '../../utils/api.js';
import { formatApiError } from '../../utils/apiError.js';
import { formatStageLabelI18n } from '../../utils/stageLabels.js';
import { formatDateTime } from '../../utils/formatters.js';
import { useDateLocale } from '../../i18n/index.js';
import useMediaQuery from '../../hooks/useMediaQuery.js';

const EXPORT_SECTIONS = [
  { id: 'schedule', labelKey: 'export.sectionSchedule', descKey: 'export.sectionScheduleDesc' },
  { id: 'standings', labelKey: 'export.sectionStandings', descKey: 'export.sectionStandingsDesc' },
  { id: 'results', labelKey: 'export.sectionResults', descKey: 'export.sectionResultsDesc' },
  { id: 'final', labelKey: 'export.sectionFinal', descKey: 'export.sectionFinalDesc' }
];

export default function ExportTab() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const { matchContext, tournaments } = useDashboard();
  const resolvedTournamentId = matchContext?.resolvedTournamentId ?? null;
  const tournamentList = tournaments?.tournaments ?? [];

  const [selectedTournamentId, setSelectedTournamentId] = useState(resolvedTournamentId ?? '');
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [printMode, setPrintMode] = useState(null);

  useEffect(() => {
    if (resolvedTournamentId && !selectedTournamentId) {
      setSelectedTournamentId(String(resolvedTournamentId));
    }
  }, [resolvedTournamentId, selectedTournamentId]);

  const activeTournamentId = useMemo(() => {
    const id = Number(selectedTournamentId);
    return Number.isInteger(id) && id > 0 ? id : null;
  }, [selectedTournamentId]);

  const loadSummary = useCallback(
    async (id) => {
      if (!id) {
        setSummary(null);
        setSummaryError('');
        return;
      }
      setSummaryLoading(true);
      setSummaryError('');
      try {
        const data = await fetchTournamentSummary(id);
        setSummary(data);
      } catch (err) {
        console.error(err);
        setSummary(null);
        setSummaryError(formatApiError(err, t, 'export.loadFailed'));
      } finally {
        setSummaryLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    loadSummary(activeTournamentId);
  }, [activeTournamentId, loadSummary]);

  const handlePrint = useCallback((mode) => {
    setPrintMode(mode);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  }, []);

  useEffect(() => {
    const handleAfterPrint = () => setPrintMode(null);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const tournamentName = summary?.tournament?.name ?? '';
  const tournamentLocation = summary?.tournament?.location ?? '';
  const tournamentDate = summary?.tournament?.planned_at ?? '';
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = useCallback((id) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div style={{ display: 'grid', gap: '1.75rem' }}>
      <PanelCard
        title={t('export.title')}
        description={t('export.description')}
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <label className="export-select-label">
            {t('export.selectTournament')}
            <select
              className="export-select"
              value={selectedTournamentId}
              onChange={(event) => setSelectedTournamentId(event.target.value)}
            >
              <option value="">{t('export.noTournamentSelected')}</option>
              {tournamentList.map((tournament) => (
                <option key={tournament.id} value={String(tournament.id)}>
                  {tournament.name}
                </option>
              ))}
            </select>
          </label>

          {summaryError ? (
            <div className="export-error">{summaryError}</div>
          ) : null}

          {summaryLoading ? (
            <div className="export-loading">
              <div className="export-spinner" />
              <span>{t('export.loading')}</span>
            </div>
          ) : null}

          {!summaryLoading && !summaryError && !activeTournamentId ? (
            <div className="export-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>{t('export.emptyHint')}</span>
            </div>
          ) : null}
        </div>
      </PanelCard>

      {!activeTournamentId || !summary ? null : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {EXPORT_SECTIONS.map((section) => {
            const isExpanded = !isMobile || expandedSection === section.id;
            return (
              <PanelCard
                key={section.id}
                title={t(section.labelKey)}
                description={!isMobile ? t(section.descKey) : undefined}
                action={
                  <div className="export-actions">
                    {isMobile ? (
                      <button
                        type="button"
                        className="export-toggle-btn"
                        onClick={() => toggleSection(section.id)}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? t('export.collapse') : t('export.expand')}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="export-print-btn"
                      onClick={() => handlePrint(section.id)}
                      disabled={summaryLoading}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="6 9 6 2 18 2 18 9" />
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                        <rect x="6" y="14" width="12" height="8" />
                      </svg>
                      {t('export.printButton')}
                    </button>
                  </div>
                }
              >
                {isExpanded ? (
                  <div className="export-preview-scroll">
                    <PrintPreview
                      mode={section.id}
                      summary={summary}
                      t={t}
                      dateLocale={dateLocale}
                      tournamentName={tournamentName}
                      tournamentLocation={tournamentLocation}
                      tournamentDate={tournamentDate}
                    />
                  </div>
                ) : null}
              </PanelCard>
            );
          })}
        </div>
      )}

      <PrintOverlay
        mode={printMode}
        summary={summary}
        t={t}
        dateLocale={dateLocale}
        tournamentName={tournamentName}
        tournamentLocation={tournamentLocation}
        tournamentDate={tournamentDate}
      />
    </div>
  );
}

function PrintPreview({ mode, summary, t, dateLocale, tournamentName, tournamentLocation, tournamentDate }) {
  return (
    <div className="export-preview">
      {mode === 'schedule' ? (
        <PrintSchedule summary={summary} t={t} dateLocale={dateLocale} tournamentName={tournamentName} tournamentLocation={tournamentLocation} tournamentDate={tournamentDate} />
      ) : null}
      {mode === 'standings' ? (
        <PrintStandings summary={summary} t={t} tournamentName={tournamentName} tournamentLocation={tournamentLocation} tournamentDate={tournamentDate} />
      ) : null}
      {mode === 'results' ? (
        <PrintResults summary={summary} t={t} dateLocale={dateLocale} tournamentName={tournamentName} tournamentLocation={tournamentLocation} tournamentDate={tournamentDate} />
      ) : null}
      {mode === 'final' ? (
        <PrintFinal summary={summary} t={t} tournamentName={tournamentName} tournamentLocation={tournamentLocation} tournamentDate={tournamentDate} />
      ) : null}
    </div>
  );
}

function PrintOverlay({ mode, summary, t, dateLocale, tournamentName, tournamentLocation, tournamentDate }) {
  if (!mode || !summary) {
    return null;
  }
  return createPortal(
    <div className="print-overlay">
      <PrintHeader tournamentName={tournamentName} tournamentLocation={tournamentLocation} tournamentDate={tournamentDate} t={t} />
      {mode === 'schedule' ? (
        <PrintSchedule summary={summary} t={t} dateLocale={dateLocale} tournamentName={tournamentName} tournamentLocation={tournamentLocation} tournamentDate={tournamentDate} />
      ) : null}
      {mode === 'standings' ? (
        <PrintStandings summary={summary} t={t} tournamentName={tournamentName} tournamentLocation={tournamentLocation} tournamentDate={tournamentDate} />
      ) : null}
      {mode === 'results' ? (
        <PrintResults summary={summary} t={t} dateLocale={dateLocale} tournamentName={tournamentName} tournamentLocation={tournamentLocation} tournamentDate={tournamentDate} />
      ) : null}
      {mode === 'final' ? (
        <PrintFinal summary={summary} t={t} tournamentName={tournamentName} tournamentLocation={tournamentLocation} tournamentDate={tournamentDate} />
      ) : null}
    </div>,
    document.body
  );
}

function PrintHeader({ tournamentName, tournamentLocation, tournamentDate, t }) {
  return (
    <header className="print-header">
      <h1>{tournamentName}</h1>
      <p>
        {[tournamentLocation, tournamentDate ? formatDateTime(tournamentDate) : null].filter(Boolean).join(' · ')}
      </p>
      <p className="print-header__generated">{t('export.generatedAt', { time: formatDateTime(new Date().toISOString()) })}</p>
    </header>
  );
}

function PrintSchedule({ summary, t, dateLocale, tournamentName, tournamentLocation, tournamentDate }) {
  const schedule = summary?.schedule;
  if (!schedule) {
    return <p>{t('export.noData')}</p>;
  }

  const hasGroup = Array.isArray(schedule.group) && schedule.group.length > 0;
  const hasKnockout = Array.isArray(schedule.knockout) && schedule.knockout.length > 0;
  const hasPlacement = Array.isArray(schedule.placement) && schedule.placement.length > 0;

  if (!hasGroup && !hasKnockout && !hasPlacement) {
    return <p>{t('export.noData')}</p>;
  }

  const groupStandings = summary?.groupStandings ?? [];
  const completedGroups = new Set();
  groupStandings.forEach((g) => {
    if (g.recordedGamesCount >= g.totalMatches && g.totalMatches > 0) {
      completedGroups.add(g.label);
    }
  });

  const resolveLabel = (match, side) => {
    const source = side === 'home' ? match.home_source : match.away_source;
    const label = side === 'home' ? match.home_label : match.away_label;

    if (source?.type === 'groupPosition' && !completedGroups.has(source.group)) {
      return `${source.position}. ${t('export.groupLabel', { group: source.group })}`;
    }

    if (source?.type === 'previousMatch') {
      const detail = match[side];
      if (!detail?.teamId) {
        return detail?.placeholder || label || '';
      }
    }

    return label || '';
  };

  const formatMatchTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(dateLocale, {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderScoreCells = (match) => {
    if (match.result?.hasResult) {
      return (
        <>
          <td className="print-score print-score--filled">{match.result.scoreA ?? 0}</td>
          <td className="print-score print-score--filled">{match.result.scoreB ?? 0}</td>
        </>
      );
    }
    return (
      <>
        <td className="print-score print-score--blank" />
        <td className="print-score print-score--blank" />
      </>
    );
  };

  let gameCounter = 0;

  const sortByTime = (a, b) => {
    const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity;
    const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity;
    if (ta !== tb) return ta - tb;
    return (a.match_order ?? 0) - (b.match_order ?? 0);
  };

  const formatTimeOrNumber = (scheduledAt) => {
    const timeStr = formatMatchTime(scheduledAt);
    if (timeStr) return timeStr;
    gameCounter += 1;
    return `#${gameCounter}`;
  };

  const renderScheduleRows = (rounds, keyPrefix) => {
    const rows = [];
    const sortedRounds = [...rounds].sort((a, b) => {
      const firstA = (a.matches ?? [])[0]?.scheduled_at;
      const firstB = (b.matches ?? [])[0]?.scheduled_at;
      if (firstA && firstB) return new Date(firstA).getTime() - new Date(firstB).getTime();
      return (a.round ?? 0) - (b.round ?? 0);
    });
    sortedRounds.forEach((round) => {
      const matches = [...(round.matches ?? [])].sort(sortByTime);
      rows.push(
        <tr key={`${keyPrefix}-round-${round.round}`} className="print-round-row">
          <td colSpan={5} className="print-round-cell">{t('export.round', { round: round.round })}</td>
        </tr>
      );
      matches.forEach((match) => {
        rows.push(
          <tr key={match.id ?? `${keyPrefix}-${round.round}-${match.match_order}`}>
            <td className="print-time">{formatTimeOrNumber(match.scheduled_at)}</td>
            <td className="print-team">{resolveLabel(match, 'home')}</td>
            {renderScoreCells(match)}
            <td className="print-team">{resolveLabel(match, 'away')}</td>
          </tr>
        );
      });
    });
    return rows;
  };

  const renderStageTable = (stage, keyPrefix) => {
    const sortedMatches = [...(stage.matches ?? [])].sort(sortByTime);
    return (
      <table className="print-schedule">
        <thead>
          <tr>
            <th className="print-schedule__time">{t('export.colTime')}</th>
            <th className="print-schedule__team">{t('export.colHome')}</th>
            <th className="print-schedule__score" />
            <th className="print-schedule__score" />
            <th className="print-schedule__team">{t('export.colAway')}</th>
          </tr>
        </thead>
        <tbody>
          {stage.rounds
            ? renderScheduleRows(stage.rounds, keyPrefix)
            : sortedMatches.map((match) => (
                <tr key={match.id ?? `${keyPrefix}-${match.match_order}`}>
                  <td className="print-time">{formatTimeOrNumber(match.scheduled_at)}</td>
                  <td className="print-team">{resolveLabel(match, 'home')}</td>
                  {renderScoreCells(match)}
                  <td className="print-team">{resolveLabel(match, 'away')}</td>
                </tr>
              ))}
        </tbody>
      </table>
    );
  };

  const sortStagesByTime = (stages) => {
    return [...stages].sort((a, b) => {
      const allA = a.rounds ? a.rounds.flatMap((r) => r.matches ?? []) : (a.matches ?? []);
      const allB = b.rounds ? b.rounds.flatMap((r) => r.matches ?? []) : (b.matches ?? []);
      const minA = allA.reduce((min, m) => {
        const t2 = m.scheduled_at ? new Date(m.scheduled_at).getTime() : Infinity;
        return t2 < min ? t2 : min;
      }, Infinity);
      const minB = allB.reduce((min, m) => {
        const t2 = m.scheduled_at ? new Date(m.scheduled_at).getTime() : Infinity;
        return t2 < min ? t2 : min;
      }, Infinity);
      return minA - minB;
    });
  };

  const renderPhase = (stages, titleKey) => {
    const sorted = sortStagesByTime(stages);
    return (
      <div className="print-block">
        <h3>{t(titleKey)}</h3>
        {sorted.map((stage) => (
          <div key={stage.stage_label} className="print-group">
            <h4 className="print-group-title">{stage.stage_label}</h4>
            {renderStageTable(stage, stage.stage_label)}
          </div>
        ))}
      </div>
    );
  };

  const koAndPlacement = [
    ...(schedule.knockout ?? []),
    ...(schedule.placement ?? [])
  ];
  const hasKoOrPlacement = koAndPlacement.length > 0;

  return (
    <section className="print-section">
      <h2>{t('export.scheduleTitle')}</h2>
      {hasGroup ? renderPhase(schedule.group, 'export.phaseGroup') : null}
      {hasKoOrPlacement ? renderPhase(koAndPlacement, 'export.phaseKnockout') : null}
    </section>
  );
}

function PrintStandings({ summary, t, tournamentName, tournamentLocation, tournamentDate }) {
  const groupStandings = summary?.groupStandings ?? [];
  if (groupStandings.length === 0) {
    return <p>{t('export.noData')}</p>;
  }

  return (
    <section className="print-section">
      <h2>{t('export.standingsTitle')}</h2>
      <div className="print-block">
        {groupStandings.map((group, index) => (
          <div key={group.label ?? index} className="print-group">
            <h4>{group.label}</h4>
            <p className="print-round__label">{t('export.gamesCount', { count: group.recordedGamesCount ?? 0 })}</p>
            {(group.standings ?? []).length === 0 ? (
              <p>{t('export.noResults')}</p>
            ) : (
              <table className="print-table print-table--standings">
                <thead>
                  <tr>
                    <th>#</th>
                    <th className="print-table__team">{t('export.colTeam')}</th>
                    <th>{t('export.colPlayed')}</th>
                    <th>{t('export.colWon')}</th>
                    <th>{t('export.colDrawn')}</th>
                    <th>{t('export.colLost')}</th>
                    <th>{t('export.colGoals')}</th>
                    <th>{t('export.colDiff')}</th>
                    <th>{t('export.colPenalties')}</th>
                    <th>{t('export.colPoints')}</th>
                  </tr>
                </thead>
                <tbody>
                  {group.standings.map((entry, rank) => (
                    <tr key={entry.team}>
                      <td>{rank + 1}</td>
                      <td className="print-table__team">{entry.team}</td>
                      <td>{entry.played}</td>
                      <td>{entry.wins}</td>
                      <td>{entry.draws}</td>
                      <td>{entry.losses}</td>
                      <td>{entry.goalsFor}:{entry.goalsAgainst}</td>
                      <td>{entry.goalDiff}</td>
                      <td>{entry.penalties}</td>
                      <td className="print-table__points">{entry.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function PrintResults({ summary, t, dateLocale, tournamentName, tournamentLocation, tournamentDate }) {
  const recentGames = summary?.recentGames ?? [];
  if (recentGames.length === 0) {
    return <p>{t('export.noData')}</p>;
  }

  const formatGameDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(dateLocale, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <section className="print-section">
      <h2>{t('export.resultsTitle')}</h2>
      <div className="print-block">
        <table className="print-table">
          <thead>
            <tr>
              <th className="print-table__team">{t('export.colHome')}</th>
              <th className="print-table__score">{t('export.colScore')}</th>
              <th className="print-table__team">{t('export.colAway')}</th>
              <th>{t('export.colStage')}</th>
              <th>{t('export.colDate')}</th>
            </tr>
          </thead>
          <tbody>
            {recentGames.map((game) => (
              <tr key={game.id}>
                <td className="print-table__team">{game.teamA}</td>
                <td className="print-table__score">{game.scoreA} : {game.scoreB}</td>
                <td className="print-table__team">{game.teamB}</td>
                <td>
                  {formatStageLabelI18n(game.stageLabelI18n, t, game.stageLabel || t('export.knockoutGame'))}
                </td>
                <td>{formatGameDate(game.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PrintFinal({ summary, t, tournamentName, tournamentLocation, tournamentDate }) {
  const placements = summary?.finalPlacements ?? [];
  const leaders = summary?.playerStats?.leaders ?? {};
  const champion = placements[0];
  const runnerUp = placements[1];

  if (placements.length === 0 && !champion) {
    return <p>{t('export.noData')}</p>;
  }

  const methodLabel = (entry) => {
    switch (entry?.decidedByCode) {
      case 'final':
        return t('export.methodFinal');
      case 'placement_match': {
        const nums = String(entry.decidedBy ?? '').match(/(\d+)\s*[/\-]\s*(\d+)/);
        const from = nums ? Number(nums[1]) : entry.placement % 2 === 1 ? entry.placement : entry.placement - 1;
        const to = nums ? Number(nums[2]) : from + 1;
        return t('export.methodPlacementMatch', { from, to });
      }
      case 'overall_standings':
        return t('export.methodOverallStandings');
      case 'participant':
        return t('export.methodParticipant');
      default:
        return entry?.decidedBy || '';
    }
  };

  return (
    <section className="print-section">
      <h2>{t('export.finalTitle')}</h2>

      {champion ? (
        <div className="print-block print-champion">
          <p className="print-champion__label">{t('export.champion')}</p>
          <h3 className="print-champion__name">{champion.teamName}</h3>
          {runnerUp ? (
            <p>
              <strong>{t('export.runnerUp')}</strong> {runnerUp.teamName}
            </p>
          ) : null}
        </div>
      ) : null}

      {placements.length > 0 ? (
        <div className="print-block">
          <h3>{t('export.placements')}</h3>
          <table className="print-table">
            <thead>
              <tr>
                <th>{t('export.colPlacement')}</th>
                <th className="print-table__team">{t('export.colTeam')}</th>
                <th>{t('export.colDecision')}</th>
                <th>{t('export.colOpponent')}</th>
                <th>{t('export.colResult')}</th>
              </tr>
            </thead>
            <tbody>
              {placements.map((entry) => (
                <tr key={`${entry.teamName}-${entry.placement}`}>
                  <td>#{entry.placement}</td>
                  <td className="print-table__team">{entry.teamName}</td>
                  <td>{methodLabel(entry) || t('export.overallRecord')}</td>
                  <td>{entry.opponent || '—'}</td>
                  <td>{entry.score || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {leaders.topScorers?.[0] || leaders.topThreePointers?.[0] || leaders.mostPenalized?.[0] ? (
        <div className="print-block print-leaders">
          <h3>{t('export.leaders')}</h3>
          <div className="print-leaders__grid">
            {leaders.topScorers?.[0] ? (
              <div className="print-leader-card">
                <p className="print-leader-card__title">{t('export.topScorer')}</p>
                <p className="print-leader-card__name">{leaders.topScorers[0].name}</p>
                <p className="print-leader-card__team">{leaders.topScorers[0].teamName || ''}</p>
                <p className="print-leader-card__value">{t('export.pointsValue', { count: leaders.topScorers[0].points ?? 0 })}</p>
              </div>
            ) : null}
            {leaders.topThreePointers?.[0] ? (
              <div className="print-leader-card">
                <p className="print-leader-card__title">{t('export.threePointSpecialist')}</p>
                <p className="print-leader-card__name">{leaders.topThreePointers[0].name}</p>
                <p className="print-leader-card__team">{leaders.topThreePointers[0].teamName || ''}</p>
                <p className="print-leader-card__value">{t('export.threes', { count: leaders.topThreePointers[0].breakdown?.['3'] ?? 0 })}</p>
              </div>
            ) : null}
            {leaders.mostPenalized?.[0] ? (
              <div className="print-leader-card">
                <p className="print-leader-card__title">{t('export.penaltySeconds')}</p>
                <p className="print-leader-card__name">{leaders.mostPenalized[0].name}</p>
                <p className="print-leader-card__team">{leaders.mostPenalized[0].teamName || ''}</p>
                <p className="print-leader-card__value">{t('export.secondsValue', { count: leaders.mostPenalized[0].penaltySeconds ?? 0 })}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
