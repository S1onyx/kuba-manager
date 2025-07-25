import { useEffect, useState } from 'react';
import socket from './socket';
import Scoreboard from './components/Scoreboard';
import Timer from './components/Timer';

export default function App() {
  const [score, setScore] = useState({ teamA: 0, teamB: 0 });
  const [teamNames, setTeamNames] = useState({ teamA: 'Team Rot', teamB: 'Team Blau' });
  const [time, setTime] = useState('00:00');

  useEffect(() => {
    socket.on('score:changed', setScore);
    socket.on('timer:update', setTime);
    socket.on('teams:update', setTeamNames);

    return () => {
      socket.off('score:changed');
      socket.off('timer:update');
      socket.off('teams:update');
    };
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '4rem' }}>Kunstrad Basketball</h1>
      <Scoreboard score={score} teamNames={teamNames} />
      <Timer time={time} />
    </div>
  );
}