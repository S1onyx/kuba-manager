import { useEffect, useMemo, useState } from 'react';
import Scoreboard from './components/Scoreboard.jsx';
import Timer from './components/Timer.jsx';
import socket from './socket.js';

const BASE = import.meta.env.VITE_BACKEND_URL;
const API_BASE = `${BASE}/api`;

function formatTime(seconds = 0) {
  const total = Math.max(0, Math.trunc(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function App() {
  const [scoreboard, setScoreboard] = useState(null);
  const [error, setError] = useState('');

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

  const pageStyle = {
    minHeight: '100vh',
    background: 'radial-gradient(circle at top, #1f3b73 0%, #0b1a2b 55%, #050d1a 100%)',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '3rem 3vw',
    gap: '3rem'
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

  return (
    <div style={pageStyle}>
      <header style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Kunstrad Basketball
        </h1>
        {error && <p style={{ color: '#ff8a80', fontSize: '1.2rem' }}>{error}</p>}
      </header>

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
    </div>
  );
}
