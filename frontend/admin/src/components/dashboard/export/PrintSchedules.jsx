import { formatStageLabelI18n } from '../../../utils/stageLabels.js';

function collectMatches(schedule) {
  const groupMatches = (schedule?.group ?? []).flatMap((stage) =>
    (stage.rounds ?? []).flatMap((round) => (round.matches ?? []).map((match) => ({ ...match, round: round.round })))
  );
  return [...groupMatches, ...(schedule?.knockout ?? []).flatMap((stage) => stage.matches ?? []), ...(schedule?.placement ?? []).flatMap((stage) => stage.matches ?? [])];
}

function timestampOf(match) {
  const value = match?.scheduled_at ? Date.parse(match.scheduled_at) : NaN;
  return Number.isFinite(value) ? value : null;
}

function compareMatches(a, b) {
  const ta = timestampOf(a);
  const tb = timestampOf(b);
  if (ta !== null && tb !== null && ta !== tb) return ta - tb;
  if (ta !== null && tb === null) return -1;
  if (ta === null && tb !== null) return 1;
  return (a.stage_order ?? 0) - (b.stage_order ?? 0) || (a.match_order ?? 0) - (b.match_order ?? 0);
}

function sideLabel(match, side, t) {
  const source = side === 'home' ? match.home_source : match.away_source;
  const detail = match[side];
  if (source?.type === 'groupPosition' && !detail?.teamName) {
    return `${source.position}. ${t('export.groupLabel', { group: source.group })}`;
  }
  return (side === 'home' ? match.home_label : match.away_label) || detail?.placeholder || '';
}

function createTimeFormatter(matches, dateLocale) {
  const days = new Set(matches.map((match) => timestampOf(match)).filter((ts) => ts !== null).map((ts) => new Date(ts).toDateString()));
  const options = days.size > 1
    ? { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }
    : { hour: '2-digit', minute: '2-digit' };
  return (match) => {
    const ts = timestampOf(match);
    return ts === null ? '–' : new Date(ts).toLocaleString(dateLocale, options);
  };
}

function ScoreBoxes({ match }) {
  const hasResult = Boolean(match.result?.hasResult);
  return (
    <span className="sheet-score">
      <span className="sheet-score__box">{hasResult ? match.result.scoreA ?? 0 : ''}</span>
      <span className="sheet-score__sep">:</span>
      <span className="sheet-score__box">{hasResult ? match.result.scoreB ?? 0 : ''}</span>
    </span>
  );
}

function CompactColumns() {
  return (
    <colgroup>
      <col className="sheet-col-time" />
      <col />
      <col className="sheet-col-result" />
      <col />
    </colgroup>
  );
}

function MatchRow({ match, number, time, stage, t }) {
  return (
    <tr>
      {number !== undefined ? <td className="sheet-num">{number}</td> : null}
      <td className="sheet-time">{time}</td>
      {stage !== undefined ? <td className="sheet-stage">{stage}</td> : null}
      <td className="sheet-team sheet-team--home">{sideLabel(match, 'home', t)}</td>
      <td className="sheet-result"><ScoreBoxes match={match} /></td>
      <td className="sheet-team">{sideLabel(match, 'away', t)}</td>
    </tr>
  );
}

export function PrintTimeline({ summary, t, dateLocale }) {
  const matches = collectMatches(summary?.schedule).sort(compareMatches);
  if (matches.length === 0) {
    return <p>{t('export.noData')}</p>;
  }
  const formatTime = createTimeFormatter(matches, dateLocale);
  const firstKnockoutIndex = matches.findIndex((match) => match.phase !== 'group');

  return (
    <section className="sheet">
      <h2 className="sheet-title">{t('export.timelineTitle')}</h2>
      <table className="sheet-table">
        <thead>
          <tr>
            <th className="sheet-num">#</th>
            <th className="sheet-time">{t('export.colTime')}</th>
            <th className="sheet-stage">{t('export.colStage')}</th>
            <th className="sheet-team sheet-team--home">{t('export.colHome')}</th>
            <th className="sheet-result">{t('export.colScore')}</th>
            <th className="sheet-team">{t('export.colAway')}</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match, index) => [
            index === firstKnockoutIndex && index > 0 ? (
              <tr key={`divider-${match.id}`} className="sheet-divider">
                <td colSpan={6}>{t('export.phaseKnockout')}</td>
              </tr>
            ) : null,
            <MatchRow
              key={match.id ?? match.code}
              match={match}
              number={index + 1}
              time={formatTime(match)}
              stage={formatStageLabelI18n(match.stage_label_i18n, t, match.stage_label)}
              t={t}
            />
          ])}
        </tbody>
      </table>
    </section>
  );
}

function teamsOfGroup(stage, standings) {
  const fromStandings = (standings?.standings ?? []).map((entry) => entry.team);
  if (fromStandings.length > 0) return fromStandings;
  const names = new Set();
  (stage.rounds ?? []).forEach((round) => (round.matches ?? []).forEach((match) => {
    names.add(match.home_label);
    names.add(match.away_label);
  }));
  return [...names].filter(Boolean);
}

export function PrintPhases({ summary, t, dateLocale }) {
  const schedule = summary?.schedule;
  const allMatches = collectMatches(schedule);
  if (allMatches.length === 0) {
    return <p>{t('export.noData')}</p>;
  }
  const formatTime = createTimeFormatter(allMatches, dateLocale);
  const standingsByGroup = new Map((summary?.groupStandings ?? []).map((group) => [group.canonicalLabel, group]));
  const groups = [...(schedule.group ?? [])].sort((a, b) => a.stage_label.localeCompare(b.stage_label, 'de', { numeric: true }));
  const firstMatch = (stage) => [...(stage.matches ?? [])].sort(compareMatches)[0] ?? {};
  const koStages = [...(schedule.knockout ?? []), ...(schedule.placement ?? [])].sort((a, b) => compareMatches(firstMatch(a), firstMatch(b)));

  return (
    <section className="sheet">
      <h2 className="sheet-title">{t('export.phasesTitle')}</h2>
      {groups.length > 0 ? (
        <div className="sheet-groups">
          {groups.map((stage) => {
            const label = formatStageLabelI18n(stage.stage_label_i18n, t, stage.stage_label);
            const standings = standingsByGroup.get(stage.stage_label_i18n?.group ?? stage.stage_label.replace(/^Gruppe\s+/i, ''));
            const standingsByTeam = new Map((standings?.standings ?? []).map((entry) => [entry.team, entry]));
            const hasResults = (standings?.recordedGamesCount ?? 0) > 0;
            const matches = (stage.rounds ?? []).flatMap((round) => round.matches ?? []).sort(compareMatches);
            return (
              <article key={stage.stage_label} className="sheet-card">
                <h3>{label}</h3>
                <div className="sheet-group-body">
                <table className="sheet-table sheet-table--compact">
                  <CompactColumns />
                  <tbody>
                    {matches.map((match) => (
                      <MatchRow key={match.id ?? match.code} match={match} time={formatTime(match)} t={t} />
                    ))}
                  </tbody>
                </table>
                <table className="sheet-table sheet-standings">
                  <thead>
                    <tr>
                      <th className="sheet-col-pos">{t('export.colPos')}</th>
                      <th className="sheet-col-team">{t('export.colTeam')}</th>
                      <th className="sheet-col-num">{t('export.colPlayed')}</th>
                      <th className="sheet-col-num">{t('export.colWon')}</th>
                      <th className="sheet-col-num">{t('export.colDrawn')}</th>
                      <th className="sheet-col-num">{t('export.colLost')}</th>
                      <th className="sheet-col-goals">{t('export.colGoals')}</th>
                      <th className="sheet-col-num">{t('export.colPoints')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamsOfGroup(stage, standings).map((team, index) => {
                      const entry = hasResults ? standingsByTeam.get(team) : null;
                      return (
                        <tr key={team}>
                          <td>{entry ? index + 1 : ''}</td>
                          <td className="sheet-col-team">{team}</td>
                          <td>{entry?.played ?? ''}</td>
                          <td>{entry?.wins ?? ''}</td>
                          <td>{entry?.draws ?? ''}</td>
                          <td>{entry?.losses ?? ''}</td>
                          <td>{entry ? `${entry.goalsFor}:${entry.goalsAgainst}` : ''}</td>
                          <td>{entry?.points ?? ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
      {koStages.length > 0 ? (
        <>
          <h3 className={groups.length > 0 ? 'sheet-subtitle sheet-subtitle--new-page' : 'sheet-subtitle'}>{t('export.phaseKnockout')}</h3>
          <table className="sheet-table sheet-table--compact sheet-ko">
            <CompactColumns />
            <tbody>
              {koStages.map((stage) => [
                <tr key={`stage-${stage.stage_label}`} className="sheet-divider">
                  <td colSpan={4}>{formatStageLabelI18n(stage.stage_label_i18n, t, stage.stage_label)}</td>
                </tr>,
                ...[...(stage.matches ?? [])].sort(compareMatches).map((match) => (
                  <MatchRow key={match.id ?? match.code} match={match} time={formatTime(match)} t={t} />
                ))
              ])}
            </tbody>
          </table>
        </>
      ) : null}
    </section>
  );
}
