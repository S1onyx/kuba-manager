import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api.js';
import { useDateLocale } from '../i18n/index.js';
import { errorMessage } from '../utils/errors.js';
import { clockToMinutes, formatPoints, formatVenueClock, minutesToClock } from '../utils/format.js';
import { IconLock } from './Icons.jsx';

export function betTitle(t, bet) {
  return bet.type === 'group_winner' ? t('specials.types.group_winner', { group: bet.groupLabel ?? '' }) : t(`specials.types.${bet.type}`);
}

export default function SpecialBetCard({ tournamentId, bet, canTip, onSaved }) {
  const { t, i18n } = useTranslation();
  const locale = useDateLocale();
  const isTime = bet.type === 'final_kickoff';
  const initial =
    bet.type === 'total_baskets' ? (bet.myValue?.value ?? '') : isTime ? minutesToClock(bet.myValue?.value) : (bet.myValue?.key ?? '');
  const [value, setValue] = useState(String(initial));
  const [state, setState] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (state !== 'saving') setValue(String(initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const editable = canTip && !bet.locked;

  const save = async (next) => {
    const payload = bet.type === 'total_baskets' ? { value: Number(next) } : isTime ? { value: clockToMinutes(next) } : { key: next };
    if (bet.type === 'total_baskets' && (!/^\d+$/.test(String(next)) || Number(next) > 100000)) return;
    if (isTime && payload.value === null) return;
    if (bet.type !== 'total_baskets' && !next) return;
    setState('saving');
    try {
      await api.saveSpecial(tournamentId, bet.betKey, payload);
      setError(null);
      setState('saved');
      onSaved?.();
    } catch (err) {
      setError(err);
      setState('error');
    }
  };

  return (
    <article className="card stack" style={{ gap: 10 }}>
      <div className="row row--between">
        <strong>{betTitle(t, bet)}</strong>
        <span className="pill pill--gold">{t('specials.points', { points: formatPoints(bet.points, i18n.language) })}</span>
      </div>
      <span className="muted small">{t(`specials.hints.${bet.type}`)}</span>
      {isTime && formatVenueClock(bet.scheduledAt) ? (
        <span className="muted small">{t('specials.plannedAt', { time: formatVenueClock(bet.scheduledAt) })}</span>
      ) : null}

      {editable ? (
        isTime ? (
          <div className="row">
            <input
              className="input grow"
              type="time"
              step={60}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onBlur={() => value !== String(initial) && save(value)}
              aria-label={betTitle(t, bet)}
            />
            <button type="button" className="btn" onClick={() => save(value)} disabled={!value || value === String(initial)}>
              {t('common.save')}
            </button>
          </div>
        ) : bet.type === 'total_baskets' ? (
          <div className="row">
            <input
              className="input grow"
              inputMode="numeric"
              pattern="[0-9]*"
              value={value}
              placeholder={t('specials.totalPlaceholder')}
              onChange={(event) => setValue(event.target.value.replace(/\D/g, '').slice(0, 6))}
              onBlur={() => value !== String(initial) && save(value)}
              aria-label={betTitle(t, bet)}
            />
            <button type="button" className="btn" onClick={() => save(value)} disabled={!value || value === String(initial)}>
              {t('common.save')}
            </button>
          </div>
        ) : (
          <select
            className="input"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              save(event.target.value);
            }}
            aria-label={betTitle(t, bet)}
          >
            <option value="">{t('specials.choose')}</option>
            {bet.options.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
                {option.sub ? ` (${option.sub})` : ''}
              </option>
            ))}
          </select>
        )
      ) : (
        <div className="row row--between row--wrap small">
          <span>
            <span className="muted">{t('tips.yourTip')}: </span>
            <strong>{bet.myLabel ?? t('tips.noTip')}</strong>
          </span>
          {bet.myPoints ? (
            <span className={`pill ${bet.myPoints.points > 0 ? 'pill--gold' : ''}`}>
              +{formatPoints(bet.myPoints.points, i18n.language)}
              {bet.myPoints.final ? '' : ` · ${t('specials.provisional')}`}
            </span>
          ) : null}
        </div>
      )}

      {bet.outcome ? (
        <span className="small">
          <span className="muted">{bet.outcome.final ? t('specials.result') : t('specials.currently')}: </span>
          {bet.outcome.labels.join(', ')}
        </span>
      ) : null}

      <span className="dim small row" style={{ gap: 4 }}>
        {bet.locked ? (
          <>
            <IconLock /> {t('specials.closed')}
          </>
        ) : bet.deadline ? (
          t('specials.deadline', { time: new Date(bet.deadline).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' }) })
        ) : (
          t('specials.untilKickoff')
        )}
        {state === 'saving' ? ` · ${t('tips.saving')}` : state === 'saved' ? ` · ${t('tips.saved')}` : ''}
      </span>
      {error ? <div className="banner banner--error small">{errorMessage(t, error)}</div> : null}
    </article>
  );
}
