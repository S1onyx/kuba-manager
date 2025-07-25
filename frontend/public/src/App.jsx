import { Outlet, Link } from 'react-router-dom';

export default function App() {
  return (
    <div>
      <header style={{ padding: '1rem', backgroundColor: '#333', color: '#fff' }}>
        <h1>KUBA Ergebnisse</h1>
        <nav>
          <Link to="/" style={{ color: '#fff', marginRight: '1rem' }}>Home</Link>
          <Link to="/matches" style={{ color: '#fff', marginRight: '1rem' }}>Spiele</Link>
          <Link to="/tournament" style={{ color: '#fff' }}>Turnier</Link>
        </nav>
      </header>
      <main style={{ padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
}