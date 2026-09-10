import { useTranslation } from 'react-i18next';
import { PENALTY_PRESETS } from '../../../constants/dashboard.js';
import PanelCard from '../../common/PanelCard.jsx';
import { useDashboard } from '../../../context/DashboardContext.jsx';
import { formatTime } from '../../../utils/formatters.js';

export default function PenaltyManagerCard() {
  const { t } = useTranslation();
  const {
    scoreboard: {
      scoreboard,
      penaltyForms,
      handlePenaltyFormChange,
      handlePenaltySubmit,
      handlePenaltyRemove
    }
  } = useDashboard();

  return (
    <PanelCard
      title={t('control.penalties.title')}
      description={t('control.penalties.description')}
    >
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {['a', 'b'].map((teamKey) => {
          const penalties = scoreboard?.penalties?.[teamKey] ?? [];
          const form = penaltyForms[teamKey];
          const teamName = teamKey === 'a' ? scoreboard.teamAName : scoreboard.teamBName;

          return (
            <article
              key={teamKey}
              style={{
                flex: '1 1 260px',
                minWidth: 'min(260px, 100%)',
                display: 'grid',
                gap: '0.9rem',
                padding: '1.1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(8, 20, 35, 0.55)'
              }}
            >
              <header>
                <h4 style={{ margin: 0, fontSize: '1rem' }}>{teamName}</h4>
              </header>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handlePenaltySubmit(teamKey);
                }}
                style={{ display: 'grid', gap: '0.65rem' }}
              >
                <label style={{ display: 'grid', gap: '0.3rem' }}>
                  {t('control.penalties.player')}
                  <select
                    value={form.playerId}
                    onChange={(event) => handlePenaltyFormChange(teamKey, 'playerId', event.target.value)}
                  >
                    <option value="">{t('control.penalties.wholeTeam')}</option>
                    {(scoreboard.players?.[teamKey] ?? []).map((player) => (
                      <option key={player.id ?? player.playerId ?? player.name} value={player.playerId ?? ''}>
                        {player.displayName ?? player.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'grid', gap: '0.3rem' }}>
                  {t('control.penalties.nameReason')}
                  <input
                    value={form.name}
                    onChange={(event) => handlePenaltyFormChange(teamKey, 'name', event.target.value)}
                    placeholder={t('control.penalties.namePlaceholder')}
                  />
                </label>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: '1 1 160px' }}>
                    {t('control.penalties.duration')}
                    <select
                      value={form.preset}
                      onChange={(event) => handlePenaltyFormChange(teamKey, 'preset', event.target.value)}
                    >
                      {PENALTY_PRESETS.map((preset) => (
                        <option key={preset.value} value={preset.value}>
                          {preset.labelKey
                            ? t(preset.labelKey)
                            : t('penaltyPresets.minutes', { count: preset.minutes })}
                        </option>
                      ))}
                    </select>
                  </label>
                  {form.preset === 'custom' ? (
                    <input
                      style={{ flex: '1 1 auto' }}
                      value={form.custom}
                      onChange={(event) => handlePenaltyFormChange(teamKey, 'custom', event.target.value)}
                      placeholder={t('control.penalties.customPlaceholder')}
                    />
                  ) : null}
                </div>
                <button type="submit">{t('control.penalties.add')}</button>
              </form>

              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.6rem' }}>
                {penalties.length === 0 ? (
                  <li style={{ color: 'var(--text-muted)' }}>{t('control.penalties.none')}</li>
                ) : (
                  penalties.map((penalty) => (
                    <li
                      key={penalty.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        padding: '0.5rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(12, 28, 48, 0.6)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        opacity: penalty.isExpired ? 0.6 : 1
                      }}
                    >
                      <div style={{ display: 'grid', gap: '0.2rem' }}>
                        <span style={{ fontWeight: 600 }}>
                          {penalty.playerName ? `${penalty.playerName} · ` : ''}
                          {penalty.name}
                        </span>
                        <span style={{ fontSize: '0.85rem', opacity: 0.75 }}>
                          {penalty.isExpired
                            ? t('control.penalties.expired')
                            : t('control.penalties.remaining', { time: formatTime(penalty.remainingSeconds) })}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => handlePenaltyRemove(penalty.id)}
                      >
                        {t('control.penalties.remove')}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </article>
          );
        })}
      </div>
    </PanelCard>
  );
}
