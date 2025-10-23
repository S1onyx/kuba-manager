import { usePublicApp } from '../../context/PublicAppContext.jsx';
import NoticeBox from '../common/NoticeBox.jsx';
import TournamentSection from '../tournaments/TournamentSection.jsx';
import SummarySection from '../summary/SummarySection.jsx';

export default function OverviewView() {
  const {
    scoreboardState: { error: currentError, currentTournamentMeta },
    summary: { showPrivateNotice },
    tournaments: { selectedId }
  } = usePublicApp();

  return (
    <>
      {currentError ? <NoticeBox tone="error">{currentError}</NoticeBox> : null}

      {showPrivateNotice ? (
        <NoticeBox tone="warning">
          Das Turnier „{currentTournamentMeta?.name || 'Aktuelles Turnier'}“ ist privat und erscheint nicht im öffentlichen
          Dashboard.
        </NoticeBox>
      ) : null}

      <TournamentSection />
      {selectedId ? <SummarySection /> : null}
    </>
  );
}
