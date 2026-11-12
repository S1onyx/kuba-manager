import { useTranslation } from 'react-i18next';

export default function FreeThrowView({ freeThrows, teamAName, teamBName }) {
  const { t } = useTranslation();
  if (!freeThrows) return null;
  const status = freeThrows.status ?? { made: 0, taken: 0, done: false };
  const team = freeThrows.team === 'b' ? teamBName : teamAName;

  return (
    <section
      style={{
        display: 'grid',
        gap: '0.6rem',
        padding: '0.9rem 1rem',
        borderRadius: '18px',
        border: '1px solid rgba(255,224,129,0.45)',
        background: 'rgba(255,224,129,0.07)',
        textAlign: 'center'
      }}
    >
      <strong style={{ letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '1.05rem' }}>{t('freeThrows.title')}</strong>
      <span style={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
        {team}
      </span>
      <div style={{ display: 'flex', gap: '0.9rem', justifyContent: 'center' }}>
        {Array.from({ length: freeThrows.total }, (_, index) => {
          const attempt = freeThrows.attempts?.[index];
          return (
            <span key={index} style={{ display: 'grid', justifyItems: 'center', gap: '0.2rem', minWidth: '2.5rem' }}>
              <span
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  borderRadius: '999px',
                  border: '2px solid rgba(255,255,255,0.7)',
                  background: !attempt ? 'transparent' : attempt.hit ? '#4ade80' : '#f87171'
                }}
              />
              {attempt?.playerName ? <small style={{ opacity: 0.8, overflowWrap: 'anywhere' }}>{attempt.playerName}</small> : null}
            </span>
          );
        })}
      </div>
      <small style={{ fontWeight: 700, color: status.done ? '#4ade80' : '#ffe081' }}>
        {status.done
          ? t('freeThrows.result', { made: status.made, total: freeThrows.total })
          : `${t('freeThrows.next', { current: status.taken + 1, total: freeThrows.total })}${freeThrows.playerName ? ` · ${freeThrows.playerName}` : ''}`}
      </small>
    </section>
  );
}
