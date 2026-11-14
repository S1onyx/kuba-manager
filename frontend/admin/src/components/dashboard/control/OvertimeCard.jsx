import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PanelCard from '../../common/PanelCard.jsx';
import { useDashboard } from '../../../context/DashboardContext.jsx';
import { cancelOvertime, startOvertime } from '../../../utils/api.js';
import { formatApiError } from '../../../utils/apiError.js';
import { formatTime } from '../../../utils/formatters.js';
import { canStartOvertime, isOvertimeBreak } from '../../../utils/gameStatus.js';

const OVERTIME_PAUSE_SECONDS = 60;
const OVERTIME_SECONDS = 5 * 60;

export default function OvertimeCard() {
  const { t } = useTranslation();
  const {
    scoreboard: { scoreboard, handleStart },
    audio: { timerCueSettings },
    feedback: { updateMessage }
  } = useDashboard();
  const [busy, setBusy] = useState(false);

  if (!scoreboard) return null;
  const startable = canStartOvertime(scoreboard);
  const inBreak = isOvertimeBreak(scoreboard);
  if (!startable && !inBreak) return null;

  const run = async (action) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      updateMessage('error', formatApiError(error, t, 'control.overtime.failed'));
    } finally {
      setBusy(false);
    }
  };

  if (startable) {
    return (
      <PanelCard
        title={t('control.overtime.title')}
        description={t('control.overtime.drawHint', {
          duration: formatTime(OVERTIME_SECONDS),
          pause: formatTime(OVERTIME_PAUSE_SECONDS)
        })}
        tone="accent"
      >
        <div>
          <button type="button" disabled={busy} onClick={() => run(() => startOvertime())}>
            {t('control.overtime.start')}
          </button>
        </div>
      </PanelCard>
    );
  }

  const autoStart = Boolean(timerCueSettings?.halftimeAutoStart);
  return (
    <PanelCard
      title={t('control.overtime.breakTitle', { remaining: formatTime(scoreboard.halftimePauseRemaining ?? 0) })}
      description={t(autoStart ? 'control.overtime.breakAuto' : 'control.overtime.breakManual', {
        duration: formatTime(scoreboard.overtime.durationSeconds ?? 0)
      })}
      tone="accent"
    >
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button type="button" disabled={busy} onClick={() => run(() => handleStart())}>
          {t('control.overtime.startNow')}
        </button>
        <button type="button" disabled={busy} onClick={() => run(() => cancelOvertime())}>
          {t('control.overtime.cancel')}
        </button>
      </div>
    </PanelCard>
  );
}
