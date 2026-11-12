import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PanelCard from '../../common/PanelCard.jsx';
import { useDashboard } from '../../../context/DashboardContext.jsx';
import { closeFreeThrows, recordFreeThrow, setFreeThrowShooter, startFreeThrows, undoFreeThrow } from '../../../utils/api.js';
import { formatApiError } from '../../../utils/apiError.js';

const COUNT_OPTIONS = ['1', '2'];
const DEFAULT_COUNT = '2';

function ShooterSelect({ players, value, onChange, disabled }) {
  const { t } = useTranslation();
  return (
    <label style={{ display: 'grid', gap: '0.3rem' }}>
      {t('control.freeThrows.shooter')}
      <select value={value ?? ''} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        <option value="">{t('control.freeThrows.wholeTeam')}</option>
        {players.map((player) => (
          <option key={player.playerId ?? player.name} value={player.playerId ?? ''}>
            {player.displayName ?? player.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function ThrowDots({ series }) {
  return (
    <div style={{ display: 'flex', gap: '0.45rem' }}>
      {Array.from({ length: series.total }, (_, index) => {
        const attempt = series.attempts[index];
        const background = !attempt ? 'transparent' : attempt.hit ? '#4ade80' : '#f87171';
        return (
          <span
            key={index}
            style={{ width: '1.4rem', height: '1.4rem', borderRadius: '999px', border: '2px solid rgba(255,255,255,0.6)', background }}
          />
        );
      })}
    </div>
  );
}

export default function FreeThrowCard() {
  const { t } = useTranslation();
  const {
    scoreboard: { scoreboard },
    feedback: { updateMessage }
  } = useDashboard();
  const [form, setForm] = useState({ team: 'a', playerId: '', total: DEFAULT_COUNT });
  const [busy, setBusy] = useState(false);

  if (!scoreboard) return null;
  const series = scoreboard.freeThrows;
  const teamName = (team) => (team === 'b' ? scoreboard.teamBName : scoreboard.teamAName);
  const playersOf = (team) => scoreboard.players?.[team] ?? [];
  const run = async (action) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      updateMessage('error', formatApiError(error, t, 'control.freeThrows.failed'));
    } finally {
      setBusy(false);
    }
  };

  const startForm = (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'end' }}>
      <label style={{ display: 'grid', gap: '0.3rem' }}>
        {t('control.freeThrows.team')}
        <select value={form.team} onChange={(event) => setForm((prev) => ({ ...prev, team: event.target.value, playerId: '' }))}>
          <option value="a">{scoreboard.teamAName}</option>
          <option value="b">{scoreboard.teamBName}</option>
        </select>
      </label>
      <ShooterSelect
        players={playersOf(form.team)}
        value={form.playerId}
        onChange={(playerId) => setForm((prev) => ({ ...prev, playerId }))}
      />
      <label style={{ display: 'grid', gap: '0.3rem' }}>
        {t('control.freeThrows.count')}
        <select value={form.total} onChange={(event) => setForm((prev) => ({ ...prev, total: event.target.value }))}>
          {COUNT_OPTIONS.map((count) => (
            <option key={count} value={count}>
              {t(`control.freeThrows.countOption${count}`)}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={() => run(async () => {
          await startFreeThrows(form);
          setForm((prev) => ({ ...prev, playerId: '', total: DEFAULT_COUNT }));
        })}
      >
        {t('control.freeThrows.start')}
      </button>
    </div>
  );

  if (!series) {
    return (
      <PanelCard title={t('control.freeThrows.title')} description={t('control.freeThrows.description')}>
        {startForm}
      </PanelCard>
    );
  }

  const status = series.status ?? { taken: series.attempts.length, made: 0, done: false };
  const statusText = status.done
    ? t('control.freeThrows.done', { made: status.made, total: series.total })
    : t('control.freeThrows.next', { current: status.taken + 1, total: series.total });

  return (
    <PanelCard
      title={t('control.freeThrows.titleRunning', { team: teamName(series.team), made: status.made, total: series.total })}
      description={series.source === 'penalty' ? t('control.freeThrows.fromPenalty') : t('control.freeThrows.description')}
      tone="accent"
    >
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <ShooterSelect
          players={playersOf(series.team)}
          value={series.playerId ?? ''}
          disabled={busy || status.taken > 0}
          onChange={(playerId) => run(() => setFreeThrowShooter(playerId))}
        />
        <ThrowDots series={series} />
        <strong style={{ color: status.done ? '#4ade80' : '#ffe081' }}>{statusText}</strong>
      </div>
      {!status.done ? (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => recordFreeThrow(true))}
            style={{ flex: 1, background: 'rgba(74,222,128,0.2)', borderColor: 'rgba(74,222,128,0.5)' }}
          >
            {t('control.freeThrows.hit')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => recordFreeThrow(false))}
            style={{ flex: 1, background: 'rgba(248,113,113,0.2)', borderColor: 'rgba(248,113,113,0.5)' }}
          >
            {t('control.freeThrows.miss')}
          </button>
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button type="button" disabled={busy || status.taken === 0} onClick={() => run(() => undoFreeThrow())}>
          {t('control.freeThrows.undo')}
        </button>
        {status.done || status.taken === 0 ? (
          <button type="button" disabled={busy} onClick={() => run(() => closeFreeThrows())}>
            {status.done ? t('control.freeThrows.close') : t('control.freeThrows.cancel')}
          </button>
        ) : null}
      </div>
      {status.done ? startForm : null}
    </PanelCard>
  );
}
