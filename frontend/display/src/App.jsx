import { useEffect, useMemo, useRef, useState } from 'react';
import Scoreboard from './components/Scoreboard.jsx';
import Timer from './components/Timer.jsx';
import GroupStandings from './components/GroupStandings.jsx';
import BracketView from './components/bracket/BracketView.jsx';
import FullscreenToggle from './components/FullscreenToggle.jsx';
import socket from './socket.js';
import { BACKEND_URL } from './config.js';

const BASE = BACKEND_URL;
const API_BASE = `${BASE}/api`;

function formatTime(seconds = 0) {
  const total = Math.max(0, Math.trunc(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatGroupLabel(label) {
  if (!label) {
    return '';
  }

  const upper = label.toUpperCase();
  if (upper.startsWith('GRUPPE')) {
    return label;
  }
  return `Gruppe ${label}`;
}

export default function App() {
  const [scoreboard, setScoreboard] = useState(null);
  const [error, setError] = useState('');
  const [standings, setStandings] = useState(null);
  const [standingsMeta, setStandingsMeta] = useState(null);
  const [standingsError, setStandingsError] = useState('');
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [recordedGamesCount, setRecordedGamesCount] = useState(0);
  const standingsContextRef = useRef(null);
  const displayView = scoreboard?.displayView ?? 'scoreboard';
  const [structure, setStructure] = useState(null);
  const [structureError, setStructureError] = useState('');
  const [structureLoading, setStructureLoading] = useState(false);
  const structureContextRef = useRef({ tournamentId: null });
  const rootRef = useRef(null);
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousMargin = document.body.style.margin;
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.margin = previousMargin;
    };
  }, []);

  useEffect(() => {
    let active = true;

    fetch(`${API_BASE}/scoreboard`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Scoreboard Anfrage fehlgeschlagen');
        }
        return response.json();
      })
      .then((data) => {
        if (active) {
          setScoreboard(data);
          setError('');
        }
      })
      .catch((err) => {
        console.error(err);
        if (active) {
          setError('Scoreboard konnte nicht geladen werden.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleUpdate = (payload) => {
      setScoreboard(payload);
      setError('');
    };

    socket.on('scoreboard:update', handleUpdate);
    return () => {
      socket.off('scoreboard:update', handleUpdate);
    };
  }, []);

  useEffect(() => {
    const contextKey = scoreboard?.tournamentId && scoreboard.stageType === 'group' && scoreboard.stageLabel
      ? `${scoreboard.tournamentId}::${scoreboard.stageLabel}`
      : null;

    if (!contextKey) {
      standingsContextRef.current = null;
      setStandings(null);
      setStandingsMeta(null);
      setStandingsError('');
      setStandingsLoading(false);
      setRecordedGamesCount(0);
      return;
    }

    const shouldShowLoading = standingsContextRef.current !== contextKey || standings === null;
    if (shouldShowLoading) {
      setStandingsLoading(true);
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(`${API_BASE}/scoreboard/standings`);
        if (!response.ok) throw new Error('failed');
        const data = await response.json();
        if (cancelled) return;
        standingsContextRef.current = contextKey;
        setStandings(data.standings ?? []);
        setStandingsMeta({
          tournamentName: data.tournamentName ?? scoreboard.tournamentName ?? '',
          stageLabel: data.stageLabel ?? scoreboard.stageLabel
        });
        setRecordedGamesCount(Number.isFinite(data.recordedGamesCount) ? Number(data.recordedGamesCount) : 0);
        setStandingsError('');
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setStandingsError('Tabelle konnte nicht geladen werden.');
        setStandings(null);
        setStandingsMeta(null);
        setRecordedGamesCount(0);
      } finally {
        if (!cancelled) {
          setStandingsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scoreboard?.tournamentId, scoreboard?.stageType, scoreboard?.stageLabel, scoreboard?.scoreA, scoreboard?.scoreB, scoreboard?.lastUpdated]);

  useEffect(() => {
    if (displayView !== 'bracket' || !scoreboard?.tournamentId) {
      structureContextRef.current = { tournamentId: null };
      setStructure(null);
      setStructureError('');
      setStructureLoading(false);
      return;
    }

    const activeTournamentId = scoreboard.tournamentId;
    if (structureContextRef.current.tournamentId === activeTournamentId && structure) {
      return;
    }

    let cancelled = false;
    setStructureLoading(true);

    fetch(`${API_BASE}/scoreboard/structure`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('failed');
        }
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        setStructure(data?.structure ?? null);
        setStructureError('');
        structureContextRef.current = { tournamentId: activeTournamentId };
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setStructure(null);
        setStructureError('Turnierstruktur konnte nicht geladen werden.');
      })
      .finally(() => {
        if (!cancelled) {
          setStructureLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [displayView, scoreboard?.tournamentId, structure]);

  useEffect(() => {
    const updateScale = () => {
      if (!rootRef.current || !contentRef.current) {
        return;
      }
      const container = rootRef.current;
      const content = contentRef.current;
      const contentWidth = content.offsetWidth;
      const contentHeight = content.offsetHeight;
      if (!contentWidth || !contentHeight) {
        return;
      }
      const computed = window.getComputedStyle(container);
      const paddingX =
        parseFloat(computed.paddingLeft || '0') + parseFloat(computed.paddingRight || '0');
      const paddingY =
        parseFloat(computed.paddingTop || '0') + parseFloat(computed.paddingBottom || '0');
      const availableWidth = Math.max(container.clientWidth - paddingX, 50);
      const availableHeight = Math.max(container.clientHeight - paddingY, 50);
      const nextScale = Math.min(availableWidth / contentWidth, availableHeight / contentHeight);
      const clamped = Math.max(Math.min(nextScale, 1.6), 0.45);
      setScale(clamped);
    };

    updateScale();

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateScale)
      : null;

    if (resizeObserver && contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    window.addEventListener('resize', updateScale);
    return () => {
      window.removeEventListener('resize', updateScale);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [
    displayView,
    scoreboard?.lastUpdated,
    structure?.tournament?.id,
    structure?.groups?.length,
    structure?.schedule?.knockout?.length,
    structure?.schedule?.placement?.length,
    recordedGamesCount
  ]);

  const formattedRemaining = useMemo(() => {
    return formatTime(scoreboard?.remainingSeconds ?? 0);
  }, [scoreboard?.remainingSeconds]);

  const score = useMemo(() => ({
    teamA: scoreboard?.scoreA ?? 0,
    teamB: scoreboard?.scoreB ?? 0
  }), [scoreboard?.scoreA, scoreboard?.scoreB]);

  const teamNames = useMemo(() => ({
    teamA: scoreboard?.teamAName ?? 'Team A',
    teamB: scoreboard?.teamBName ?? 'Team B'
  }), [scoreboard?.teamAName, scoreboard?.teamBName]);

  const extraExpected = useMemo(() => {
    if (!scoreboard || (scoreboard.extraSeconds ?? 0) === 0) {
      return null;
    }
    return formatTime(scoreboard.extraSeconds ?? 0);
  }, [scoreboard?.extraSeconds]);

  const extraElapsed = useMemo(() => {
    if (!scoreboard || (scoreboard.extraElapsedSeconds ?? 0) === 0) {
      return null;
    }
    return formatTime(scoreboard.extraElapsedSeconds ?? 0);
  }, [scoreboard?.extraElapsedSeconds]);

  const halftimeFormatted = useMemo(() => {
    if (!scoreboard || !scoreboard.halftimeSeconds) {
      return null;
    }
    return formatTime(scoreboard.halftimeSeconds);
  }, [scoreboard?.halftimeSeconds]);

  const penalties = scoreboard?.penalties ?? { a: [], b: [] };
  const currentHalf = scoreboard?.currentHalf ?? 1;
  const isHalftimeBreak = Boolean(scoreboard?.isHalftimeBreak);
  const halftimeBreakRemaining = isHalftimeBreak ? formatTime(scoreboard?.halftimePauseRemaining ?? 0) : null;
  const isExtraTime = Boolean(scoreboard?.isExtraTime);
  const showStandingsSection = scoreboard?.stageType === 'group' && Array.isArray(standings) && standings.length > 0;

  const rootWrapperStyle = {
    width: '100vw',
    height: '100vh',
    background: 'radial-gradient(circle at top, #1f3b73 0%, #0b1a2b 55%, #050d1a 100%)',
    color: '#ffffff',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'relative'
  };

  const scaledLayoutStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflow: 'hidden',
    boxSizing: 'border-box'
  };

  const scaledContentStyle = {
    transform: `scale(${scale})`,
    transformOrigin: 'top center',
    width: '1600px',
    margin: '0 auto'
  };

  const basePageStyle = {
    width: '1600px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2.5rem 3rem',
    gap: '2.2rem',
    boxSizing: 'border-box',
    color: '#ffffff'
  };

  const penaltiesWrapperStyle = {
    width: '100%',
    maxWidth: '1200px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '1.75rem'
  };

  const penaltyCardStyle = {
    padding: '1.5rem',
    background: 'rgba(0,0,0,0.35)',
    borderRadius: '18px',
    boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
    backdropFilter: 'blur(4px)',
    textAlign: 'left'
  };

  const penaltyListStyle = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'grid',
    gap: '0.65rem'
  };

  const penaltyItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.12)',
    padding: '0.6rem 0.9rem',
    borderRadius: '10px',
    fontSize: '1.2rem'
  };

  const scoreboardPageStyle = basePageStyle;
  const bracketPageStyle = { ...basePageStyle, gap: '2.5rem' };
  const tournamentName = scoreboard?.tournamentName || standingsMeta?.tournamentName || structure?.tournament?.name || '';
  const bracketTournamentName = scoreboard?.tournamentName || structure?.tournament?.name || '';
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const autoFullscreen = searchParams?.has('fullscreen');

  const bracketContent = (
    <div style={bracketPageStyle}>
      <header style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4.2rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Kunstrad Basketball
        </h1>
        <p style={{ fontSize: '1.4rem', opacity: 0.8, letterSpacing: '0.05em' }}>
          Turnierbaum & Gruppenübersicht
        </p>
        {error && <p style={{ color: '#ff8a80', fontSize: '1.2rem', marginTop: '0.75rem' }}>{error}</p>}
      </header>

      {!scoreboard?.tournamentId ? (
        <p style={{ fontSize: '1.4rem', opacity: 0.8, textAlign: 'center' }}>
          Kein Turnier ausgewählt. Bitte im Admin-Panel ein Turnier für das Scoreboard setzen.
        </p>
      ) : structureLoading ? (
        <p style={{ fontSize: '1.4rem', textAlign: 'center' }}>Lade Turnierstruktur…</p>
      ) : structureError ? (
        <p style={{ fontSize: '1.4rem', textAlign: 'center', color: '#ff8a80' }}>{structureError}</p>
      ) : !structure ? (
        <p style={{ fontSize: '1.4rem', textAlign: 'center', opacity: 0.8 }}>
          Noch keine Turnierstruktur verfügbar. Bitte im Admin-Panel Spielplan und Gruppen pflegen.
        </p>
      ) : (
        <div style={{ width: '100%' }}>
          <BracketView tournamentName={bracketTournamentName} structure={structure} />
        </div>
      )}
    </div>
  );

  const scoreboardContent = (
    <div style={scoreboardPageStyle}>
      <header style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Kunstrad Basketball
        </h1>
        {error && <p style={{ color: '#ff8a80', fontSize: '1.2rem' }}>{error}</p>}
      </header>

      {tournamentName || scoreboard?.stageLabel ? (
        <div style={{ textAlign: 'center' }}>
          {tournamentName ? (
            <h2 style={{ fontSize: '2.4rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              {tournamentName}
            </h2>
          ) : null}
          {scoreboard?.stageLabel ? (
            <p style={{ fontSize: '1.6rem', opacity: 0.85, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span>
                {scoreboard.stageType === 'group'
                  ? `Gruppenphase · ${formatGroupLabel(scoreboard.stageLabel)}`
                  : scoreboard.stageType === 'knockout'
                    ? `KO-Runde · ${scoreboard.stageLabel}`
                    : scoreboard.stageType === 'placement'
                      ? `Platzierung · ${scoreboard.stageLabel}`
                      : scoreboard.stageLabel}
              </span>
              {scoreboard.scheduleCode ? (
                <span style={{ fontSize: '1.1rem', opacity: 0.7, letterSpacing: '0.12em' }}>
                  Matchcode {scoreboard.scheduleCode}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
      ) : null}

      <Scoreboard score={score} teamNames={teamNames} />

      <Timer
        time={formattedRemaining}
        isRunning={Boolean(scoreboard?.isRunning)}
        extraTime={extraExpected}
        extraElapsed={extraElapsed}
        halftimeAt={halftimeFormatted}
        half={currentHalf}
        isHalftimeBreak={isHalftimeBreak}
        halftimeBreakRemaining={halftimeBreakRemaining}
        isExtraTime={isExtraTime}
      />

      <section style={penaltiesWrapperStyle}>
        {['a', 'b'].map((teamKey) => {
          const list = penalties[teamKey] ?? [];
          const name = teamKey === 'a' ? teamNames.teamA : teamNames.teamB;

          return (
            <article key={teamKey} style={penaltyCardStyle}>
              <h3 style={{
                margin: 0,
                marginBottom: '1rem',
                textTransform: 'uppercase',
                fontSize: '1.5rem',
                letterSpacing: '0.08em'
              }}>
                Zeitstrafen {name}
              </h3>
              {list.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.1rem' }}>Keine laufenden Strafen</p>
              ) : (
                <ul style={penaltyListStyle}>
                  {list.map((penalty) => (
                    <li
                      key={penalty.id}
                      style={{
                        ...penaltyItemStyle,
                        opacity: penalty.isExpired ? 0.6 : 1
                      }}
                    >
                      <span>{penalty.name}</span>
                      <span>{penalty.isExpired ? 'abgelaufen' : formatTime(penalty.remainingSeconds)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </section>

      {showStandingsSection && (
        <section style={{ width: '100%', maxWidth: '1200px' }}>
          <h3 style={{ textAlign: 'left', marginBottom: '1rem', fontSize: '2rem' }}>
            Aktuelle Gruppentabelle
            {standingsMeta?.stageLabel ? ` – ${formatGroupLabel(standingsMeta.stageLabel)}` : ''}
          </h3>
          {standingsLoading ? (
            <p style={{ textAlign: 'left' }}>Lade Tabelle...</p>
          ) : standingsError ? (
            <p style={{ textAlign: 'left', color: '#ff8a80' }}>{standingsError}</p>
          ) : (
            <GroupStandings standings={standings ?? []} />
          )}
        </section>
      )}
    </div>
  );

  const activeContent = displayView === 'bracket' ? bracketContent : scoreboardContent;

  return (
    <div ref={rootRef} style={rootWrapperStyle}>
      <div style={scaledLayoutStyle}>
        <div ref={contentRef} style={scaledContentStyle}>
          {activeContent}
        </div>
      </div>
      <FullscreenToggle auto={autoFullscreen} />
    </div>
  );
}
