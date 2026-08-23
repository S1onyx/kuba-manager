import { useTranslation } from 'react-i18next';
import BracketView from '../bracket/BracketView.jsx';
import useMediaQuery from '../../hooks/useMediaQuery.js';

export default function BracketPage({
  scoreboard,
  error,
  structure,
  structureError,
  structureLoading
}) {
  const { t } = useTranslation();
  const isCompact = useMediaQuery('(max-width: 1100px)');
  const isMobile = useMediaQuery('(max-width: 720px)');
  const tournamentName = scoreboard?.tournamentName || structure?.tournament?.name || '';

  let content;
  if (!scoreboard?.tournamentId) {
    content = (
      <p style={{ fontSize: 'clamp(1rem, 1.8vw, 1.4rem)', opacity: 0.8, textAlign: 'center' }}>
        {t('bracket.noTournament')}
      </p>
    );
  } else if (structureLoading) {
    content = <p style={{ fontSize: 'clamp(1rem, 1.8vw, 1.4rem)', textAlign: 'center' }}>{t('bracket.loading')}</p>;
  } else if (structureError) {
    content = (
      <p style={{ fontSize: 'clamp(1rem, 1.8vw, 1.4rem)', textAlign: 'center', color: '#ff8a80' }}>{structureError}</p>
    );
  } else if (!structure) {
    content = (
      <p style={{ fontSize: 'clamp(1rem, 1.8vw, 1.4rem)', textAlign: 'center', opacity: 0.8 }}>
        {t('bracket.noStructure')}
      </p>
    );
  } else {
    content = (
      <div style={{ width: '100%' }}>
        <BracketView tournamentName={tournamentName} structure={structure} />
      </div>
    );
  }

  const containerStyle = {
    width: '100%',
    maxWidth: '1600px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: isCompact ? 'stretch' : 'center',
    padding: isMobile
      ? '1.5rem clamp(0.75rem, 4vw, 1.5rem)'
      : isCompact
        ? '2rem clamp(1rem, 4vw, 2.25rem)'
        : '2.5rem 3rem',
    gap: isMobile ? '1.5rem' : '2.5rem',
    boxSizing: 'border-box',
    color: '#ffffff'
  };

  const headingSize = isMobile ? '2.6rem' : isCompact ? '3.4rem' : '4.2rem';
  const subHeadingSize = isMobile ? '1.1rem' : '1.4rem';

  return (
    <div style={containerStyle}>
      <header style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontSize: headingSize,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '1rem'
          }}
        >
          Kunstrad Basketball
        </h1>
        <p style={{ fontSize: subHeadingSize, opacity: 0.8, letterSpacing: '0.05em' }}>
          {t('bracket.title')}
        </p>
        {error ? (
          <p style={{ color: '#ff8a80', fontSize: 'clamp(1rem, 1.5vw, 1.2rem)', marginTop: '0.75rem' }}>{error}</p>
        ) : null}
      </header>

      {content}
    </div>
  );
}
