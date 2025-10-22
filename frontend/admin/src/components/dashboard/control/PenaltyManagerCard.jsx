import { PENALTY_PRESETS } from '../../../constants/dashboard.js';
import PanelCard from '../../common/PanelCard.jsx';
import { useDashboard } from '../../../context/DashboardContext.jsx';
import { formatTime } from '../../../utils/formatters.js';

export default function PenaltyManagerCard() {
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
      title="Zeitstrafen"
      description="Verwalte Strafen je Team. Optional Spieler zuordnen und Laufzeiten im Blick behalten."
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
                minWidth: '260px',
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
                  Spieler
                  <select
                    value={form.playerId}
                    onChange={(event) => handlePenaltyFormChange(teamKey, 'playerId', event.target.value)}
                  >
                    <option value="">Team gesamt</option>
                    {(scoreboard.players?.[teamKey] ?? []).map((player) => (
                      <option key={player.id ?? player.playerId ?? player.name} value={player.playerId ?? ''}>
                        {player.displayName ?? player.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'grid', gap: '0.3rem' }}>
                  Name / Grund
                  <input
                    value={form.name}
                    onChange={(event) => handlePenaltyFormChange(teamKey, 'name', event.target.value)}
                    placeholder="z.B. Foul Jonas"
                  />
                </label>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: '0 0 160px' }}>
                    Dauer
                    <select
                      value={form.preset}
                      onChange={(event) => handlePenaltyFormChange(teamKey, 'preset', event.target.value)}
                    >
                      {PENALTY_PRESETS.map((preset) => (
                        <option key={preset.value} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {form.preset === 'custom' ? (
                    <input
                      style={{ flex: '1 1 auto' }}
                      value={form.custom}
                      onChange={(event) => handlePenaltyFormChange(teamKey, 'custom', event.target.value)}
                      placeholder="MM:SS oder Sekunden"
                    />
                  ) : null}
                </div>
                <button type="submit">Zeitstrafe hinzufügen</button>
              </form>

              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.6rem' }}>
                {penalties.length === 0 ? (
                  <li style={{ color: 'var(--text-muted)' }}>Keine aktiven Zeitstrafen</li>
                ) : (
                  penalties.map((penalty) => (
                    <li
                      key={penalty.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
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
                          {penalty.isExpired ? 'abgelaufen' : `${formatTime(penalty.remainingSeconds)} verbleibend`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePenaltyRemove(penalty.id)}
                        style={{ background: 'rgba(211,47,47,0.85)', color: '#fff' }}
                      >
                        Entfernen
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
