import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import TopBar, { MainSiteLink } from '../components/TopBar.jsx';
import { ErrorBox, Spinner } from '../components/Feedback.jsx';
import { IconChevron } from '../components/Icons.jsx';
import useCallitData from '../hooks/useCallitData.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { navigate } from '../hooks/useHashRoute.js';
import { useDateLocale } from '../i18n/index.js';

export default function HomePage() {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { isLoggedIn, user } = useAuth();
  const { data, error, loading, reload } = useCallitData(() => api.tournaments(), null, [isLoggedIn]);
  const tournaments = data ?? [];
  const active = tournaments.filter((entry) => !entry.isCompleted);
  const past = tournaments.filter((entry) => entry.isCompleted);

  const renderCard = (tournament) => (
    <a
      key={tournament.id}
      href={`#/t/${tournament.id}`}
      className={`card row${tournament.isCompleted ? '' : ' card--accent'}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="grow stack" style={{ gap: 4 }}>
        <strong style={{ fontSize: '1.1rem' }}>{tournament.name}</strong>
        <span className="muted small">
          {[tournament.plannedAt ? new Date(tournament.plannedAt).toLocaleDateString(locale, { dateStyle: 'medium' }) : null, tournament.location]
            .filter(Boolean)
            .join(' · ')}
        </span>
        <span className="row row--wrap" style={{ gap: 6 }}>
          <span className="pill">{t('home.participants', { count: tournament.participantCount })}</span>
          {tournament.joined ? <span className="pill pill--saved">{t('home.joined')}</span> : null}
          {tournament.isCompleted ? <span className="pill">{t('home.completed')}</span> : null}
        </span>
      </div>
      <IconChevron />
    </a>
  );

  return (
    <>
      <TopBar />
      <section className="hero">
        <img className="hero__logo" src="/favicon.svg" alt="" />
        <h1>CALLIT</h1>
        <p className="muted" style={{ margin: 0 }}>{t('home.claim')}</p>
      </section>

      {!isLoggedIn ? (
        <div className="card stack" style={{ marginTop: 12 }}>
          <span>{t('home.loginHint')}</span>
          <button type="button" className="btn btn--primary btn--block" onClick={() => navigate('/login')}>
            {t('home.cta')}
          </button>
        </div>
      ) : (
        <p className="muted small" style={{ textAlign: 'center' }}>{t('home.hello', { name: user?.nickname })}</p>
      )}

      <h2 className="section-title">{t('home.tournaments')}</h2>
      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? <Spinner /> : null}
      {!loading && tournaments.length === 0 ? <div className="card muted">{t('home.empty')}</div> : null}
      <div className="stack">{active.map(renderCard)}</div>
      {past.length > 0 ? (
        <>
          <h2 className="section-title">{t('home.past')}</h2>
          <div className="stack">{past.map(renderCard)}</div>
        </>
      ) : null}
      <MainSiteLink />
    </>
  );
}
