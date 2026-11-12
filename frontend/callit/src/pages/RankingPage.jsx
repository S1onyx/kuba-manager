import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { ErrorBox, Spinner } from '../components/Feedback.jsx';
import useCallitData from '../hooks/useCallitData.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { RANKING_CATEGORIES, categoryValueSuffix, formatPoints, teamName } from '../utils/format.js';

export function Delta({ value }) {
  if (!value) return null;
  return <span className={`delta ${value > 0 ? 'delta--up' : 'delta--down'}`}>{value > 0 ? `▲${value}` : `▼${Math.abs(value)}`}</span>;
}

function RankRow({ id, row, category, isMe, sticky }) {
  const { t, i18n } = useTranslation();
  const suffix = categoryValueSuffix(category);
  return (
    <a
      href={`#/t/${id}/user/${row.userId}`}
      className={`rank-row${isMe ? ' rank-row--me' : ''}${sticky ? ' rank-row--sticky' : ''}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <span className={`rank-row__rank rank-row__rank--${row.rank}`}>{row.rank}</span>
      <span className="stack" style={{ gap: 2, minWidth: 0 }}>
        <span className="row" style={{ gap: 6 }}>
          <strong className="ellipsis">{row.nickname}</strong>
          <Delta value={row.delta} />
          {row.livePoints > 0 ? <span className="pill pill--live">+{formatPoints(row.livePoints, i18n.language)}</span> : null}
        </span>
        <span className="dim small ellipsis">
          {t('ranking.rowDetail', { exact: row.exact, diff: row.diff, tendency: row.tendency })}
          {row.specialPoints > 0 ? ` · ${t('ranking.specialsShort', { points: formatPoints(row.specialPoints, i18n.language) })}` : ''}
          {row.specialPointsProvisional > 0 ? ` · ${t('ranking.provisionalShort', { points: formatPoints(row.specialPointsProvisional, i18n.language) })}` : ''}
        </span>
      </span>
      <span className="rank-row__value">
        {formatPoints(row.value, i18n.language)}
        <span className="dim small" style={{ display: 'block', fontWeight: 400 }}>{t(`ranking.unit.${suffix}`)}</span>
      </span>
    </a>
  );
}

export default function RankingPage({ id }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [category, setCategory] = useState('total');
  const { data, error, loading, reload } = useCallitData(() => api.ranking(id, category), id, [category]);
  const rows = data?.rows ?? [];
  const me = rows.find((row) => row.userId === user?.id);
  const showPinned = me && rows.indexOf(me) >= 8;

  return (
    <div className="stack">
      <h1 className="page-title" style={{ marginBottom: 0 }}>{t('ranking.title')}</h1>
      <div className="chips" role="tablist">
        {RANKING_CATEGORIES.map((key) => (
          <button key={key} type="button" role="tab" aria-selected={category === key} className={`chip${category === key ? ' chip--active' : ''}`} onClick={() => setCategory(key)}>
            {t(`ranking.categories.${key}`)}
          </button>
        ))}
      </div>

      {data?.live && data.liveMatch ? (
        <div className="banner" style={{ borderColor: 'rgba(248,113,113,0.5)', background: 'rgba(248,113,113,0.12)' }}>
          <span className="pill pill--live">{t('status.live')}</span>
          <span className="grow ellipsis small">
            {teamName(data.liveMatch, 'home')} {data.liveMatch.result?.home ?? 0}:{data.liveMatch.result?.away ?? 0} {teamName(data.liveMatch, 'away')}
          </span>
        </div>
      ) : null}
      {data?.live ? <span className="dim small">{t('ranking.liveHint')}</span> : null}

      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? <Spinner /> : null}
      {data && rows.length === 0 ? <div className="card muted">{t('ranking.empty')}</div> : null}

      <div className="rank-list">
        {rows.map((row) => (
          <RankRow key={row.userId} id={id} row={row} category={category} isMe={row.userId === user?.id} />
        ))}
        {showPinned ? <RankRow id={id} row={me} category={category} isMe sticky /> : null}
      </div>
      {data ? <span className="dim small">{t('ranking.footer', { count: data.participantCount })}</span> : null}
    </div>
  );
}
