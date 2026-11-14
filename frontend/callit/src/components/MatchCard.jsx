import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { useDateLocale } from '../i18n/index.js';
import { canSaveTip, formatCountdown, formatPoints, isKoDraw, liveTipGap, stepDraft, teamName } from '../utils/format.js';
import { formatStageLabelI18n } from '../utils/stageLabels.js';
import { errorMessage } from '../utils/errors.js';
import { IconChevron, IconLock } from './Icons.jsx';

const emptyDraft = { scoreHome: null, scoreAway: null, advance: null, isJoker: false };
const fromTip = (tip) => (tip ? { scoreHome: tip.scoreHome, scoreAway: tip.scoreAway, advance: tip.advance, isJoker: tip.isJoker } : emptyDraft);
const sameDraft = (a, b) => a.scoreHome === b.scoreHome && a.scoreAway === b.scoreAway && a.advance === b.advance && a.isJoker === b.isJoker;

function Stepper({ value, onStep, label }) {
  const { t } = useTranslation();
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onStep(-1)} aria-label={t('tips.minus', { team: label })}>
        −
      </button>
      <span className={`stepper__value${value === null || value === undefined ? ' dim' : ''}`} aria-live="polite">
        {value === null || value === undefined ? '?' : value}
      </span>
      <button type="button" onClick={() => onStep(1)} aria-label={t('tips.plus', { team: label })}>
        +
      </button>
    </div>
  );
}

export function KickoffInfo({ match, now }) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  if (!match.scheduledAt) return <span>{t('tips.noTime')}</span>;
  const time = Date.parse(match.scheduledAt);
  const diff = time - now;
  const label = new Date(time).toLocaleString(locale, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  if (match.status === 'open' && diff > 0 && diff < 24 * 3600 * 1000) {
    return (
      <span>
        {label} · <strong style={{ color: '#fed7aa' }}>{t('tips.inCountdown', { time: formatCountdown(diff, t) })}</strong>
      </span>
    );
  }
  return <span>{label}</span>;
}

export function PointsPill({ points, live = false }) {
  const { t, i18n } = useTranslation();
  if (!points) return null;
  const tone = points.level === 'exact' ? 'pill--gold' : points.level === 'miss' ? '' : 'pill--saved';
  return (
    <span className={`pill ${tone}`}>
      +{formatPoints(points.total, i18n.language)} · {t(`levels.${points.level}`)}
      {points.joker > 1 ? ` · ${t('tips.jokerShort')}` : ''}
      {points.underdog > 0 ? ` · ${t('tips.underdogShort')}` : ''}
      {live ? ` · ${t('tips.liveNow')}` : ''}
    </span>
  );
}

function StatusPill({ match, saveState }) {
  const { t } = useTranslation();
  if (match.status === 'live') return <span className="pill pill--live">{t('status.live')}</span>;
  if (match.status === 'finished') return <span className="pill">{t('status.finished')}</span>;
  if (match.status === 'locked') return <span className="pill"><IconLock /> {t('status.locked')}</span>;
  if (match.status === 'pending') return <span className="pill">{t('status.pending')}</span>;
  if (saveState === 'saving') return <span className="pill pill--open">{t('tips.saving')}</span>;
  if (saveState === 'needsInput') return <span className="pill pill--todo">{t('tips.advanceNeeded')}</span>;
  if (saveState === 'error') return <span className="pill" style={{ background: 'var(--red-soft)', color: '#fecaca' }}>{t('tips.saveError')}</span>;
  if (match.myTip || saveState === 'saved') return <span className="pill pill--saved">{t('tips.saved')}</span>;
  return <span className="pill pill--todo">{t('tips.todo')}</span>;
}

export default function MatchCard({ tournamentId, match, now, jokers, canTip, onSaved }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(() => fromTip(match.myTip));
  const [saveState, setSaveState] = useState('idle');
  const [error, setError] = useState(null);
  const dirtyRef = useRef(false);
  const timerRef = useRef(null);
  const draftRef = useRef(draft);
  const editRef = useRef(0);
  const chainRef = useRef(Promise.resolve());
  const contextRef = useRef({ tournamentId, match, onSaved });
  contextRef.current = { tournamentId, match, onSaved };

  useEffect(() => {
    if (!dirtyRef.current) {
      const next = fromTip(match.myTip);
      draftRef.current = next;
      setDraft(next);
    }
  }, [match.myTip]);

  // Speichert immer den neuesten Entwurf; Aufrufe laufen nacheinander, damit kein alter Stand gewinnt.
  const flush = useCallback(() => {
    chainRef.current = chainRef.current.then(async () => {
      const { tournamentId: tid, match: current, onSaved: done } = contextRef.current;
      const edit = editRef.current;
      const next = draftRef.current;
      if (!dirtyRef.current || !canSaveTip(current, next)) return;
      try {
        await api.saveTip(tid, current.code, next);
        if (edit !== editRef.current) return;
        dirtyRef.current = false;
        setError(null);
        setSaveState('saved');
        done?.();
      } catch (err) {
        if (edit !== editRef.current) return;
        setError(err);
        setSaveState('error');
        if (err.code === 'CALLIT_MATCH_LOCKED') {
          dirtyRef.current = false;
          done?.();
        }
      }
    });
    return chainRef.current;
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
        flush();
      }
    },
    [flush]
  );

  const editable = match.status === 'open' && canTip;
  const home = teamName(match, 'home');
  const away = teamName(match, 'away');
  const phaseKey = match.phase === 'group' ? 'group' : 'ko';
  const jokerAvailable = jokers?.enabled && (jokers?.[phaseKey]?.total ?? 0) > 0;

  const update = (next) => {
    if (sameDraft(next, draftRef.current)) return;
    dirtyRef.current = true;
    editRef.current += 1;
    draftRef.current = next;
    setDraft(next);
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
    if (!canSaveTip(match, next)) {
      setSaveState('needsInput');
      return;
    }
    setSaveState('saving');
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      flush();
    }, 500);
  };

  const showAdvance = editable && isKoDraw(match, draft);
  const mine = match.myTip;
  const isLive = match.status === 'live';
  const gap = isLive ? liveTipGap(mine, match.result) : null;
  const stage = formatStageLabelI18n(t, match.stageLabelI18n, match.stageLabel);

  return (
    <article className={`card match${match.status === 'live' ? ' card--live' : ''}`}>
      <div className="match__head">
        <span className="grow ellipsis">
          {stage ? `${stage} · ` : ''}
          <KickoffInfo match={match} now={now} />
          {match.isFinal ? ` · ${t('tips.finalBadge')}` : ''}
        </span>
        <StatusPill match={match} saveState={saveState} />
      </div>

      {match.myTipStale ? <div className="banner small">{t('tips.stale')}</div> : null}

      <div className="match__body">
        <div className="team">
          <span className="team__name">{home}</span>
          {editable ? <Stepper value={draft.scoreHome} label={home} onStep={(delta) => update(stepDraft(draft, 'home', delta))} /> : null}
        </div>
        <div className="vs">
          {editable ? ':' : match.result ? (
            <span className="score-big">
              {match.result.home}:{match.result.away}
            </span>
          ) : (
            t('tips.vs')
          )}
        </div>
        <div className="team">
          <span className="team__name">{away}</span>
          {editable ? <Stepper value={draft.scoreAway} label={away} onStep={(delta) => update(stepDraft(draft, 'away', delta))} /> : null}
        </div>
      </div>

      {showAdvance ? (
        <div className="field">
          <label>{t('tips.whoAdvances')}</label>
          <div className="segmented">
            {['home', 'away'].map((sideKey) => (
              <button
                key={sideKey}
                type="button"
                aria-pressed={draft.advance === sideKey}
                onClick={() => update({ ...draft, advance: sideKey })}
              >
                {sideKey === 'home' ? home : away}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {editable ? (
        <div className="row row--between row--wrap">
          {jokerAvailable ? (
            <button
              type="button"
              className="joker"
              aria-pressed={draft.isJoker}
              onClick={() => {
                const base = draft.scoreHome === null ? { ...draft, scoreHome: 0, scoreAway: 0 } : draft;
                update({ ...base, isJoker: !draft.isJoker });
              }}
            >
              {draft.isJoker ? t('tips.jokerOn') : t('tips.jokerOff')}
            </button>
          ) : (
            <span />
          )}
          <span className="dim small">{t('tips.tipCount', { count: match.tipCount })}</span>
        </div>
      ) : (
        <div className="row row--between row--wrap">
          <span className="small">
            {match.status === 'pending' ? (
              <span className="muted">{t('tips.pendingHint')}</span>
            ) : mine ? (
              <>
                <span className="muted">{t('tips.yourTip')}: </span>
                <strong>
                  {mine.scoreHome}:{mine.scoreAway}
                </strong>
                {mine.advance ? <span className="muted"> · {t('tips.advanceShort', { team: mine.advance === 'home' ? home : away })}</span> : null}
                {mine.isJoker ? <span className="pill pill--gold" style={{ marginLeft: 6 }}>{t('tips.joker')}</span> : null}
              </>
            ) : (
              <span className="muted">{match.status === 'open' ? t('tips.loginToTip') : t('tips.noTip')}</span>
            )}
          </span>
          {match.myPoints ? <PointsPill points={match.myPoints} live={isLive} /> : null}
        </div>
      )}

      {gap ? (
        <span className="small">
          {gap.exact ? <strong style={{ color: 'var(--gold)' }}>{t('tips.liveExact')}</strong> : (
            <>
              <span className="muted">{t('tips.liveGap')}: </span>
              <strong>
                {home} {gap.home} · {away} {gap.away}
              </strong>
            </>
          )}
        </span>
      ) : null}

      {error ? <div className="banner banner--error small">{errorMessage(t, error)}</div> : null}

      {match.locked && match.status !== 'pending' ? (
        <a className="link-row small" href={`#/t/${tournamentId}/stats/${encodeURIComponent(match.code)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <span>
            {t('tips.showStats', { count: match.tipCount })}
            {match.result?.live ? ` · ${t('status.live')}` : ''}
          </span>
          <IconChevron />
        </a>
      ) : null}
      {match.result?.shootout && match.status === 'finished' ? (
        <span className="dim small">{t('tips.shootoutNote')}</span>
      ) : null}
    </article>
  );
}
