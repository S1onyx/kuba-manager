import PanelCard from '../common/PanelCard.jsx';

export default function ScoreboardSummary({
  scoreboard,
  formattedRemaining,
  liveStateLabel,
  onToggleDisplayView,
  displayViewPending = false
}) {
  if (!scoreboard) {
    return null;
  }

  const tournamentBadge = scoreboard.tournamentName
    ? `${scoreboard.tournamentName}${
        scoreboard.stageType && scoreboard.stageLabel
          ? scoreboard.stageType === 'group'
            ? ` · Gruppe ${scoreboard.stageLabel}`
            : ` · ${scoreboard.stageLabel}`
          : ''
      }`
    : 'Kein Turnier hinterlegt';

  return (
    <PanelCard
      tone="accent"
      title="Live-Spielstand"
      description="Aktuelle Teams, Score und Uhr im Überblick."
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'grid', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.72 }}>
            Teams
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '0.01em' }}>
            {scoreboard.teamAName} <span style={{ opacity: 0.7 }}>vs</span> {scoreboard.teamBName}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.6rem 1rem',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(5, 18, 35, 0.65)',
            fontWeight: 600,
            boxShadow: '0 16px 25px rgba(0,0,0,0.25)'
          }}
        >
          <span style={{ fontSize: '1.7rem' }}>
            {scoreboard.scoreA ?? 0} : {scoreboard.scoreB ?? 0}
          </span>
          <span style={{ opacity: 0.8, fontSize: '0.95rem' }}>
            {formattedRemaining} · {liveStateLabel}
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.25rem',
          fontSize: '0.9rem',
          opacity: 0.83,
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <span>{tournamentBadge}</span>
          {scoreboard.scheduleCode ? <span>Matchcode: {scoreboard.scheduleCode}</span> : null}
          <span>
            Anzeige: {scoreboard.displayView === 'bracket' ? 'Turnierbaum' : 'Live-Spielstand'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onToggleDisplayView?.(scoreboard.displayView === 'bracket' ? 'scoreboard' : 'bracket')}
          disabled={!onToggleDisplayView || displayViewPending}
          style={{
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.35)',
            background: 'transparent',
            color: '#fff',
            padding: '0.35rem 0.9rem',
            fontSize: '0.85rem',
            opacity: displayViewPending ? 0.6 : 1,
            cursor: displayViewPending || !onToggleDisplayView ? 'not-allowed' : 'pointer'
          }}
        >
          {displayViewPending
            ? 'Wechsle...'
            : scoreboard.displayView === 'bracket'
              ? 'Live anzeigen'
              : 'Turnierbaum anzeigen'}
        </button>
      </div>
    </PanelCard>
  );
}
