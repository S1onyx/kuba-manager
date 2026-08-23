import { useTranslation } from 'react-i18next';

const sectionStyle = {
  display: 'grid',
  gap: '1.5rem'
};

const panelStyle = {
  borderRadius: '14px',
  padding: '1.4rem 1.7rem',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)'
};

const placementTableStyle = {
  width: '100%',
  borderCollapse: 'collapse'
};

const leadersGridStyle = {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))'
};

const responsiveStyles = `
  @media (max-width: 480px) {
    .final-table__col--optional {
      display: none;
    }
  }
`;

function LeaderCard({ title, player, formatter, teamFallback }) {
  if (!player) {
    return null;
  }
  return (
    <article style={panelStyle}>
      <p style={{ margin: 0, opacity: 0.7, letterSpacing: '0.08em', fontSize: '0.8rem' }}>{title}</p>
      <h3 style={{ margin: '0.4rem 0 0.2rem', fontSize: '1.3rem' }}>{player.name}</h3>
      <p style={{ margin: 0, opacity: 0.75 }}>{player.teamName || teamFallback}</p>
      <strong style={{ display: 'block', marginTop: '0.5rem', fontSize: '1.4rem' }}>
        {formatter(player)}
      </strong>
    </article>
  );
}

export default function TournamentFinalOverview({ summary }) {
  const { t } = useTranslation();

  const methodLabel = (entry) => {
    switch (entry?.decidedByCode) {
      case 'final':
        return t('final.methodFinal');
      case 'placement_match': {
        const nums = String(entry.decidedBy ?? '').match(/(\d+)\s*[/\-]\s*(\d+)/);
        const from = nums
          ? Number(nums[1])
          : entry.placement % 2 === 1
            ? entry.placement
            : entry.placement - 1;
        const to = nums ? Number(nums[2]) : from + 1;
        return t('final.methodPlacementMatch', { from, to });
      }
      case 'overall_standings':
        return t('final.methodOverallStandings');
      case 'participant':
        return t('final.methodParticipant');
      default:
        return entry?.decidedBy || '';
    }
  };

  if (!summary) {
    return (
      <section style={sectionStyle}>
        <p style={{ opacity: 0.75 }}>{t('final.empty')}</p>
      </section>
    );
  }

  const placements = summary.finalPlacements ?? [];
  const champion = placements[0];
  const runnerUp = placements[1];
  const leaders = summary.playerStats?.leaders ?? {};

  return (
    <section style={sectionStyle}>
      <style>{responsiveStyles}</style>
      <header>
        <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem, 4vw, 1.4rem)', letterSpacing: '0.05em' }}>{t('final.title')}</h2>
        <p style={{ margin: '0.35rem 0 0', opacity: 0.75 }}>{t('final.description')}</p>
      </header>

      {champion ? (
        <article style={{ ...panelStyle, textAlign: 'center' }}>
          <p style={{ margin: 0, letterSpacing: '0.2em', fontSize: '0.85rem', opacity: 0.7 }}>{t('final.champion')}</p>
          <h3 style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)', margin: '0.35rem 0' }}>{champion.teamName}</h3>
          <p style={{ margin: 0, opacity: 0.75 }}>
            {champion.decidedByCode || champion.decidedBy
              ? t('final.decidedBy', { method: methodLabel(champion) })
              : t('final.finalWin')}
            {champion.score ? ` · ${champion.score}` : ''}
          </p>
          {runnerUp ? (
            <p style={{ margin: '0.4rem 0 0', opacity: 0.7 }}>
              <strong>{t('final.runnerUp')}</strong> {runnerUp.teamName}
            </p>
          ) : null}
        </article>
      ) : null}

      {placements.length > 0 ? (
        <article style={panelStyle}>
          <h3 style={{ marginTop: 0, fontSize: '1.2rem' }}>{t('final.placements')}</h3>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={placementTableStyle}>
              <thead style={{ opacity: 0.7, fontSize: '0.85rem' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.4rem' }}>{t('final.colPlacement')}</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.4rem' }}>{t('final.colTeam')}</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.4rem' }}>{t('final.colDecision')}</th>
                  <th className="final-table__col--optional" style={{ textAlign: 'left', padding: '0.5rem 0.4rem' }}>{t('final.colOpponent')}</th>
                  <th className="final-table__col--optional" style={{ textAlign: 'left', padding: '0.5rem 0.4rem' }}>{t('final.colResult')}</th>
                </tr>
              </thead>
              <tbody>
                {placements.map((entry) => (
                  <tr key={`${entry.teamName}-${entry.placement}`} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <td style={{ padding: '0.5rem 0.4rem', fontWeight: 700 }}>#{entry.placement}</td>
                    <td style={{ padding: '0.5rem 0.4rem' }}>{entry.teamName}</td>
                    <td style={{ padding: '0.5rem 0.4rem', opacity: 0.75 }}>{methodLabel(entry) || t('final.overallRecord')}</td>
                    <td className="final-table__col--optional" style={{ padding: '0.5rem 0.4rem', opacity: 0.75 }}>{entry.opponent || '—'}</td>
                    <td className="final-table__col--optional" style={{ padding: '0.5rem 0.4rem', opacity: 0.75 }}>{entry.score || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}

      <section style={leadersGridStyle}>
        <LeaderCard
          title={t('final.topScorer')}
          player={leaders.topScorers?.[0]}
          formatter={(player) => t('final.pointsValue', { count: player.points ?? 0 })}
          teamFallback={t('playerStats.teamFallback')}
        />
        <LeaderCard
          title={t('final.threePointSpecialist')}
          player={leaders.topThreePointers?.[0]}
          formatter={(player) => t('final.threes', { count: player.breakdown?.['3'] ?? 0 })}
          teamFallback={t('playerStats.teamFallback')}
        />
        <LeaderCard
          title={t('final.penaltySeconds')}
          player={leaders.mostPenalized?.[0]}
          formatter={(player) => t('final.secondsValue', { count: player.penaltySeconds ?? 0 })}
          teamFallback={t('playerStats.teamFallback')}
        />
      </section>
    </section>
  );
}
