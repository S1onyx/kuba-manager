import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { Sparkline } from '../components/Charts.jsx';
import { ErrorBox, Spinner } from '../components/Feedback.jsx';
import { PointsPill } from '../components/MatchCard.jsx';
import { betTitle } from '../components/SpecialBetCard.jsx';
import { IconBack } from '../components/Icons.jsx';
import useCallitData from '../hooks/useCallitData.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { navigate } from '../hooks/useHashRoute.js';
import { errorMessage } from '../utils/errors.js';
import { formatPoints } from '../utils/format.js';

function AccountSettings() {
  const { t } = useTranslation();
  const { logout, clear } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [message, setMessage] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const changePassword = async (event) => {
    event.preventDefault();
    try {
      await api.changePassword(current, next);
      setCurrent('');
      setNext('');
      setMessage({ ok: true, text: t('me.passwordChanged') });
    } catch (err) {
      setMessage({ ok: false, text: errorMessage(t, err) });
    }
  };

  const deleteAccount = async () => {
    try {
      await api.deleteAccount();
      clear();
      navigate('/');
    } catch (err) {
      setMessage({ ok: false, text: errorMessage(t, err) });
    }
  };

  return (
    <>
      <h2 className="section-title">{t('me.account')}</h2>
      <form className="card stack" onSubmit={changePassword}>
        <strong>{t('me.changePassword')}</strong>
        <input className="input" type="password" autoComplete="current-password" placeholder={t('me.currentPassword')} value={current} onChange={(e) => setCurrent(e.target.value)} required />
        <input className="input" type="password" autoComplete="new-password" minLength={8} placeholder={t('me.newPassword')} value={next} onChange={(e) => setNext(e.target.value)} required />
        <button type="submit" className="btn">{t('common.save')}</button>
        {message ? <div className={`banner small ${message.ok ? 'banner--ok' : 'banner--error'}`}>{message.text}</div> : null}
      </form>
      <div className="stack" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn--block" onClick={async () => { await logout(); navigate('/'); }}>
          {t('auth.logout')}
        </button>
        {confirmDelete ? (
          <div className="card stack">
            <span className="small">{t('me.deleteConfirm')}</span>
            <div className="row">
              <button type="button" className="btn btn--danger grow" onClick={deleteAccount}>{t('me.deleteYes')}</button>
              <button type="button" className="btn grow" onClick={() => setConfirmDelete(false)}>{t('common.cancel')}</button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn--ghost btn--block small" onClick={() => setConfirmDelete(true)}>
            {t('me.delete')}
          </button>
        )}
      </div>
    </>
  );
}

export default function ProfilePage({ id, userId, self = false, joined = true }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data, error, loading, reload } = useCallitData(() => (userId && joined ? api.profile(id, userId) : Promise.resolve(null)), id, [userId, joined]);
  const row = data?.row;

  return (
    <div className="stack">
      {!self ? (
        <a href={`#/t/${id}/ranking`} className="row small" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
          <IconBack /> {t('ranking.title')}
        </a>
      ) : null}
      {loading && !data && joined ? <Spinner /> : null}
      <ErrorBox error={error} onRetry={reload} />
      {data ? (
        <>
          <h1 className="page-title" style={{ marginBottom: 0 }}>{data.user.nickname}</h1>
          {row ? (
            <div className="kpis">
              <div className="kpi">
                <div className="kpi__value">{row.rank}.</div>
                <div className="kpi__label">{t('me.rankOf', { count: data.participantCount })}</div>
              </div>
              <div className="kpi">
                <div className="kpi__value">{formatPoints(row.total, lang)}</div>
                <div className="kpi__label">{t('ranking.unit.points')}</div>
              </div>
              <div className="kpi">
                <div className="kpi__value">{row.exact}</div>
                <div className="kpi__label">{t('levels.exact')}</div>
              </div>
            </div>
          ) : null}
          {row ? (
            <span className="muted small">
              {t('ranking.rowDetail', { exact: row.exact, diff: row.diff, tendency: row.tendency })}
              {' · '}
              {t('me.split', { matches: formatPoints(row.matchPoints, lang), specials: formatPoints(row.specialPoints, lang) })}
            </span>
          ) : null}

          {data.timeline.length > 1 ? (
            <div className="card stack" style={{ gap: 6 }}>
              <strong>{t('me.timeline')}</strong>
              <Sparkline points={data.timeline.map((entry) => entry.cumulative)} />
            </div>
          ) : null}

          {data.specials.length ? (
            <>
              <h2 className="section-title">{t('specials.title')}</h2>
              <div className="card stack" style={{ gap: 8 }}>
                {data.specials.map((bet) => (
                  <div key={bet.betKey} className="row row--between small">
                    <span className="ellipsis grow">
                      <span className="muted">{betTitle(t, bet)}: </span>
                      {bet.myLabel ?? '–'}
                    </span>
                    {bet.myPoints ? <span className={`pill ${bet.myPoints.points > 0 ? 'pill--gold' : ''}`}>+{formatPoints(bet.myPoints.points, lang)}</span> : null}
                  </div>
                ))}
              </div>
            </>
          ) : null}

          <h2 className="section-title">{t('me.tips')}</h2>
          {data.tips.length === 0 ? <div className="card muted small">{self ? t('me.noTipsSelf') : t('me.noTipsOther')}</div> : null}
          <div className="stack" style={{ gap: 6 }}>
            {data.tips
              .slice()
              .reverse()
              .map((tip) => (
                <div key={tip.code} className="card row row--between" style={{ padding: '10px 12px' }}>
                  <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                    <span className="small ellipsis">{tip.label}</span>
                    <span className="dim small">
                      {t('tips.yourTip')}: <strong style={{ color: 'var(--text)' }}>{tip.scoreHome}:{tip.scoreAway}</strong>
                      {tip.result ? ` · ${t('me.result')}: ${tip.result.home}:${tip.result.away}` : ''}
                      {tip.isJoker ? ` · ${t('tips.joker')}` : ''}
                    </span>
                  </span>
                  {tip.points ? <PointsPill points={tip.points} /> : tip.result?.live ? <span className="pill pill--live">{t('status.live')}</span> : null}
                </div>
              ))}
          </div>
        </>
      ) : null}
      {self ? <AccountSettings /> : null}
    </div>
  );
}
