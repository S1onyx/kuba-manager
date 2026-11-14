import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import MatchCard, { KickoffInfo, PointsPill } from '../components/MatchCard.jsx';
import SpecialBetCard from '../components/SpecialBetCard.jsx';
import { ErrorBox, Spinner } from '../components/Feedback.jsx';
import useCallitData from '../hooks/useCallitData.js';
import useNow from '../hooks/useNow.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { MATCH_FILTERS, filterMatches, formatCountdown, nextKickoff, nextMatch, teamName } from '../utils/format.js';

export default function TipsPage({ id, matches, joined, joinCard }) {
  const { t } = useTranslation();
  const { isLoggedIn } = useAuth();
  const now = useNow(1000);
  const specials = useCallitData(() => api.specials(id), id, [isLoggedIn, joined]);
  const [filter, setFilter] = useState(null);

  const list = matches.data?.matches ?? [];
  const openWithoutTip = list.filter((match) => match.status === 'open' && !match.myTip);
  const activeFilter = filter ?? 'upcoming';
  const filtered = useMemo(() => filterMatches(list, activeFilter), [list, activeFilter]);
  const next = nextKickoff(openWithoutTip, now);
  const live = list.find((match) => match.status === 'live');
  const upNext = nextMatch(list);
  const specialList = specials.data ?? [];
  const openSpecials = specialList.filter((bet) => !bet.locked);
  // Oben nur, was noch fehlt – bereits getippte Sonderwetten wandern in einen zugeklappten Bereich.
  const todoSpecials = joined ? openSpecials.filter((bet) => !bet.myValue) : openSpecials;
  const doneSpecials = joined ? openSpecials.filter((bet) => bet.myValue) : [];
  const missingSpecials = joined ? todoSpecials.length : 0;
  const pendingCount = list.filter((match) => match.status === 'pending').length;
  const openTotal = openWithoutTip.length + missingSpecials;
  const jokers = matches.data?.jokers;

  return (
    <div className="stack">
      {joinCard}

      {live ? (
        <a className="banner" href={`#/t/${id}/ranking`} style={{ textDecoration: 'none', color: 'inherit', borderColor: 'rgba(248,113,113,0.5)', background: 'rgba(248,113,113,0.12)' }}>
          <span className="pill pill--live">{t('status.live')}</span>
          <span className="grow ellipsis">
            {teamName(live, 'home')} {live.result?.home ?? 0}:{live.result?.away ?? 0} {teamName(live, 'away')}
          </span>
          {live.myPoints ? <PointsPill points={live.myPoints} live /> : <span className="small">{t('tips.liveRanking')}</span>}
        </a>
      ) : null}

      {upNext ? (
        <div className="banner">
          <span className="grow">
            <span className="small muted">{t('tips.nextMatch')} · <KickoffInfo match={upNext} now={now} /></span>
            <br />
            <strong>
              {teamName(upNext, 'home')} – {teamName(upNext, 'away')}
            </strong>
          </span>
          {upNext.myTip ? (
            <span className="pill pill--saved">
              {upNext.myTip.scoreHome}:{upNext.myTip.scoreAway}
            </span>
          ) : upNext.status === 'open' && joined ? (
            <span className="pill pill--todo">{t('tips.todo')}</span>
          ) : null}
        </div>
      ) : null}

      {joined ? (
        openTotal > 0 ? (
          <div className="banner">
            <span className="banner__big">{openTotal}</span>
            <span className="grow">
              <strong>{t('tips.openTitle', { count: openTotal })}</strong>
              <br />
              <span className="small muted">
                {next?.scheduledAt
                  ? t('tips.nextKickoff', { time: formatCountdown(Date.parse(next.scheduledAt) - now, t) })
                  : missingSpecials > 0
                    ? t('tips.specialsMissing', { count: missingSpecials })
                    : t('tips.openHint')}
              </span>
            </span>
          </div>
        ) : list.length > 0 ? (
          <div className="banner banner--ok">
            <span className="grow">
              <strong>{t('tips.allDone')}</strong>
              <br />
              <span className="small muted">{t('tips.allDoneHint')}</span>
            </span>
          </div>
        ) : null
      ) : null}

      {jokers?.enabled && joined ? (
        <span className="dim small">
          {t('tips.jokerStatus', { group: `${jokers.group.used}/${jokers.group.total}`, ko: `${jokers.ko.used}/${jokers.ko.total}` })}
          {' · '}
          <a href={`#/t/${id}/regeln`}>{t('tips.rulesLink')}</a>
        </span>
      ) : null}

      {todoSpecials.length > 0 ? (
        <>
          <h2 className="section-title">{t('specials.title')}</h2>
          {todoSpecials.map((bet) => (
            <SpecialBetCard key={bet.betKey} tournamentId={id} bet={bet} canTip={joined} onSaved={specials.reload} />
          ))}
        </>
      ) : null}

      {doneSpecials.length > 0 ? (
        <details className="card">
          <summary className="row row--between" style={{ cursor: 'pointer', minHeight: 32 }}>
            <strong>{t('specials.doneTitle', { count: doneSpecials.length })}</strong>
            <span className="pill pill--saved">{t('tips.saved')}</span>
          </summary>
          <div className="stack" style={{ marginTop: 12 }}>
            <span className="dim small">{t('specials.doneHint')}</span>
            {doneSpecials.map((bet) => (
              <SpecialBetCard key={bet.betKey} tournamentId={id} bet={bet} canTip={joined} onSaved={specials.reload} />
            ))}
          </div>
        </details>
      ) : null}

      <div className="chips" role="tablist" style={{ marginTop: 8 }}>
        {MATCH_FILTERS.map((key) => (
          <button key={key} type="button" role="tab" aria-selected={activeFilter === key} className={`chip${activeFilter === key ? ' chip--active' : ''}`} onClick={() => setFilter(key)}>
            {t(`tips.filters.${key}`)}
          </button>
        ))}
      </div>

      <ErrorBox error={matches.error} onRetry={matches.reload} />
      {matches.loading && !matches.data ? <Spinner /> : null}
      {matches.data && filtered.length === 0 ? <div className="card muted">{t(`tips.empty.${activeFilter}`)}</div> : null}

      {filtered.map((match) => (
        <MatchCard key={match.code} tournamentId={id} match={match} now={now} jokers={jokers} canTip={joined} onSaved={matches.reload} />
      ))}

      {activeFilter === 'open' && pendingCount > 0 ? (
        <button type="button" className="link-row small" onClick={() => setFilter('upcoming')}>
          <span className="muted">{t('tips.pendingCount', { count: pendingCount })}</span>
          <span>{t('tips.filters.upcoming')} →</span>
        </button>
      ) : null}

      {specialList.some((bet) => bet.locked) ? (
        <>
          <h2 className="section-title">{t('specials.closedTitle')}</h2>
          {specialList
            .filter((bet) => bet.locked)
            .map((bet) => (
              <SpecialBetCard key={bet.betKey} tournamentId={id} bet={bet} canTip={false} />
            ))}
        </>
      ) : null}
    </div>
  );
}
