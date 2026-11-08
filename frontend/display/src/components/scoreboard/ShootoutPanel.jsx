import { useTranslation } from 'react-i18next';

const REGULAR_ATTEMPTS = 5;
const COLORS = { next: '#ffe081', winner: '#4ade80', idle: 'rgba(255,255,255,0.18)' };

function Dots({ attempts, size }) {
  const slots = Math.max(REGULAR_ATTEMPTS, attempts.length);
  return (
    <div style={{ display: 'flex', gap: `calc(${size} * 0.3)`, justifyContent: 'center', flexWrap: 'wrap' }}>
      {Array.from({ length: slots }, (_, index) => {
        const attempt = attempts[index];
        return (
          <span
            key={index}
            title={attempt?.playerName ?? ''}
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
  );
}

export function ShootoutView({ shootout, teamNames, scale = 1 }) {
  const { t } = useTranslation();
  if (!shootout) return null;
  const status = shootout.status ?? { hits: { a: 0, b: 0 }, decided: false, suddenDeath: false, winner: null, nextTeam: 'a' };
  const attempts = shootout.attempts ?? [];
  const nameOf = (team) => (team === 'b' ? teamNames.teamB : teamNames.teamA);
  const last = attempts[attempts.length - 1];
  const statusLine = status.decided
    ? t('shootout.winner', { team: nameOf(status.winner) })
    : t('shootout.next', { team: nameOf(status.nextTeam) });
  const rem = (value) => `${value * scale}rem`;

  return (
    <section
      style={{
        display: 'grid',
        gap: rem(1),
        padding: `${rem(1.25)} ${rem(1.5)}`,
        borderRadius: rem(1.4),
        background: 'rgba(255,224,129,0.07)',
        border: '2px solid rgba(255,224,129,0.45)',
        textAlign: 'center',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <header style={{ display: 'grid', gap: rem(0.3) }}>
        <h2 style={{ margin: 0, fontSize: rem(2), letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t('shootout.title')}</h2>
        <p style={{ margin: 0, fontSize: rem(1.05), opacity: 0.75 }}>
          {t('shootout.regular', { a: shootout.regularScoreA ?? 0, b: shootout.regularScoreB ?? 0 })}
        </p>
        <p style={{ margin: 0, fontSize: rem(1.35), fontWeight: 700, color: status.decided ? COLORS.winner : COLORS.next }}>
          {statusLine}
          {status.suddenDeath && !status.decided ? (
            <span style={{ marginLeft: rem(0.6), padding: `${rem(0.1)} ${rem(0.6)}`, borderRadius: '999px', background: 'rgba(248,113,113,0.25)', color: '#fecaca', fontSize: rem(0.95) }}>
              {t('shootout.suddenDeath')}
            </span>
          ) : null}
        </p>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: rem(1.25) }}>
        {['a', 'b'].map((team) => {
          const isNext = !status.decided && status.nextTeam === team;
          const isWinner = status.decided && status.winner === team;
          const border = isWinner ? COLORS.winner : isNext ? COLORS.next : COLORS.idle;
          return (
            <div
              key={team}
              style={{
                display: 'grid',
                gap: rem(0.6),
                padding: rem(1),
                borderRadius: rem(1),
                border: `2px solid ${border}`,
                background: isNext ? 'rgba(255,224,129,0.08)' : isWinner ? 'rgba(74,222,128,0.08)' : 'rgba(8,20,35,0.45)',
                boxShadow: isNext ? '0 0 24px rgba(255,224,129,0.25)' : 'none'
              }}
            >
              <strong style={{ fontSize: rem(1.35), textTransform: 'uppercase', letterSpacing: '0.06em', overflowWrap: 'anywhere' }}>{nameOf(team)}</strong>
              <span style={{ fontSize: rem(3), fontWeight: 800, lineHeight: 1 }}>{status.hits[team]}</span>
              <Dots attempts={attempts.filter((attempt) => attempt.team === team)} size={rem(1.9)} />
              {isNext ? <span style={{ fontSize: rem(0.95), fontWeight: 700, color: COLORS.next }}>{t('shootout.throwing')}</span> : null}
            </div>
          );
        })}
      </div>
      {last ? (
        <p style={{ margin: 0, fontSize: rem(1.05), opacity: 0.85 }}>
          {t('shootout.lastThrow', {
            player: last.playerName || nameOf(last.team),
            result: last.hit ? t('shootout.hit') : t('shootout.miss')
          })}
        </p>
      ) : null}
    </section>
  );
}

export default function ShootoutPanel({ shootout, teamNames }) {
  return <ShootoutView shootout={shootout} teamNames={teamNames} scale={1.15} />;
}
