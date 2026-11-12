import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { Heatmap, HBarList, ShareBar } from '../components/Charts.jsx';
import { ErrorBox, Spinner } from '../components/Feedback.jsx';
import { IconBack, IconLock } from '../components/Icons.jsx';
import useCallitData from '../hooks/useCallitData.js';
import { formatPct, formatPoints } from '../utils/format.js';

export default function MatchStatsPage({ id, code }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data, error, loading, reload } = useCallitData(() => api.matchStats(id, code), id, [code]);
  const homeLabel = data?.home ?? '';
  const awayLabel = data?.away ?? '';

  return (
    <div className="stack">
      <a href={`#/t/${id}/stats`} className="row small" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
        <IconBack /> {t('stats.back')}
      </a>
      {loading && !data ? <Spinner /> : null}
      <ErrorBox error={error} onRetry={reload} />
      {data ? (
        <>
          <div className="card stack" style={{ textAlign: 'center' }}>
            <strong style={{ fontSize: '1.15rem' }}>{data.label}</strong>
            {data.result ? (
              <div className="result-line">
                <span className="score-big">
                  {data.result.home}:{data.result.away}
                </span>
                {data.result.live ? <span className="pill pill--live">{t('status.live')}</span> : null}
              </div>
            ) : null}
            <span className="muted small">{t('tips.tipCount', { count: data.tipCount })}</span>
          </div>

          {data.hidden ? (
            <div className="card muted row">
              <IconLock /> {t('stats.hiddenUntilKickoff')}
            </div>
          ) : data.tipCount === 0 ? (
            <div className="card muted">{t('stats.noTips')}</div>
          ) : (
            <>
              <div className="card stack">
                <strong>{t('stats.tendency')}</strong>
                <ShareBar shares={data.shares} quotes={data.quotes} labels={{ home: homeLabel, away: awayLabel }} />
                <span className="dim small">{t('stats.quoteHint')}</span>
              </div>

              {data.hits ? (
                <div className="card stack" style={{ gap: 8 }}>
                  <strong>{data.result?.live ? t('stats.ifItStays') : t('stats.hits')}</strong>
                  <div className="kpis">
                    <div className="kpi">
                      <div className="kpi__value">{data.hits.exact}</div>
                      <div className="kpi__label">{t('levels.exact')}</div>
                    </div>
                    <div className="kpi">
                      <div className="kpi__value">{data.hits.diff}</div>
                      <div className="kpi__label">{t('levels.diff')}</div>
                    </div>
                    <div className="kpi">
                      <div className="kpi__value">{data.hits.tendency}</div>
                      <div className="kpi__label">{t('levels.tendency')}</div>
                    </div>
                  </div>
                  <span className="small">
                    {t('stats.avgPoints', { value: formatPoints(data.hits.avgPoints, lang) })}
                    {data.correctTendencyPct !== null ? ` · ${t('stats.onlyPct', { pct: formatPct(data.correctTendencyPct, lang) })}` : ''}
                  </span>
                  {data.exactNicknames.length ? (
                    <span className="small">
                      <span className="muted">{t('stats.exactBy')}: </span>
                      {data.exactNicknames.join(', ')}
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="card stack">
                <strong>{t('stats.topScores')}</strong>
                <HBarList
                  items={data.topScores.map((score) => ({ key: `${score.home}:${score.away}`, label: `${score.home}:${score.away}`, count: score.count, pct: score.pct }))}
                  valueLabel={(item) => `${item.count} · ${formatPct(item.pct, lang)}`}
                />
                {data.average ? <span className="muted small">{t('stats.averageScore', { home: formatPoints(data.average.home, lang), away: formatPoints(data.average.away, lang) })}</span> : null}
                {data.jokers ? <span className="muted small">{t('stats.jokers', { count: data.jokers })}</span> : null}
                {data.advance.home + data.advance.away > 0 ? (
                  <span className="muted small">{t('stats.advance', { home: homeLabel, away: awayLabel, homeCount: data.advance.home, awayCount: data.advance.away })}</span>
                ) : null}
              </div>

              <div className="card stack">
                <strong>{t('stats.heatmap')}</strong>
                <Heatmap cells={data.heatmap} result={data.result} homeLabel={homeLabel} awayLabel={awayLabel} />
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
