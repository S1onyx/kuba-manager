import Dashboard from './pages/Dashboard.jsx';
import AuthGate from './components/auth/AuthGate.jsx';

export default function App() {
  return (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  );
}
