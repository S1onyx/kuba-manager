import { useTranslation } from 'react-i18next';
import BracketGroupTables from './BracketGroupTables.jsx';
import BracketStageMatches from './BracketStageMatches.jsx';

const containerStyle = {
  display: 'grid',
  gap: 'clamp(1.5rem, 4vw, 2.5rem)'
};

const headerStyle = {
  display: 'grid',
  gap: '0.4rem',
  textAlign: 'center'
};

const titleStyle = {
  margin: 0,
  fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em'
};

const subtitleStyle = {
  margin: 0,
  fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
  opacity: 0.75,
  letterSpacing: '0.08em'
};

export default function BracketView({ tournamentName, structure }) {
  const { t } = useTranslation();
  const knockoutStages = structure?.schedule?.knockout ?? [];
  const placementStages = structure?.schedule?.placement ?? [];

  return (
    <div style={containerStyle}>
      {tournamentName ? (
        <header style={headerStyle}>
          <h2 style={titleStyle}>{tournamentName}</h2>
          <p style={subtitleStyle}>{t('bracket.subtitle')}</p>
        </header>
      ) : null}

      <BracketGroupTables groups={structure?.groups ?? []} />
      <BracketStageMatches title={t('bracket.knockoutTitle')} stages={knockoutStages} />
      <BracketStageMatches title={t('bracket.placementTitle')} stages={placementStages} />
    </div>
  );
}
