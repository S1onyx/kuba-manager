import { useEffect, useState } from 'react';
import { getMatches } from '../utils/api';

export default function Dashboard() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    getMatches().then(setMatches).catch(console.error);
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      <ul>
        {matches.map(m => (
          <li key={m.id}>{m.teamA} vs. {m.teamB} – {m.score}</li>
        ))}
      </ul>
    </div>
  );
}