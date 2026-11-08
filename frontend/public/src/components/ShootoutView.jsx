import { useTranslation } from 'react-i18next';

const REGULAR_ATTEMPTS = 5;
const COLORS = { next: '#ffe081', winner: '#4ade80', idle: 'rgba(255,255,255,0.18)' };

export default function ShootoutView({ shootout, teamAName, teamBName }) {
  const { t } = useTranslation();
  if (!shootout) return null;
  const status = shootout.status ?? { hits: { a: 0, b: 0 }, decided: false, suddenDeath: false, winner: null, nextTeam: 'a' };
  const attempts = shootout.attempts ?? [];
  const nameOf = (team) => (team === 'b' ? teamBName : teamAName);
  const last = attempts[attempts.length - 1];

  return (
    <section style={{ display: 'grid', gap: '0.8rem', padding: '1rem', borderRadius: '18px', border: '1px solid rgba(255,224,129,0.45)', background: 'rgba(255,224,129,0.07)', textAlign: 'center' }}>
      <header style={{ display: 'grid', gap: '0.2rem' }}>
        <strong style={{ letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '1.05rem' }}>{t('shootout.title')}</strong>
        <span style={{ fontSize: '0.85rem', opacity: 0.75 }}>{t('shootout.regular', { a: shootout.regularScoreA ?? 0, b: shootout.regularScoreB ?? 0 })}</span>
        <span style={{ fontWeight: 700, color: status.decided ? COLORS.winner : COLORS.next }}>
          {status.decided ? t('shootout.winner', { team: nameOf(status.winner) }) : t('shootout.next', { team: nameOf(status.nextTeam) })}
          {status.suddenDeath && !status.decided ? (
            <span style={{ marginLeft: '0.5rem', padding: '0.05rem 0.5rem', borderRadius: '999px', background: 'rgba(248,113,113,0.25)', color: '#fecaca', fontSize: '0.8rem' }}>
              {t('shootout.suddenDeath')}
            </span>
          ) : null}
        </span>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '0.75rem' }}>
        {['a', 'b'].map((team) => {
          const own = attempts.filter((attempt) => attempt.team === team);
          const isNext = !status.decided && status.nextTeam === team;
          const isWinner = status.decided && status.winner === team;
          return (
            <div
              key={team}
              style={{
                display: 'grid',
                gap: '0.45rem',
                padding: '0.75rem',
                borderRadius: '14px',
                border: `2px solid ${isWinner ? COLORS.winner : isNext ? COLORS.next : COLORS.idle}`,
                background: isNext ? 'rgba(255,224,129,0.08)' : isWinner ? 'rgba(74,222,128,0.08)' : 'rgba(8,20,35,0.4)'
              }}
            >
              <strong style={{ overflowWrap: 'anywhere' }}>{nameOf(team)} · {status.hits[team]}</strong>
              <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {Array.from({ length: Math.max(REGULAR_ATTEMPTS, own.length) }, (_, index) => (
                  <span
                    key={index}
                    title={own[index]?.playerName ?? ''}
                    style={{
                      width: '1.05rem',
                      height: '1.05rem',
                      borderRadius: '999px',
                      border: '2px solid rgba(255,255,255,0.7)',
                      background: !own[index] ? 'transparent' : own[index].hit ? '#4ade80' : '#f87171'
                    }}
                  />
                ))}
              </div>
              {isNext ? <small style={{ fontWeight: 700, color: COLORS.next }}>{t('shootout.throwing')}</small> : null}
            </div>
          );
        })}
      </div>
      {last ? (
        <small style={{ opacity: 0.85 }}>
          {t('shootout.lastThrow', { player: last.playerName || nameOf(last.team), result: last.hit ? t('shootout.hit') : t('shootout.miss') })}
        </small>
      ) : null}
    </section>
  );
}
