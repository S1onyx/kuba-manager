import { useEffect, useState } from 'react';
import socket from './socket';
import Scoreboard from './components/Scoreboard';
import Timer from './components/Timer';

export default function App() {
  const [score, setScore] = useState({ teamA: 0, teamB: 0 });
  const [teamNames, setTeamNames] = useState({ teamA: 'Team Rot', teamB: 'Team Blau' });
  const [time, setTime] = useState(0); // Geändert zu number
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    socket.on('score:update', (data) => {
      setScore(data);
    });

    socket.on('timer:update', (data) => {
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
      socket.off('score:update');
      socket.off('timer:update');
      socket.off('match:start');
      socket.off('match:pause');
      socket.off('match:resume');
      socket.off('match:stop');
      socket.off('teams:update');
    };
  }, []);

  // Funktion zur Formatierung der Zeit in MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
  };

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '4rem' }}>Kunstrad Basketball</h1>
      <Scoreboard score={score} teamNames={teamNames} />
      <Timer time={formatTime(time)} isRunning={isRunning} /> {/* Übergabe von isRunning */}
    </div>
  );
}