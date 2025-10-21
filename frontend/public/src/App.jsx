import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CurrentMatchCard from './components/CurrentMatchCard.jsx';
import GroupStandingsCard from './components/GroupStandingsCard.jsx';
import StatHighlights from './components/StatHighlights.jsx';
import TeamStatsGrid from './components/TeamStatsGrid.jsx';
import SchedulePreview from './components/SchedulePreview.jsx';
import RecentResults from './components/RecentResults.jsx';
import { useScoreboardFeed } from './hooks/useScoreboardFeed.js';
import { usePublicTournaments } from './hooks/usePublicTournaments.js';
import { useTournamentSummary } from './hooks/useTournamentSummary.js';

export default function App() {
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [activeSummaryTab, setActiveSummaryTab] = useState('overview');

  const selectedTournamentRef = useRef(null);
  const lastScoreboardTournamentIdRef = useRef(null);

  const {
    publicTournaments,
    error: tournamentsError,
    loading: loadingTournaments,
    refresh: refreshPublicTournaments
  } = usePublicTournaments();

  const {
    summary: tournamentSummary,
    error: summaryError,
    loading: loadingSummary,
    refresh: refreshSummary
  } = useTournamentSummary(selectedTournamentId);

  const handleScoreboardEvent = useCallback(
    (payload) => {
      refreshPublicTournaments();
      const activeId = selectedTournamentRef.current || payload?.tournamentId || null;
      if (activeId) {
        refreshSummary(activeId);
      }
    },
    [refreshPublicTournaments, refreshSummary]
  );

  const {
    scoreboard,
    currentGroupStandings,
    recordedGamesCount,
    currentTournamentMeta,
    error: currentError
  } = useScoreboardFeed({ onScoreboardEvent: handleScoreboardEvent });

  const handleTournamentSelect = useCallback((id) => {
    setSelectedTournamentId(id);
  }, []);

  useEffect(() => {
    selectedTournamentRef.current = selectedTournamentId ?? null;
  }, [selectedTournamentId]);

  const scoreboardPublic = useMemo(() => {
    const activeId = scoreboard?.tournamentId ?? currentTournamentMeta?.id ?? null;
    if (!activeId) {
      return true;
    }

    if (currentTournamentMeta && currentTournamentMeta.id === activeId) {
      return Boolean(currentTournamentMeta.is_public);
    }

    return publicTournaments.some((tournament) => tournament.id === activeId);
  }, [scoreboard?.tournamentId, currentTournamentMeta, publicTournaments]);

  useEffect(() => {
    const activeIdCandidate = scoreboard?.tournamentId ?? currentTournamentMeta?.id ?? null;
    const scoreboardId = scoreboardPublic && activeIdCandidate ? activeIdCandidate : null;

    setSelectedTournamentId((prev) => {
      if (scoreboardId) {
        if (lastScoreboardTournamentIdRef.current !== scoreboardId) {
          lastScoreboardTournamentIdRef.current = scoreboardId;
          return scoreboardId;
        }

        if (prev && publicTournaments.some((tournament) => tournament.id === prev)) {
          return prev;
        }

        if (publicTournaments.some((tournament) => tournament.id === scoreboardId)) {
          return scoreboardId;
        }
      } else {
        lastScoreboardTournamentIdRef.current = null;
      }

      if (prev && publicTournaments.some((tournament) => tournament.id === prev)) {
        return prev;
      }

      return publicTournaments.length > 0 ? publicTournaments[0].id : null;
    });
  }, [scoreboard?.tournamentId, currentTournamentMeta, scoreboardPublic, publicTournaments]);

  useEffect(() => {
    setActiveSummaryTab('overview');
  }, [selectedTournamentId]);

  const currentCardData = scoreboardPublic ? scoreboard : null;
  const showPrivateNotice = Boolean(scoreboard?.tournamentId ?? currentTournamentMeta?.id) && !scoreboardPublic;
  const selectedTournament = useMemo(
    () => publicTournaments.find((tournament) => tournament.id === selectedTournamentId) ?? null,
    [publicTournaments, selectedTournamentId]
  );

  const showCurrentGroup = useMemo(
    () => scorecardHasGroup(scoreboard, recordedGamesCount, currentGroupStandings, scoreboardPublic),
    [scoreboard, recordedGamesCount, currentGroupStandings, scoreboardPublic]
  );
  const summaryTabs = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'schedule', label: 'Spielplan' }
  ];
  const summaryTabButtonStyle = (active) => ({
    padding: '0.5rem 1rem',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.25)',
    background: active ? 'rgba(86, 160, 255, 0.35)' : 'transparent',
    color: active ? '#dcefff' : '#f0f4ff',
    fontWeight: active ? 600 : 500,
    letterSpacing: '0.05em',
    cursor: 'pointer'
  });

  return (
    <div
      className="public-app"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        padding: '2.5rem clamp(1.5rem, 4vw, 4rem)'
      }}
    >
      <header style={{ display: 'grid', gap: '0.75rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.8rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Kunstrad Basketball – Public
        </h1>
        <p style={{ opacity: 0.75, fontSize: '1rem' }}>
          Live-Spielstand, Tabellen und Statistiken zum aktuell ausgewählten Turnier.
        </p>
      </header>

      {currentError ? (
        <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255, 82, 82, 0.2)', color: '#ffd8d8' }}>
          {currentError}
        </div>
      ) : null}

      {showPrivateNotice ? (
        <div
          style={{
            padding: '1rem',
            borderRadius: '12px',
            background: 'rgba(255, 171, 64, 0.18)',
            color: '#ffe0b2',
            textAlign: 'center'
          }}
        >
          Das Turnier „{currentTournamentMeta?.name || 'Aktuelles Turnier'}“ ist privat und erscheint nicht im öffentlichen
          Dashboard.
        </div>
      ) : null}

      <CurrentMatchCard scoreboard={currentCardData} />

      {showCurrentGroup ? (
      <section style={{ display: 'grid', gap: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', letterSpacing: '0.05em' }}>Aktuelle Gruppentabelle</h2>
        <GroupStandingsCard
          group={{
            label: formatGroupLabel(scoreboard.stageLabel),
            standings: currentGroupStandings,
            recordedGamesCount
          }}
        />
      </section>
    ) : null}

      <section style={{ display: 'grid', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.3rem', letterSpacing: '0.05em' }}>Öffentliche Turniere</h2>
        {loadingTournaments ? (
          <p style={{ opacity: 0.75 }}>Lade Turnierliste...</p>
        ) : tournamentsError ? (
          <p style={{ color: '#ffb0b0' }}>{tournamentsError}</p>
        ) : publicTournaments.length === 0 ? (
          <p style={{ opacity: 0.75 }}>Noch keine Turniere als öffentlich markiert.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {publicTournaments.map((tournament) => {
              const isSelected = selectedTournamentId === tournament.id;
              const activeTournamentId = scoreboard?.tournamentId ?? currentTournamentMeta?.id;
              const isLive = scoreboardPublic && activeTournamentId === tournament.id;
              return (
                <button
                  key={tournament.id}
                  type="button"
                  onClick={() => handleTournamentSelect(tournament.id)}
                  style={{
                    padding: '0.6rem 1.1rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,0.25)',
                    background: isSelected ? 'rgba(86, 160, 255, 0.25)' : 'transparent',
                    color: isSelected ? '#dcefff' : '#f0f4ff',
                    fontWeight: isSelected ? 600 : 500,
                    letterSpacing: '0.05em',
                    cursor: 'pointer'
                  }}
                >
                  {tournament.name}
                  {isLive ? ' · Live' : ''}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section style={{ display: 'grid', gap: '2rem' }}>
        {summaryError ? (
          <div
            style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255, 82, 82, 0.2)', color: '#ffd8d8' }}
          >
            {summaryError}
          </div>
        ) : null}

        {loadingSummary && selectedTournamentId ? (
          <p style={{ opacity: 0.75 }}>Lade Turnierstatistiken...</p>
        ) : null}

        {tournamentSummary ? (
          <>
            <header style={{ display: 'grid', gap: '0.35rem' }}>
              <h2 style={{ fontSize: '1.45rem', letterSpacing: '0.05em' }}>{tournamentSummary.tournament?.name ?? 'Turnier'}</h2>
              {scoreboardPublic && scoreboard?.tournamentId === tournamentSummary.tournament?.id ? (
                <span style={{ fontSize: '0.85rem', opacity: 0.75 }}>Live aktuell ausgewählt</span>
              ) : null}
            </header>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {summaryTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSummaryTab(tab.id)}
                  style={summaryTabButtonStyle(activeSummaryTab === tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeSummaryTab === 'overview' ? (
              <>
                <StatHighlights totals={tournamentSummary.totals} />
                {Array.isArray(tournamentSummary.groupStandings) && tournamentSummary.groupStandings.length > 0 ? (
                  <section style={{ display: 'grid', gap: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.4rem', letterSpacing: '0.05em' }}>Gruppenübersicht</h2>
                    <div
                      style={{
                        display: 'grid',
                        gap: '1.25rem',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))'
                      }}
                    >
                      {tournamentSummary.groupStandings.map((group) => (
                        <GroupStandingsCard key={group.canonicalLabel} group={group} />
                      ))}
                    </div>
                  </section>
                ) : null}
                <TeamStatsGrid stats={tournamentSummary.overallStats} />
                <RecentResults games={tournamentSummary.recentGames} />
              </>
            ) : (
              <SchedulePreview schedule={tournamentSummary.schedule} />
            )}
          </>
        ) : !loadingSummary && selectedTournamentId ? (
          <p style={{ opacity: 0.75 }}>
            Für {selectedTournament?.name ?? 'dieses Turnier'} liegen noch keine gespeicherten Spiele vor. Ergebnisse
            erscheinen automatisch, sobald Partien abgeschlossen werden.
          </p>
        ) : null}
      </section>
    </div>
  );
}

function scorecardHasGroup(scoreboard, recordedGamesCount, standings, scoreboardPublic) {
  if (!scoreboardPublic) return false;
  if (!scoreboard) return false;
  if (scoreboard.stageType !== 'group') return false;
  return Array.isArray(standings) && standings.length > 0;
}

function formatGroupLabel(label) {
  if (!label) return 'Gruppenphase';
  const upper = label.toUpperCase();
  if (upper.startsWith('GRUPPE')) {
    return label;
  }
  return `Gruppe ${label}`;
}
