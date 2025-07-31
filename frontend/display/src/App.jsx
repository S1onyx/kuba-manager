import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // Import useParams
import socket from './socket';
import Scoreboard from './components/Scoreboard';
import Timer from './components/Timer';

export default function App() {
  const [score, setScore] = useState({ teamA: 0, teamB: 0 });
  const [teamNames, setTeamNames] = useState({ teamA: 'Team Rot', teamB: 'Team Blau' });
  const [time, setTime] = useState(0); // Geändert zu number
  const [isRunning, setIsRunning] = useState(false);
  const { matchId } = useParams(); // Get matchId from URL
  const [adjustment, setAdjustment] = useState(0);

  useEffect(() => {
    if (matchId) {
      // Join the room for the specific match
      socket.emit('joinMatch', matchId);
    }

    socket.on(`match:${matchId}:update`, (data) => {
      console.log('Match Update:', data);
      setScore({ teamA: data.match.score_a, teamB: data.match.score_b });
    });

    socket.on(`match:${matchId}:timer:update`, (data) => {
      setTime(data.remainingTime); // Speichert die verbleibende Zeit
    });

    socket.on('match:start', (data) => {
      setIsRunning(true);
    });

    socket.on('match:pause', (data) => {
      setIsRunning(false);
    });

    socket.on('match:resume', (data) => {
      setIsRunning(true);
    });

    socket.on('match:stop', (data) => {
      setIsRunning(false);
      setTime(0); // Setze die Zeit zurück
    });

    socket.on('teams:update', setTeamNames);

    return () => {
      socket.off(`match:${matchId}:update`);
      socket.off(`match:${matchId}:timer:update`);
      socket.off('match:start');
      socket.off('match:pause');
      socket.off('match:resume');
      socket.off('match:stop');
      socket.off('teams:update');
    };
  }, [matchId, socket]);

  // Funktion zur Formatierung der Zeit in MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
  };

  const handleStartMatch = () => {
    socket.emit('match:start', { matchId: matchId });
  };

  const handlePauseMatch = () => {
    socket.emit('match:pause', { matchId: matchId });
  };

  const handleResumeMatch = () => {
    socket.emit('match:resume', { matchId: matchId });
  };

  const handleStopMatch = () => {
    socket.emit('match:stop', { matchId: matchId });
  };

  const handleAdjustTimer = () => {
    socket.emit('timer:adjust', { matchId: matchId, adjustment: adjustment });
  };

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '4rem' }}>Kunstrad Basketball</h1>
      <Scoreboard score={score} teamNames={teamNames} />
      <Timer time={formatTime(time)} isRunning={isRunning} /> {/* Übergabe von isRunning */}

      {/* Testfunktionen */}
      {/* Testfunktionen sind nur sichtbar, wenn eine Match-ID vorhanden ist */}
      {matchId && (
        <div style={{ marginTop: '2rem', border: '1px solid white', padding: '1rem' }}>
          <h2>Testfunktionen</h2>
          <div>
            <label htmlFor="matchId">Match ID:</label>
            <input
              type="text"
              id="matchId"
              value={matchId}
              disabled // Match ID ist jetzt aus der URL
            />
          </div>
          <button onClick={handleStartMatch}>Start Match</button>
          <button onClick={handlePauseMatch}>Pause Match</button>
          <button onClick={handleResumeMatch}>Resume Match</button>
          <button onClick={handleStopMatch}>Stop Match</button>

          <div>
            <label htmlFor="adjustment">Timer Adjustment (seconds):</label>
            <input
              type="number"
              id="adjustment"
              value={adjustment}
              onChange={(e) => setAdjustment(parseInt(e.target.value))}
            />
            <button onClick={handleAdjustTimer}>Adjust Timer</button>
          </div>
        </div>
      )}
    </div>
  );
}