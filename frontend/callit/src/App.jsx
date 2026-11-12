import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './hooks/useAuth.jsx';
import useHashRoute from './hooks/useHashRoute.js';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import TournamentShell from './pages/TournamentShell.jsx';

function DocumentLanguageSync() {
  const { i18n } = useTranslation();
  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  return null;
}

function Routes() {
  const route = useHashRoute();
  if (route.page === 'login') return <LoginPage next={route.next} />;
  if (route.page === 'tournament') return <TournamentShell key={route.id} route={route} />;
  return <HomePage />;
}

export default function App() {
  return (
    <AuthProvider>
      <DocumentLanguageSync />
      <div className="app">
        <Routes />
      </div>
    </AuthProvider>
  );
}
