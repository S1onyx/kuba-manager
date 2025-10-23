import { usePublicApp } from '../../context/PublicAppContext.jsx';
import NoticeBox from '../common/NoticeBox.jsx';
import SummaryTabs from './SummaryTabs.jsx';
import SummaryContent from './SummaryContent.jsx';

export default function SummarySection() {
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
        <p style={{ opacity: 0.75 }}>Lade Turnierstatistiken...</p>
      ) : null}

      {tournamentSummary ? (
        <>
          <header style={{ display: 'grid', gap: '0.35rem' }}>
            <h2 style={{ fontSize: '1.45rem', letterSpacing: '0.05em' }}>
              {tournamentSummary.tournament?.name ?? 'Turnier'}
            </h2>
            {scoreboardPublic && scoreboard?.tournamentId === tournamentSummary.tournament?.id ? (
              <span style={{ fontSize: '0.85rem', opacity: 0.75 }}>Live aktuell ausgewählt</span>
            ) : null}
          </header>

          <SummaryTabs />
          <SummaryContent />
        </>
      ) : !loadingSummary && selectedId ? (
        <p style={{ opacity: 0.75 }}>
          Für {selectedTournament?.name ?? 'dieses Turnier'} liegen noch keine gespeicherten Spiele vor. Ergebnisse
          erscheinen automatisch, sobald Partien abgeschlossen werden.
        </p>
      ) : null}
    </section>
  );
}
