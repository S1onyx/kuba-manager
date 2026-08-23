import { useTranslation } from 'react-i18next';
import { usePublicApp } from '../../context/PublicAppContext.jsx';
import NoticeBox from '../common/NoticeBox.jsx';
import SummaryTabs from './SummaryTabs.jsx';
import SummaryContent from './SummaryContent.jsx';

export default function SummarySection() {
  const { t } = useTranslation();
  const {
    summary: {
      tournamentSummary,
      loading: loadingSummary,
      error: summaryError,
      selectedTournament,
      scoreboardPublic
    },
    tournaments: { selectedId },
    scoreboardState: { scoreboard }
  } = usePublicApp();

  return (
    <section style={{ display: 'grid', gap: '2rem' }}>
      {summaryError ? <NoticeBox tone="error">{summaryError}</NoticeBox> : null}

      {loadingSummary && selectedId ? (
        <p style={{ opacity: 0.75 }}>{t('summary.loading')}</p>
      ) : null}

      {tournamentSummary ? (
        <>
          <header style={{ display: 'grid', gap: '0.35rem' }}>
            <h2 style={{ fontSize: 'clamp(1.25rem, 4.5vw, 1.45rem)', letterSpacing: '0.05em', overflowWrap: 'break-word' }}>
              {tournamentSummary.tournament?.name ?? t('summary.defaultTournamentName')}
            </h2>
            {scoreboardPublic && scoreboard?.tournamentId === tournamentSummary.tournament?.id ? (
              <span style={{ fontSize: '0.85rem', opacity: 0.75 }}>{t('summary.liveSelected')}</span>
            ) : null}
          </header>

          <SummaryTabs />
          <SummaryContent />
        </>
      ) : !loadingSummary && selectedId ? (
        <p style={{ opacity: 0.75 }}>
          {t('summary.noGames', { name: selectedTournament?.name ?? t('summary.thisTournament') })}
        </p>
      ) : null}
    </section>
  );
}
