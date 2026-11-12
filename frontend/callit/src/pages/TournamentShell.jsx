import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import TopBar from '../components/TopBar.jsx';
import BottomNav from '../components/BottomNav.jsx';
import { ErrorBox, Spinner } from '../components/Feedback.jsx';
import useCallitData from '../hooks/useCallitData.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { currentHash, navigate } from '../hooks/useHashRoute.js';
import { errorMessage } from '../utils/errors.js';
import TipsPage from './TipsPage.jsx';
import RankingPage from './RankingPage.jsx';
import StatsPage from './StatsPage.jsx';
import MatchStatsPage from './MatchStatsPage.jsx';
import ProfilePage from './ProfilePage.jsx';
import RulesPage from './RulesPage.jsx';

function JoinCard({ id, info, onJoined }) {
  const { t } = useTranslation();
  const { isLoggedIn } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="card card--accent stack">
        <strong style={{ fontSize: '1.1rem' }}>{t('join.title')}</strong>
        <span className="muted">{t('join.loginFirst')}</span>
        <button type="button" className="btn btn--primary btn--block" onClick={() => navigate(`/login?next=${encodeURIComponent(currentHash())}`)}>
          {t('home.cta')}
        </button>
      </div>
    );
  }
  if (info.participant?.disqualified) return <div className="banner banner--error">{t('errors.CALLIT_DISQUALIFIED')}</div>;
  if (!info.registrationOpen) return <div className="banner">{t('errors.CALLIT_REGISTRATION_CLOSED')}</div>;

  const join = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api.join(id, code);
      setError(null);
      onJoined();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card card--accent stack" onSubmit={join}>
      <strong style={{ fontSize: '1.1rem' }}>{t('join.title')}</strong>
      <span className="muted small">{t('join.text', { count: info.participantCount })}</span>
      {info.requiresJoinCode ? (
        <div className="field">
          <label htmlFor="joinCode">{t('join.code')}</label>
          <input id="joinCode" className="input" autoCapitalize="none" value={code} onChange={(event) => setCode(event.target.value)} required />
        </div>
      ) : null}
      {error ? <div className="banner banner--error small">{errorMessage(t, error)}</div> : null}
      <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
        {t('join.submit')}
      </button>
      <a href={`#/t/${id}/regeln`} className="small">{t('join.rules')}</a>
    </form>
  );
}

export default function TournamentShell({ route }) {
  const { t } = useTranslation();
  const { id, tab } = route;
  const { isLoggedIn, user } = useAuth();
  const info = useCallitData(() => api.tournament(id), id, [isLoggedIn]);
  const joined = Boolean(info.data?.participant?.joined && !info.data?.participant?.disqualified);
  const matches = useCallitData(() => api.matches(id), id, [isLoggedIn, joined]);

  const name = info.data?.tournament?.name;
  const joinCard = info.data && !joined ? <JoinCard id={id} info={info.data} onJoined={() => info.reload()} /> : null;

  let content;
  if (info.error && !info.data) {
    content = (
      <div className="stack">
        <ErrorBox error={info.error} onRetry={info.reload} />
        <a href="#/" className="btn btn--block">{t('common.backHome')}</a>
      </div>
    );
  } else if (!info.data) {
    content = <Spinner />;
  } else if (tab === 'ranking') {
    content = <RankingPage id={id} />;
  } else if (tab === 'stats') {
    content = <StatsPage id={id} />;
  } else if (tab === 'match') {
    content = <MatchStatsPage id={id} code={route.code} />;
  } else if (tab === 'user') {
    content = <ProfilePage id={id} userId={route.userId} />;
  } else if (tab === 'ich') {
    content = isLoggedIn ? (
      <>
        {joinCard}
        <ProfilePage id={id} userId={user?.id} self joined={joined} />
      </>
    ) : (
      joinCard
    );
  } else if (tab === 'regeln') {
    content = <RulesPage info={info.data} />;
  } else {
    content = <TipsPage id={id} matches={matches} joined={joined} joinCard={joinCard} />;
  }

  return (
    <>
      <TopBar subtitle={name} profileHref={`/t/${id}/ich`} />
      {content}
      <BottomNav tournamentId={id} activeTab={tab} openCount={joined ? matches.data?.openCount ?? 0 : 0} />
    </>
  );
}
