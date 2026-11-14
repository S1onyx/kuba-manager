import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PanelCard from '../../common/PanelCard.jsx';
import { useDashboard } from '../../../context/DashboardContext.jsx';
import { cancelShootout, recordShootoutAttempt, startShootout, undoShootoutAttempt } from '../../../utils/api.js';
import { formatApiError } from '../../../utils/apiError.js';
import { canStartShootout } from '../../../utils/gameStatus.js';

const REGULAR_ATTEMPTS = 5;

function AttemptDots({ attempts, team }) {
  const own = attempts.filter((attempt) => attempt.team === team);
  const slots = Math.max(REGULAR_ATTEMPTS, own.length);
  return (
    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
      {Array.from({ length: slots }, (_, index) => {
        const attempt = own[index];
        const background = !attempt ? 'transparent' : attempt.hit ? '#4ade80' : '#f87171';
        return (
          <span
            key={index}
            title={attempt?.playerName ?? ''}
            style={{ width: '1.1rem', height: '1.1rem', borderRadius: '999px', border: '2px solid rgba(255,255,255,0.6)', background }}
          />
        );
      })}
    </div>
  );
}

export default function ShootoutCard() {
  const { t } = useTranslation();
  const {
    scoreboard: { scoreboard },
    feedback: { updateMessage }
  } = useDashboard();
  const [firstTeam, setFirstTeam] = useState('a');
  const [shooter, setShooter] = useState({ a: '', b: '' });
  const [busy, setBusy] = useState(false);

  if (!scoreboard) return null;
  const shootout = scoreboard.shootout;
  if (!shootout && !canStartShootout(scoreboard)) return null;

  const teamName = (team) => (team === 'a' ? scoreboard.teamAName : scoreboard.teamBName);
  const run = async (action) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      updateMessage('error', formatApiError(error, t, 'control.shootout.failed'));
    } finally {
      setBusy(false);
    }
  };

  if (!shootout) {
    return (
      <PanelCard title={t('control.shootout.title')} description={t('control.shootout.drawHint')} tone="accent">
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'end' }}>
          <label style={{ display: 'grid', gap: '0.3rem' }}>
            {t('control.shootout.firstTeam')}
            <select value={firstTeam} onChange={(event) => setFirstTeam(event.target.value)}>
              <option value="a">{scoreboard.teamAName}</option>
              <option value="b">{scoreboard.teamBName}</option>
            </select>
          </label>
          <button type="button" disabled={busy} onClick={() => run(() => startShootout(firstTeam))}>
            {t('control.shootout.start')}
          </button>
        </div>
      </PanelCard>
    );
  }

  const status = shootout.status ?? { hits: { a: 0, b: 0 }, decided: false, nextTeam: 'a', suddenDeath: false };
  const attempts = shootout.attempts ?? [];
  const statusText = status.decided
    ? t('control.shootout.decided', { team: teamName(status.winner), a: status.hits.a, b: status.hits.b })
    : status.suddenDeath
      ? t('control.shootout.suddenDeath', { team: teamName(status.nextTeam) })
      : t('control.shootout.next', { team: teamName(status.nextTeam) });

  return (
    <PanelCard
      title={t('control.shootout.titleRunning', { a: status.hits.a, b: status.hits.b })}
      description={t('control.shootout.regularScore', { a: shootout.regularScoreA, b: shootout.regularScoreB })}
      tone="accent"
    >
      <p style={{ margin: 0, fontWeight: 600, color: status.decided ? '#4ade80' : '#ffe081' }}>{statusText}</p>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))' }}>
        {['a', 'b'].map((team) => {
          const isNext = !status.decided && status.nextTeam === team;
          return (
            <div
              key={team}
              style={{
                display: 'grid',
                gap: '0.6rem',
                padding: '0.9rem',
                borderRadius: 'var(--radius-md)',
                border: isNext ? '1px solid #ffe081' : '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(8, 20, 35, 0.55)'
              }}
            >
              <strong>{teamName(team)} · {status.hits[team]}</strong>
              <AttemptDots attempts={attempts} team={team} />
              <select
                value={shooter[team]}
                onChange={(event) => setShooter((prev) => ({ ...prev, [team]: event.target.value }))}
                disabled={status.decided}
              >
                <option value="">{t('control.shootout.noPlayer')}</option>
                {(scoreboard.players?.[team] ?? []).map((player) => (
                  <option key={player.playerId ?? player.name} value={player.playerId ?? ''}>
                    {player.jerseyNumber ? `#${player.jerseyNumber} ` : ''}{player.displayName ?? player.name}
                  </option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  disabled={busy || status.decided}
                  onClick={() => run(() => recordShootoutAttempt({ team, playerId: shooter[team], hit: true }))}
                  style={{ flex: 1, background: 'rgba(74,222,128,0.2)', borderColor: 'rgba(74,222,128,0.5)' }}
                >
                  {t('control.shootout.hit')}
                </button>
                <button
                  type="button"
                  disabled={busy || status.decided}
                  onClick={() => run(() => recordShootoutAttempt({ team, playerId: shooter[team], hit: false }))}
                  style={{ flex: 1, background: 'rgba(248,113,113,0.2)', borderColor: 'rgba(248,113,113,0.5)' }}
                >
                  {t('control.shootout.miss')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button type="button" disabled={busy || attempts.length === 0} onClick={() => run(() => undoShootoutAttempt())}>
          {t('control.shootout.undo')}
        </button>
        {attempts.length === 0 ? (
          <button type="button" disabled={busy} onClick={() => run(() => cancelShootout())}>
            {t('control.shootout.cancel')}
          </button>
        ) : null}
      </div>
    </PanelCard>
  );
}
