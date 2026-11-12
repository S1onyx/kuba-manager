import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import MatchCard from '../components/MatchCard.jsx';
import SpecialBetCard from '../components/SpecialBetCard.jsx';
import { ErrorBox, Spinner } from '../components/Feedback.jsx';
import useCallitData from '../hooks/useCallitData.js';
import useNow from '../hooks/useNow.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { formatCountdown, groupMatchesByStage, nextKickoff, teamName } from '../utils/format.js';
import { formatStageLabelI18n } from '../utils/stageLabels.js';

const FILTERS = ['open', 'all', 'done'];


export default function TipsPage({ id, matches, joined, joinCard }) {
  const { t } = useTranslation();
  const { isLoggedIn } = useAuth();
  const now = useNow(1000);
  const specials = useCallitData(() => api.specials(id), id, [isLoggedIn, joined]);
  const [filter, setFilter] = useState(null);

  const list = matches.data?.matches ?? [];
  const openWithoutTip = list.filter((match) => match.status === 'open' && !match.myTip);
  const activeFilter = filter ?? (joined && list.some((match) => match.status === 'open') ? 'open' : 'all');
  const filtered = useMemo(
    () =>
      list.filter((match) => {
        if (activeFilter === 'open') return match.status === 'open' || match.status === 'live' || match.status === 'pending';
        if (activeFilter === 'done') return match.status === 'finished' || match.status === 'locked' || match.status === 'live';
        return true;
      }),
    [list, activeFilter]
  );
  const groups = groupMatchesByStage(filtered);
  const next = nextKickoff(openWithoutTip, now);
  const live = list.find((match) => match.status === 'live');
  const specialList = specials.data ?? [];
  const openSpecials = specialList.filter((bet) => !bet.locked);
  const missingSpecials = joined ? openSpecials.filter((bet) => !bet.myValue).length : 0;
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
          <span className="small">{t('tips.liveRanking')}</span>
        </a>
      ) : null}

      {joined ? (
        openWithoutTip.length + missingSpecials > 0 ? (
          <div className="banner">
            <span className="banner__big">{openWithoutTip.length + missingSpecials}</span>
            <span className="grow">
              <strong>{t('tips.openTitle', { count: openWithoutTip.length + missingSpecials })}</strong>
              <br />
              <span className="small muted">
                {next?.scheduledAt
                  ? t('tips.nextKickoff', { time: formatCountdown(Date.parse(next.scheduledAt) - now) })
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

      {openSpecials.length > 0 ? (
        <>
          <h2 className="section-title">{t('specials.title')}</h2>
          {openSpecials.map((bet) => (
            <SpecialBetCard key={bet.betKey} tournamentId={id} bet={bet} canTip={joined} onSaved={specials.reload} />
          ))}
        </>
      ) : null}

      <div className="chips" role="tablist" style={{ marginTop: 8 }}>
        {FILTERS.map((key) => (
          <button key={key} type="button" role="tab" aria-selected={activeFilter === key} className={`chip${activeFilter === key ? ' chip--active' : ''}`} onClick={() => setFilter(key)}>
            {t(`tips.filters.${key}`)}
          </button>
        ))}
      </div>

      <ErrorBox error={matches.error} onRetry={matches.reload} />
      {matches.loading && !matches.data ? <Spinner /> : null}
      {matches.data && filtered.length === 0 ? <div className="card muted">{t('tips.empty')}</div> : null}

      {groups.map((group) => (
        <section key={group.key} className="stack">
          <h2 className="section-title">{formatStageLabelI18n(t, group.stageLabelI18n, group.label)}</h2>
          {group.matches.map((match) => (
            <MatchCard key={match.code} tournamentId={id} match={match} now={now} jokers={jokers} canTip={joined} onSaved={matches.reload} />
          ))}
        </section>
      ))}

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
