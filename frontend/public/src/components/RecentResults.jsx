import { useTranslation } from 'react-i18next';
import { useDateLocale } from '../i18n/index.js';
import { formatStageLabelI18n } from '../utils/stageLabels.js';

const listStyle = {
  display: 'grid',
  gap: '0.8rem'
};

const itemStyle = {
  display: 'grid',
  gap: '0.45rem',
  padding: '0.85rem 1.1rem',
  borderRadius: '14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.04)'
};

const rowStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
  alignItems: 'center',
  fontSize: '0.95rem',
  columnGap: '0.75rem'
};

const teamStyle = {
  fontWeight: 600,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const scoreStyle = {
  fontWeight: 700,
  letterSpacing: '0.04em',
  minWidth: '3.5rem',
  textAlign: 'center',
  whiteSpace: 'nowrap'
};

const metaStyle = {
  fontSize: '0.78rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  opacity: 0.65
};

const responsiveStyles = `
  @media (max-width: 768px) {
    .recent-results__item {
      padding: 0.75rem 0.9rem;
    }
    .recent-results__row {
      font-size: 0.9rem;
      column-gap: 0.5rem;
    }
  }
`;

export default function RecentResults({ games = [] }) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  if (!games || games.length === 0) {
    return null;
  }

  return (
    <section style={{ display: 'grid', gap: '1rem' }}>
      <header>
        <h3 style={{ fontSize: '1.2rem', letterSpacing: '0.05em' }}>{t('recentResults.title')}</h3>
      </header>
      <div style={listStyle}>
        {games.map((game) => (
          <article key={game.id} className="recent-results__item" style={itemStyle}>
            <div className="recent-results__row" style={rowStyle}>
              <strong style={{ ...teamStyle, textAlign: 'left' }}>{game.teamA}</strong>
              <span className="recent-results__score" style={scoreStyle}>
                {game.scoreA} : {game.scoreB}
              </span>
              <strong style={{ ...teamStyle, textAlign: 'right' }}>{game.teamB}</strong>
            </div>
            <div style={metaStyle}>
              {formatStageLabelI18n(
                t,
                game.stageLabelI18n,
                game.stageType === 'group'
                  ? t('recentResults.group', { label: game.stageLabel })
                  : game.stageLabel || t('recentResults.knockoutGame')
              )}{' '}
              ·{' '}
              {new Date(game.created_at).toLocaleString(dateLocale, {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </article>
        ))}
      </div>
      <style>{responsiveStyles}</style>
    </section>
  );
}
