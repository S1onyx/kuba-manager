import { useTranslation } from 'react-i18next';
import { usePublicApp } from '../../context/PublicAppContext.jsx';
import NoticeBox from '../common/NoticeBox.jsx';
import TournamentSection from '../tournaments/TournamentSection.jsx';
import SummarySection from '../summary/SummarySection.jsx';

export default function OverviewView() {
  const { t } = useTranslation();
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
          {t('overview.privateNotice', {
            name: currentTournamentMeta?.name || t('overview.currentTournament')
          })}
        </NoticeBox>
      ) : null}

      <TournamentSection />
      {selectedId ? <SummarySection /> : null}
    </>
  );
}
