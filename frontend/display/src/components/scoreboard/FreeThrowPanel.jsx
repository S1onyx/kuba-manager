import { useTranslation } from 'react-i18next';

const COLORS = { next: '#ffe081', done: '#4ade80' };

export default function FreeThrowPanel({ freeThrows, teamNames, scale = 1.15 }) {
  const { t } = useTranslation();
  if (!freeThrows) return null;
  const status = freeThrows.status ?? { made: 0, taken: 0, done: false };
  const team = freeThrows.team === 'b' ? teamNames.teamB : teamNames.teamA;
  const rem = (value) => `${value * scale}rem`;
  const size = rem(2.2);

  return (
    <section
      style={{
        display: 'grid',
        gap: rem(0.8),
        padding: `${rem(1)} ${rem(1.5)}`,
        borderRadius: rem(1.4),
        background: 'rgba(255,224,129,0.07)',
        border: '2px solid rgba(255,224,129,0.45)',
        textAlign: 'center',
        width: '100%',
        maxWidth: rem(34),
        margin: '0 auto',
        boxSizing: 'border-box'
      }}
    >
      <h2 style={{ margin: 0, fontSize: rem(1.8), letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {t('freeThrows.title')}
      </h2>
      <strong style={{ fontSize: rem(1.4), textTransform: 'uppercase', letterSpacing: '0.06em', overflowWrap: 'anywhere' }}>
        {team}
        {freeThrows.playerName ? ` · ${freeThrows.playerName}` : ''}
      </strong>
      <div style={{ display: 'flex', gap: rem(0.7), justifyContent: 'center' }}>
        {Array.from({ length: freeThrows.total }, (_, index) => {
          const attempt = freeThrows.attempts?.[index];
          return (
            <span
              key={index}
              style={{
                width: size,
                height: size,
                borderRadius: '999px',
                border: '3px solid rgba(255,255,255,0.75)',
                background: !attempt ? 'transparent' : attempt.hit ? '#4ade80' : '#f87171',
                boxShadow: attempt?.hit ? '0 0 18px rgba(74,222,128,0.55)' : 'none'
              }}
            />
          );
        })}
      </div>
      <p style={{ margin: 0, fontSize: rem(1.2), fontWeight: 700, color: status.done ? COLORS.done : COLORS.next }}>
        {status.done
          ? t('freeThrows.result', { made: status.made, total: freeThrows.total })
          : t('freeThrows.next', { current: status.taken + 1, total: freeThrows.total })}
      </p>
    </section>
  );
}
