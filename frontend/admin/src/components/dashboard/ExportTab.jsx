import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import PanelCard from '../common/PanelCard.jsx';
import { useDashboard } from '../../context/DashboardContext.jsx';
import { fetchTournamentSummary } from '../../utils/api.js';
import { formatApiError } from '../../utils/apiError.js';
import { formatStageLabelI18n } from '../../utils/stageLabels.js';
import { formatDateTime, formatShortDateTime } from '../../utils/formatters.js';
import { useDateLocale } from '../../i18n/index.js';
import useMediaQuery from '../../hooks/useMediaQuery.js';
import { PrintPhases, PrintTimeline } from './export/PrintSchedules.jsx';

const EXPORT_SECTIONS = [
  { id: 'timeline', labelKey: 'export.sectionTimeline', descKey: 'export.sectionTimelineDesc' },
  { id: 'phases', labelKey: 'export.sectionPhases', descKey: 'export.sectionPhasesDesc' },
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

  const isMobile = useMediaQuery('(max-width: 768px)');
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = useCallback((id) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="tab-container">
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
      />
    </div>
  );
}

const PRINT_COMPONENTS = {
  timeline: PrintTimeline,
  phases: PrintPhases,
  standings: PrintStandings,
  results: PrintResults,
  final: PrintFinal
};

function PrintContent({ mode, summary, t, dateLocale }) {
  const Component = PRINT_COMPONENTS[mode];
  if (!Component) return null;
  return <Component summary={summary} t={t} dateLocale={dateLocale} />;
}

function PrintPreview({ mode, summary, t, dateLocale }) {
  return (
    <div className="export-paper paper">
      <PrintHeader tournament={summary?.tournament} t={t} />
      <PrintContent mode={mode} summary={summary} t={t} dateLocale={dateLocale} />
    </div>
  );
}

function PrintOverlay({ mode, summary, t, dateLocale }) {
  if (!mode || !summary) {
    return null;
  }
  return createPortal(
    <div className="print-overlay paper">
      <PrintHeader tournament={summary?.tournament} t={t} />
      <PrintContent mode={mode} summary={summary} t={t} dateLocale={dateLocale} />
    </div>,
    document.body
  );
}

function PrintHeader({ tournament, t }) {
  return (
    <header className="print-header">
      <h1>{tournament?.name ?? ''}</h1>
      <p>
        {[tournament?.location, tournament?.planned_at ? formatDateTime(tournament.planned_at) : null].filter(Boolean).join(' · ')}
        <span className="print-header__generated">{t('export.generatedAt', { time: formatDateTime(new Date().toISOString()) })}</span>
      </p>
    </header>
  );
}

function PrintStandings({ summary, t }) {
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

function PrintResults({ summary, t, dateLocale }) {
  const recentGames = summary?.recentGames ?? [];
  if (recentGames.length === 0) {
    return <p>{t('export.noData')}</p>;
  }

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
                <td>{formatShortDateTime(game.created_at, dateLocale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PrintFinal({ summary, t }) {
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
