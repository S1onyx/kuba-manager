import PublicLayout from './components/layout/PublicLayout.jsx';
import PublicHeader from './components/header/PublicHeader.jsx';
import OverviewView from './components/views/OverviewView.jsx';
import Reglement from './components/Reglement.jsx';
import PublicFooter from './components/footer/PublicFooter.jsx';
import ImpressumPortal from './components/modals/ImpressumPortal.jsx';
import { PublicAppProvider, usePublicApp } from './context/PublicAppContext.jsx';
import './styles.css';

function MainContent() {
  const { isReglementView } = usePublicApp();
  return isReglementView ? <Reglement /> : <OverviewView />;
}

export default function App() {
  return (
    <PublicAppProvider>
      <PublicLayout>
        <PublicHeader />
        <MainContent />
        <PublicFooter />
      </PublicLayout>
      <ImpressumPortal />
    </PublicAppProvider>
  );
}
