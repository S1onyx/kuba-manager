import { useTranslation } from 'react-i18next';

const REGULAR_ATTEMPTS = 5;

function Dots({ attempts }) {
  const slots = Math.max(REGULAR_ATTEMPTS, attempts.length);
  return (
    <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
      {Array.from({ length: slots }, (_, index) => {
        const attempt = attempts[index];
        return (
          <span
            key={index}
            style={{
              width: '2.2rem',
              height: '2.2rem',
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

export default function ShootoutPanel({ shootout, teamNames }) {
  const { t } = useTranslation();
  if (!shootout) return null;
  const status = shootout.status ?? { hits: { a: 0, b: 0 }, decided: false, suddenDeath: false, winner: null };
  const attempts = shootout.attempts ?? [];
  const subtitle = status.decided
    ? t('shootout.winner', { team: status.winner === 'b' ? teamNames.teamB : teamNames.teamA })
    : status.suddenDeath
      ? t('shootout.suddenDeath')
      : t('shootout.regular', { a: shootout.regularScoreA ?? 0, b: shootout.regularScoreB ?? 0 });

  return (
    <section
      style={{
        display: 'grid',
        gap: '1.25rem',
        padding: '1.5rem 2rem',
        borderRadius: '24px',
        background: 'rgba(255,224,129,0.08)',
        border: '2px solid rgba(255,224,129,0.45)',
        textAlign: 'center'
      }}
    >
      <header style={{ display: 'grid', gap: '0.3rem' }}>
        <h2 style={{ margin: 0, fontSize: '2.4rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {t('shootout.title')} {status.hits.a}:{status.hits.b}
        </h2>
        <p style={{ margin: 0, fontSize: '1.4rem', color: status.decided ? '#4ade80' : '#ffe081', fontWeight: 600 }}>{subtitle}</p>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {['a', 'b'].map((team) => (
          <div key={team} style={{ display: 'grid', gap: '0.75rem' }}>
            <strong style={{ fontSize: '1.6rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {team === 'a' ? teamNames.teamA : teamNames.teamB}
            </strong>
            <Dots attempts={attempts.filter((attempt) => attempt.team === team)} />
          </div>
        ))}
      </div>
    </section>
  );
}
