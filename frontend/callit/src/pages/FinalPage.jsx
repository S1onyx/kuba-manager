import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { ErrorBox, Spinner } from '../components/Feedback.jsx';
import { betTitle } from '../components/SpecialBetCard.jsx';
import useCallitData from '../hooks/useCallitData.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { formatPct, formatPoints } from '../utils/format.js';

const PODIUM_ORDER = [2, 1, 3];
const PODIUM_HEIGHT = { 1: 120, 2: 92, 3: 72 };
const PODIUM_COLOR = { 1: '#facc15', 2: '#e5e7eb', 3: '#fdba74' };

function Podium({ podium, id, myId }) {
  const { i18n, t } = useTranslation();
  const byRank = (rank) => podium.filter((row) => row.rank === rank);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, alignItems: 'end' }}>
      {PODIUM_ORDER.map((rank) => {
        const rows = byRank(rank);
        return (
          <div key={rank} style={{ display: 'grid', gap: 6, justifyItems: 'center', textAlign: 'center', minWidth: 0 }}>
            {rows.length ? (
              rows.map((row) => (
                <a
                  key={row.userId}
                  href={`#/t/${id}/user/${row.userId}`}
                  style={{ color: 'inherit', textDecoration: 'none', minWidth: 0, maxWidth: '100%' }}
                >
                  <strong className="ellipsis" style={{ display: 'block', fontSize: rank === 1 ? '1.1rem' : '0.95rem', color: row.userId === myId ? '#9cc8ff' : undefined }}>
                    {row.nickname}
                  </strong>
                  <span className="muted small">{t('final.points', { points: formatPoints(row.total, i18n.language) })}</span>
                </a>
              ))
            ) : (
              <span className="dim small">–</span>
            )}
            <div
              style={{
                width: '100%',
                height: PODIUM_HEIGHT[rank],
                borderRadius: '14px 14px 4px 4px',
                background: `linear-gradient(180deg, ${PODIUM_COLOR[rank]}55, ${PODIUM_COLOR[rank]}15)`,
                border: `1px solid ${PODIUM_COLOR[rank]}88`,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: 8,
                fontSize: '2rem',
                fontWeight: 900,
                color: PODIUM_COLOR[rank]
              }}
            >
              {rank}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function FinalPage({ id }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { user } = useAuth();
  const { data, error, loading, reload } = useCallitData(() => api.final(id), id);

  if (loading && !data) return <Spinner />;
  if (!data) return <ErrorBox error={error} onRetry={reload} />;

  const me = data.ranking.find((row) => row.userId === user?.id);
  const { highlights } = data;

  return (
    <div className="stack">
      <div className="card card--accent stack" style={{ textAlign: 'center', gap: 6 }}>
        <span className="pill pill--gold" style={{ justifySelf: 'center' }}>{t('final.badge')}</span>
        <h1 style={{ margin: 0, fontSize: '1.6rem' }}>{t('final.title')}</h1>
        <span className="muted small">{t('final.subtitle', { name: data.tournament.name, count: data.participantCount })}</span>
      </div>

      {data.pendingSpecials > 0 ? <div className="banner small">{t('final.pendingSpecials', { count: data.pendingSpecials })}</div> : null}

      {data.podium.length ? (
        <div className="card">
          <Podium podium={data.podium} id={id} myId={user?.id} />
        </div>
      ) : null}

      {me ? (
        <a href={`#/t/${id}/ich`} className="card row row--between" style={{ color: 'inherit', textDecoration: 'none', borderColor: 'rgba(86,160,255,0.55)' }}>
          <span className="stack" style={{ gap: 2 }}>
            <strong>{t('final.yourResult')}</strong>
            <span className="muted small">
              {t('ranking.rowDetail', { exact: me.exact, diff: me.diff, tendency: me.tendency })}
              {' · '}
              {t('me.split', { matches: formatPoints(me.matchPoints, lang), specials: formatPoints(me.specialPoints, lang) })}
            </span>
          </span>
          <span style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 900 }}>{me.rank}.</span>
            <span className="muted small" style={{ display: 'block' }}>{t('final.points', { points: formatPoints(me.total, lang) })}</span>
          </span>
        </a>
      ) : null}

      {data.categoryWinners.length ? (
        <>
          <h2 className="section-title">{t('final.categories')}</h2>
          <div className="card stack" style={{ gap: 10 }}>
            {data.categoryWinners.map((entry) => (
              <div key={entry.category} className="row row--between small">
                <span className="muted">{t(`ranking.categories.${entry.category}`)}</span>
                <span style={{ textAlign: 'right' }}>
                  <strong>{entry.winners.map((winner) => winner.nickname).join(', ')}</strong>
                  <span className="dim"> · {formatPoints(entry.value, lang)} {t(`ranking.unit.${entry.category === 'exact' || entry.category === 'underdog' ? 'hits' : 'points'}`)}</span>
                </span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {data.specials.length ? (
        <>
          <h2 className="section-title">{t('final.specials')}</h2>
          {data.specials.map((bet) => (
            <div key={bet.betKey} className="card stack" style={{ gap: 6 }}>
              <div className="row row--between">
                <strong>{betTitle(t, bet)}</strong>
                <span className="pill pill--gold">{t('specials.points', { points: formatPoints(bet.points, lang) })}</span>
              </div>
              <span className="small">
                <span className="muted">{t('specials.result')}: </span>
                <strong>{bet.outcome ? bet.outcome.labels.join(', ') : '–'}</strong>
                {bet.outcome && !bet.outcome.final ? <span className="dim"> ({t('specials.provisional')})</span> : null}
              </span>
              {bet.tipCount === 0 ? (
                <span className="dim small">{t('stats.noTips')}</span>
              ) : (
                <span className="small">
                  <span className="muted">{t('final.hitBy', { count: bet.hitters.length, total: bet.tipCount })}: </span>
                  {bet.hitters.length ? bet.hitters.join(', ') : t('final.nobody')}
                </span>
              )}
            </div>
          ))}
        </>
      ) : null}

      <h2 className="section-title">{t('final.highlights')}</h2>
      <div className="kpis">
        <div className="kpi">
          <div className="kpi__value">{highlights.matchesFinished}</div>
          <div className="kpi__label">{t('final.matches')}</div>
        </div>
        <div className="kpi">
          <div className="kpi__value">{highlights.tipsTotal}</div>
          <div className="kpi__label">{t('stats.tips')}</div>
        </div>
        <div className="kpi">
          <div className="kpi__value">{highlights.crowdHitRate === null ? '–' : formatPct(highlights.crowdHitRate, lang)}</div>
          <div className="kpi__label">{t('stats.crowdHitRate')}</div>
        </div>
      </div>
      <div className="card stack" style={{ gap: 8 }}>
        {highlights.bestHitRate ? (
          <span className="small">
            <span className="muted">{t('stats.bestHitRate')}: </span>
            <strong>{highlights.bestHitRate.nickname}</strong> · {formatPct(highlights.bestHitRate.hitRate, lang)}
          </span>
        ) : null}
        {highlights.mostExact ? (
          <span className="small">
            <span className="muted">{t('final.mostExactMatch')}: </span>
            <strong>{highlights.mostExact.label}</strong>
            {highlights.mostExact.result ? ` ${highlights.mostExact.result.home}:${highlights.mostExact.result.away}` : ''} · {t('stats.exactCount', { count: highlights.mostExact.exact })}
          </span>
        ) : null}
        {highlights.surprise ? (
          <span className="small">
            <span className="muted">{t('final.surprise')}: </span>
            <strong>{highlights.surprise.label}</strong>
            {highlights.surprise.result ? ` ${highlights.surprise.result.home}:${highlights.surprise.result.away}` : ''} · {t('stats.onlyPct', { pct: formatPct(highlights.surprise.correctTendencyPct, lang) })}
          </span>
        ) : null}
      </div>

      <h2 className="section-title">{t('final.ranking')}</h2>
      <div className="card" style={{ padding: 0 }}>
        <ol className="list-plain" style={{ gap: 0 }}>
          {data.ranking.map((row) => (
            <li key={row.userId}>
              <a
                href={`#/t/${id}/user/${row.userId}`}
                className="row row--between"
                style={{
                  padding: '10px 14px',
                  minHeight: 48,
                  color: 'inherit',
                  textDecoration: 'none',
                  borderTop: '1px solid var(--border)',
                  background: row.userId === user?.id ? 'var(--accent-soft)' : undefined
                }}
              >
                <span className="row" style={{ gap: 10, minWidth: 0 }}>
                  <strong style={{ width: 28, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.rank}.</strong>
                  <span className="ellipsis">{row.nickname}</span>
                </span>
                <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{formatPoints(row.total, lang)}</strong>
              </a>
            </li>
          ))}
        </ol>
      </div>
      <a href={`#/t/${id}/stats`} className="btn btn--block">{t('final.toStats')}</a>
    </div>
  );
}
