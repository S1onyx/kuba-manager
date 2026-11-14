import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { HBarList, ShareBar } from '../components/Charts.jsx';
import { ErrorBox, Spinner } from '../components/Feedback.jsx';
import { IconChevron, IconLock } from '../components/Icons.jsx';
import { betTitle } from '../components/SpecialBetCard.jsx';
import useCallitData from '../hooks/useCallitData.js';
import { formatPct, formatPoints, formatQuote } from '../utils/format.js';

function Leaders({ title, items, render }) {
  if (!items?.length) return null;
  return (
    <div className="card stack" style={{ gap: 8 }}>
      <strong>{title}</strong>
      <ol className="list-plain">
        {items.map((item, index) => (
          <li key={item.userId} className="row row--between small">
            <span className="ellipsis">
              {index + 1}. {item.nickname}
            </span>
            <span className="muted">{render(item)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function StatsPage({ id }) {
  const { t, i18n } = useTranslation();
  const { data, error, loading, reload } = useCallitData(() => api.stats(id), id);
  const lang = i18n.language;

  if (loading && !data) return <Spinner />;
  if (!data) return <ErrorBox error={error} onRetry={reload} />;

  return (
    <div className="stack">
      <h1 className="page-title" style={{ marginBottom: 0 }}>{t('stats.title')}</h1>
      <div className="kpis">
        <div className="kpi">
          <div className="kpi__value">{data.participantCount}</div>
          <div className="kpi__label">{t('stats.participants')}</div>
        </div>
        <div className="kpi">
          <div className="kpi__value">{data.tipsTotal}</div>
          <div className="kpi__label">{t('stats.tips')}</div>
        </div>
        <div className="kpi">
          <div className="kpi__value">{data.crowdHitRate === null ? '–' : formatPct(data.crowdHitRate, lang)}</div>
          <div className="kpi__label">{t('stats.crowdHitRate')}</div>
        </div>
      </div>
      <span className="dim small">{t('stats.progress', { done: data.matchesFinished, total: data.matchesTotal })}</span>

      {data.surprises?.length ? (
        <div className="card stack" style={{ gap: 8 }}>
          <strong>{t('stats.surprises')}</strong>
          {data.surprises.map((item) => (
            <a key={item.code} href={`#/t/${id}/stats/${encodeURIComponent(item.code)}`} className="row row--between small" style={{ color: 'inherit', textDecoration: 'none' }}>
              <span className="ellipsis grow">
                {item.label} {item.result ? `${item.result.home}:${item.result.away}` : ''}
              </span>
              <span className="pill pill--todo">{t('stats.onlyPct', { pct: formatPct(item.correctTendencyPct, lang) })}</span>
            </a>
          ))}
        </div>
      ) : null}

      <Leaders title={t('stats.bestHitRate')} items={data.leaders.hitRate} render={(item) => `${formatPct(item.hitRate, lang)} · ${t('stats.games', { count: item.scored })}`} />
      <Leaders title={t('stats.mostExact')} items={data.leaders.exact} render={(item) => t('stats.exactCount', { count: item.exact })} />
      <Leaders title={t('stats.underdogKings')} items={data.leaders.underdog} render={(item) => t('stats.underdogCount', { count: item.underdogHits })} />
      <Leaders title={t('stats.optimists')} items={data.leaders.optimists} render={(item) => t('stats.bias', { value: `+${formatPoints(item.bias, lang)}` })} />
      <Leaders title={t('stats.pessimists')} items={data.leaders.pessimists} render={(item) => t('stats.bias', { value: formatPoints(item.bias, lang) })} />

      {data.specials?.length ? <h2 className="section-title">{t('specials.title')}</h2> : null}
      {data.specials?.map((bet) => (
        <div key={bet.betKey} className="card stack" style={{ gap: 8 }}>
          <div className="row row--between">
            <strong>{betTitle(t, bet)}</strong>
            <span className="dim small">{t('tips.tipCount', { count: bet.tipCount })}</span>
          </div>
          {bet.hidden ? (
            <span className="muted small row" style={{ gap: 4 }}>
              <IconLock /> {t('stats.hiddenUntilLock')}
            </span>
          ) : (
            <>
              <HBarList
                items={bet.distribution.slice(0, 8)}
                valueLabel={(item) => `${formatPct(item.pct, lang)} · ${t('stats.quote')} ${formatQuote(item.quote, lang)}`}
              />
              {bet.average !== null && bet.average !== undefined ? <span className="muted small">{t('stats.averageTip', { value: bet.averageLabel ?? formatPoints(bet.average, lang) })}</span> : null}
              {bet.outcome ? (
                <span className="small">
                  <span className="muted">{bet.outcome.final ? t('specials.result') : t('specials.currently')}: </span>
                  {bet.outcome.labels.join(', ')}
                </span>
              ) : null}
            </>
          )}
        </div>
      ))}

      <h2 className="section-title">{t('stats.matches')}</h2>
      {data.matches.length === 0 ? <div className="card muted">{t('stats.noMatches')}</div> : null}
      {data.matches.map((match) => (
        <a key={match.code} href={`#/t/${id}/stats/${encodeURIComponent(match.code)}`} className="card stack" style={{ gap: 8, color: 'inherit', textDecoration: 'none' }}>
          <div className="row row--between">
            <strong className="ellipsis grow">{match.label}</strong>
            {match.status === 'live' ? <span className="pill pill--live">{t('status.live')}</span> : null}
            {match.hits ? <span className="pill">{t('stats.exactCount', { count: match.hits.exact })}</span> : null}
            <IconChevron />
          </div>
          {match.tipCount > 0 ? <ShareBar shares={match.shares} quotes={match.quotes} showQuotes={false} labels={{ home: '1', away: '2' }} /> : <span className="dim small">{t('stats.noTips')}</span>}
        </a>
      ))}
    </div>
  );
}
