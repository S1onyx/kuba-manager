import { POINT_OPTIONS } from '../../../constants/dashboard.js';
import PanelCard from '../../common/PanelCard.jsx';
import { useDashboard } from '../../../context/DashboardContext.jsx';

export default function ScoreControlCard() {
  const {
    scoreboard: {
      scoreboard,
      selectedScorer,
      manualScores,
      handleScore,
      handleManualScoreChange,
      handleManualScoreSubmit,
      handleResetScores
    },
    scoreboardState: { setSelectedScorer }
  } = useDashboard();

  return (
    <PanelCard
      title="Punktestand"
      description="Schnelle +/- Aktionen oder manuelle Korrektur des Spielstandes."
    >
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', textAlign: 'center' }}>
        {['a', 'b'].map((teamKey) => {
          const isA = teamKey === 'a';
          const teamName = isA ? scoreboard.teamAName : scoreboard.teamBName;
          const score = isA ? scoreboard.scoreA : scoreboard.scoreB;
          return (
            <div
              key={teamKey}
              style={{
                minWidth: '220px',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(8, 20, 35, 0.55)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'grid',
                gap: '0.85rem'
              }}
            >
              <header style={{ display: 'grid', gap: '0.2rem' }}>
                <span style={{ fontSize: '0.78rem', letterSpacing: '0.12em', opacity: 0.65 }}>
                  {teamKey === 'a' ? 'Team A' : 'Team B'}
                </span>
                <strong style={{ fontSize: '1.1rem' }}>
                  {teamName}: {score}
                </strong>
              </header>

              <label style={{ display: 'grid', gap: '0.3rem' }}>
                Wer hat getroffen?
                <select
                  value={selectedScorer[teamKey]}
                  onChange={(event) =>
                    setSelectedScorer((prev) => ({ ...prev, [teamKey]: event.target.value }))
                  }
                >
                  <option value="">Team gesamt</option>
                  {(scoreboard.players?.[teamKey] ?? []).map((player) => (
                    <option
                      key={player.id ?? player.playerId ?? player.name}
                      value={player.playerId ?? ''}
                    >
                      {player.displayName ?? player.name}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {POINT_OPTIONS.map((value) => (
                  <button
                    key={`${teamKey}-${value}`}
                    type="button"
                    onClick={() => handleScore(teamKey, value)}
                  >
                    +{value}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {POINT_OPTIONS.map((value) => (
                  <button
                    key={`${teamKey}-minus-${value}`}
                    type="button"
                    onClick={() => handleScore(teamKey, -value)}
                  >
                    -{value}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleManualScoreSubmit(teamKey);
                }}
                style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}
              >
                <input
                  type="number"
                  min="0"
                  value={manualScores[teamKey]}
                  onChange={(event) => handleManualScoreChange(teamKey, event.target.value)}
                  style={{ width: '5rem' }}
                />
                <button type="submit">Setzen</button>
              </form>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button type="button" onClick={handleResetScores}>
          Punktestand zurücksetzen
        </button>
      </div>
    </PanelCard>
  );
}
