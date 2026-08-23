import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Dashboard from './pages/Dashboard.jsx';
import AuthGate from './components/auth/AuthGate.jsx';

function DocumentLanguageSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n, i18n.language]);

  return null;
}

export default function App() {
  return (
    <>
      <DocumentLanguageSync />
      <AuthGate>
        <Dashboard />
      </AuthGate>
    </>
  );
}
