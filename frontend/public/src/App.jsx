import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PublicLayout from './components/layout/PublicLayout.jsx';
import PublicHeader from './components/header/PublicHeader.jsx';
import LanguageSwitcher from './components/header/LanguageSwitcher.jsx';
import OverviewView from './components/views/OverviewView.jsx';
import Reglement from './components/Reglement.jsx';
import PublicFooter from './components/footer/PublicFooter.jsx';
import ImpressumPortal from './components/modals/ImpressumPortal.jsx';
import TournamentDetailPage from './components/tournaments/TournamentDetailPage.jsx';
import TournamentRegisterPage from './components/tournaments/TournamentRegisterPage.jsx';
import { PublicAppProvider, usePublicApp } from './context/PublicAppContext.jsx';
import useHashRoute from './hooks/useHashRoute.js';
import './styles.css';

function MainContent() {
  const { isReglementView } = usePublicApp();
  const route = useHashRoute();

  if (route.page === 'tournament-detail') {
    return <TournamentDetailPage tournamentId={route.id} />;
  }
  if (route.page === 'tournament-register') {
    return <TournamentRegisterPage tournamentId={route.id} />;
  }
  return isReglementView ? <Reglement /> : <OverviewView />;
}

function DocumentLanguageSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n, i18n.language]);

  return null;
}

export default function App() {
  return (
    <PublicAppProvider>
      <DocumentLanguageSync />
      <PublicLayout>
        <div className="public-lang-picker">
          <LanguageSwitcher />
        </div>
        <PublicHeader />
        <MainContent />
        <PublicFooter />
      </PublicLayout>
      <ImpressumPortal />
    </PublicAppProvider>
  );
}
