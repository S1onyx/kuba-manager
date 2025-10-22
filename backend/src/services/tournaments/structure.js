import { getConnection, persistDatabase } from '../../db/connection.js';
import { safeParse } from '../shared/json.js';
import { getTeam } from '../teamsService.js';
import { getTournament } from './base.js';
import { computeGroupStandings } from './standings.js';
import {
  defaultSlotPlaceholder,
  createGroupLabels,
  distributeSlotsAcrossGroups,
  canonicalGroupLabel,
  generateRoundRobinFixtures,
  createSlotSource,
  createMatchCode,
  createGroupPositionSource,
  generateKnockoutStages,
  highestPowerOfTwo,
  calculateQualifierDistribution,
  resolveParticipantLabel
} from './helpers.js';

export async function regenerateTournamentStructure(tournament) {
  const { SQL, db } = await getConnection();
  db.exec('BEGIN');

  let transactionActive = true;
  let insertTeamStmt = null;
  let insertScheduleStmt = null;

  const releaseStatements = () => {
    if (insertScheduleStmt) {
      try {
        insertScheduleStmt.free();
      } catch (stmtError) {
        console.error('Konnte Turnier-Spielplan-Statement nicht freigeben:', stmtError);
      }
      insertScheduleStmt = null;
    }
    if (insertTeamStmt) {
      try {
        insertTeamStmt.free();
      } catch (stmtError) {
        console.error('Konnte Turnier-Team-Statement nicht freigeben:', stmtError);
      }
      insertTeamStmt = null;
    }
  };

  try {
    db.run('DELETE FROM tournament_teams WHERE tournament_id = ?', [tournament.id]);
    db.run('DELETE FROM tournament_schedule WHERE tournament_id = ?', [tournament.id]);

    const teamsTotal = Math.max(0, Number(tournament.team_count) || 0);
    const groupCount = Math.max(1, Number(tournament.group_count) || 0);
    const knockoutRounds = Math.max(0, Number(tournament.knockout_rounds) || 0);
    const classificationMode = String(tournament.classification_mode ?? 'top4').toLowerCase();

    if (teamsTotal > 0) {
      insertTeamStmt = db.prepare(
        'INSERT INTO tournament_teams (tournament_id, slot_number, team_id, placeholder) VALUES (?, ?, NULL, ?)'
      );
      for (let slot = 1; slot <= teamsTotal; slot += 1) {
        insertTeamStmt.bind([tournament.id, slot, `Team ${slot}`]);
        insertTeamStmt.step();
        insertTeamStmt.reset();
      }
      insertTeamStmt.free();
      insertTeamStmt = null;

      const groupLabels = createGroupLabels(groupCount);
      const assignments = distributeSlotsAcrossGroups(teamsTotal, groupLabels);

      const matchLabelLookup = new Map();
      let stageOrder = 0;

      insertScheduleStmt = db.prepare(
        `INSERT INTO tournament_schedule (
          tournament_id,
          phase,
          stage_label,
          round_number,
          match_order,
          stage_order,
          code,
          home_slot,
          away_slot,
          home_source,
          away_source,
          metadata_json
        ) VALUES (
          :tournament_id,
          :phase,
          :stage_label,
          :round_number,
          :match_order,
          :stage_order,
          :code,
          :home_slot,
          :away_slot,
          :home_source,
          :away_source,
          :metadata_json
        )`
      );

      assignments.forEach((slots, groupLabel) => {
        const fixtures = generateRoundRobinFixtures(slots);
        fixtures.forEach((matches, roundIndex) => {
          const stageLabel = `Gruppe ${groupLabel}`;
          stageOrder += 1;
          matches.forEach((match, matchIndex) => {
            const homeSource = createSlotSource(match.home, groupLabel);
            const awaySource = createSlotSource(match.away, groupLabel);
            const matchCode = createMatchCode(`GRP_${groupLabel}`, roundIndex, matchIndex);

            const entryMeta = {
              group: groupLabel,
              round: roundIndex + 1
            };

            insertScheduleStmt.bind({
              ':tournament_id': tournament.id,
              ':phase': 'group',
              ':stage_label': stageLabel,
              ':round_number': roundIndex + 1,
              ':match_order': matchIndex + 1,
              ':stage_order': stageOrder,
              ':code': matchCode,
              ':home_slot': match.home,
              ':away_slot': match.away,
              ':home_source': JSON.stringify(homeSource),
              ':away_source': JSON.stringify(awaySource),
              ':metadata_json': JSON.stringify(entryMeta)
            });
            insertScheduleStmt.step();
            insertScheduleStmt.reset();

            matchLabelLookup.set(matchCode, {
              stage_label: stageLabel,
              match_order: matchIndex + 1
            });
          });
        });
      });

      const initialTeamsCapacity = knockoutRounds > 0 ? 2 ** Math.max(0, knockoutRounds) : 0;
      const highestPossible = highestPowerOfTwo(teamsTotal);
      const knockoutEntrants = Math.min(initialTeamsCapacity, highestPossible);

      if (knockoutEntrants >= 2) {
        const qualifiersPerGroup = [];
        const basePerGroup = Math.floor(knockoutEntrants / groupLabels.length);
        let remainder = knockoutEntrants % groupLabels.length;

        groupLabels.forEach((label, index) => {
          const slots = assignments.get(label) ?? [];
          let desired = basePerGroup + (remainder > 0 ? 1 : 0);
          if (remainder > 0) {
            remainder -= 1;
          }
          desired = Math.min(desired, slots.length);
          qualifiersPerGroup[index] = desired;
        });

        let totalQualifiers = qualifiersPerGroup.reduce((acc, value) => acc + value, 0);
        while (totalQualifiers > knockoutEntrants) {
          for (let idx = qualifiersPerGroup.length - 1; idx >= 0 && totalQualifiers > knockoutEntrants; idx -= 1) {
            if (qualifiersPerGroup[idx] > 0) {
              qualifiersPerGroup[idx] -= 1;
              totalQualifiers -= 1;
            }
          }
        }

        const initialParticipants = [];
        groupLabels.forEach((label, index) => {
          const count = qualifiersPerGroup[index] ?? 0;
          for (let pos = 1; pos <= count; pos += 1) {
            initialParticipants.push({
              source: createGroupPositionSource(label, pos),
              label: `Platz ${pos} Gruppe ${label}`
            });
          }
        });

        if (initialParticipants.length >= 2) {
          const { mainStages, placementStages } = generateKnockoutStages({
            initialParticipants,
            knockoutRounds,
            classificationMode
          });

          const storeStages = (stages, phase) => {
            stages.forEach((stage, stageIdx) => {
              stageOrder += 1;
              stage.matches.forEach((match, matchIndex) => {
                const homeSource = match.home_source;
                const awaySource = match.away_source;
                const meta = {
                  stage_key: stage.key
                };

                insertScheduleStmt.bind({
                  ':tournament_id': tournament.id,
                  ':phase': phase,
                  ':stage_label': stage.label,
                  ':round_number': stageIdx + 1,
                  ':match_order': matchIndex + 1,
                  ':stage_order': stageOrder,
                  ':code': match.code,
                  ':home_slot': null,
                  ':away_slot': null,
                  ':home_source': JSON.stringify(homeSource),
                  ':away_source': JSON.stringify(awaySource),
                  ':metadata_json': JSON.stringify(meta)
                });
                insertScheduleStmt.step();
                insertScheduleStmt.reset();

                matchLabelLookup.set(match.code, {
                  stage_label: stage.label,
                  match_order: matchIndex + 1
                });
              });
            });
          };

          storeStages(mainStages, 'knockout');
          storeStages(placementStages, 'placement');
        }
      }

      insertScheduleStmt.free();
      insertScheduleStmt = null;
    }

    db.exec('COMMIT');
    transactionActive = false;
    persistDatabase(db, SQL);
  } catch (error) {
    console.error('Turnierstruktur konnte nicht generiert werden:', error);
    releaseStatements();
    if (transactionActive) {
      try {
        db.exec('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback der Turnierstruktur fehlgeschlagen:', rollbackError);
      } finally {
        transactionActive = false;
      }
    }
    throw error;
  } finally {
    releaseStatements();
    if (transactionActive) {
      try {
        db.exec('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback (Cleanup) der Turnierstruktur fehlgeschlagen:', rollbackError);
      }
    }
  }
}

export async function getTournamentTeams(tournamentId) {
  const { db } = await getConnection();
  const stmt = db.prepare(
    `SELECT tt.id, tt.tournament_id, tt.slot_number, tt.team_id, tt.placeholder, teams.name AS team_name
     FROM tournament_teams tt
     LEFT JOIN teams ON teams.id = tt.team_id
     WHERE tt.tournament_id = ?
     ORDER BY tt.slot_number ASC`
  );

  const rows = [];
  try {
    stmt.bind([tournamentId]);
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
  } finally {
    stmt.free();
  }
  return rows;
}

export async function setTournamentTeams(tournamentId, assignments = []) {
  const id = Number(tournamentId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('Ungültige Turnier-ID.');
  }
  if (!Array.isArray(assignments)) {
    throw new Error('Ungültige Teamzuweisungen.');
  }

  if (assignments.length === 0) {
    return getTournamentStructureDetails(id);
  }

  const normalizedAssignments = assignments.map((entry) => {
    const slotNumber = Number(entry.slot_number ?? entry.slot ?? entry.slotNumber);
    if (!Number.isInteger(slotNumber) || slotNumber <= 0) {
      throw new Error('Ungültiger Slot in Teamzuweisung.');
    }

    const teamIdRaw = entry.team_id ?? entry.teamId ?? null;
    const teamId =
      teamIdRaw === null || teamIdRaw === undefined || teamIdRaw === ''
        ? null
        : Number(teamIdRaw);
    if (teamId !== null && (!Number.isInteger(teamId) || teamId <= 0)) {
      throw new Error(`Ungültige Team-ID für Slot ${slotNumber}.`);
    }

    const placeholderRaw =
      entry.placeholder ?? entry.team_name ?? entry.teamName ?? entry.name ?? entry.displayName ?? '';
    const placeholder = String(placeholderRaw ?? '').trim();

    return {
      slotNumber,
      teamId,
      placeholder
    };
  });

  const seenSlots = new Set();
  normalizedAssignments.forEach((assignment) => {
    if (seenSlots.has(assignment.slotNumber)) {
      throw new Error('Slot-Zuweisungen dürfen keine doppelten Slot-Nummern enthalten.');
    }
    seenSlots.add(assignment.slotNumber);
  });

  const currentSlots = await getTournamentTeams(id);
  if (!Array.isArray(currentSlots) || currentSlots.length === 0) {
    return getTournamentStructureDetails(id);
  }

  const slotMap = new Map(currentSlots.map((entry) => [entry.slot_number, entry]));
  normalizedAssignments.forEach((assignment) => {
    if (!slotMap.has(assignment.slotNumber)) {
      throw new Error(`Slot ${assignment.slotNumber} gehört nicht zu diesem Turnier.`);
    }
  });

  const uniqueTeamIds = Array.from(
    new Set(normalizedAssignments.map((assignment) => assignment.teamId).filter((value) => value !== null))
  );
  const teamById = new Map();

  for (const teamId of uniqueTeamIds) {
    const team = await getTeam(teamId);
    if (!team) {
      throw new Error(`Team mit ID ${teamId} existiert nicht.`);
    }
    teamById.set(teamId, team);
  }

  const { SQL, db } = await getConnection();
  let transactionActive = false;
  let updateStmt = null;

  try {
    db.exec('BEGIN');
    transactionActive = true;

    updateStmt = db.prepare(`
      UPDATE tournament_teams
      SET team_id = :team_id,
          placeholder = :placeholder
      WHERE tournament_id = :tournament_id AND slot_number = :slot_number
    `);

    normalizedAssignments.forEach((assignment) => {
      const base = slotMap.get(assignment.slotNumber);
      const team = assignment.teamId ? teamById.get(assignment.teamId) : null;
      const placeholder =
        assignment.placeholder || team?.name || base?.placeholder || defaultSlotPlaceholder(assignment.slotNumber);

      updateStmt.bind({
        ':team_id': assignment.teamId ?? null,
        ':placeholder': placeholder,
        ':tournament_id': id,
        ':slot_number': assignment.slotNumber
      });
      updateStmt.step();
      updateStmt.reset();
    });

    updateStmt.free();
    updateStmt = null;

    db.exec('COMMIT');
    transactionActive = false;
    persistDatabase(db, SQL);
  } catch (error) {
    console.error('Teamzuweisungen konnten nicht gespeichert werden:', error);
    if (updateStmt) {
      try {
        updateStmt.free();
      } catch (stmtError) {
        console.error('Konnte Update-Statement für Teamzuweisungen nicht freigeben:', stmtError);
      }
      updateStmt = null;
    }
    if (transactionActive) {
      try {
        db.exec('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback der Teamzuweisungen fehlgeschlagen:', rollbackError);
      }
      transactionActive = false;
    }
    throw error;
  } finally {
    if (updateStmt) {
      try {
        updateStmt.free();
      } catch (stmtError) {
        console.error('Konnte Update-Statement (Cleanup) für Teamzuweisungen nicht freigeben:', stmtError);
      }
    }
    if (transactionActive) {
      try {
        db.exec('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback (Cleanup) der Teamzuweisungen fehlgeschlagen:', rollbackError);
      }
    }
  }

  return getTournamentStructureDetails(id);
}

function toScheduledTimestamp(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const candidate = value instanceof Date ? value : new Date(value);
  const timestamp = candidate.getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function normalizeScheduledAtValue(input) {
  if (input === null || input === undefined) {
    return null;
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      return null;
    }
    const timestamp = toScheduledTimestamp(trimmed);
    if (timestamp === null) {
      throw new Error('Ungültiger Zeitpunkt.');
    }
    return new Date(timestamp).toISOString();
  }

  const timestamp = toScheduledTimestamp(input);
  if (timestamp === null) {
    throw new Error('Ungültiger Zeitpunkt.');
  }
  return new Date(timestamp).toISOString();
}

function mapScheduleRow(row, teamsMap, matchLabelLookup, resultsByCode, groupStandingsMap) {
  const metadata = safeParse(row.metadata_json, {});
  const homeSource = safeParse(row.home_source, null);
  const awaySource = safeParse(row.away_source, null);

  const homeLabel = resolveParticipantLabel({
    slot: row.home_slot,
    source: homeSource,
    teamsMap,
    matchLabelLookup,
    resultsByCode,
    groupStandingsMap
  });
  const awayLabel = resolveParticipantLabel({
    slot: row.away_slot,
    source: awaySource,
    teamsMap,
    matchLabelLookup,
    resultsByCode,
    groupStandingsMap
  });

  const homeRecord = row.home_slot ? teamsMap.get(row.home_slot) : null;
  const awayRecord = row.away_slot ? teamsMap.get(row.away_slot) : null;

  const resultRecord = row.code ? resultsByCode.get(row.code) : null;
  const result =
    resultRecord !== undefined
      ? resultRecord && resultRecord.id
        ? {
            hasResult: true,
            gameId: resultRecord.id,
            teamAName: resultRecord.team_a,
            teamBName: resultRecord.team_b,
            scoreA: resultRecord.score_a,
            scoreB: resultRecord.score_b,
            finishedAt: resultRecord.created_at
          }
        : null
      : null;

  return {
    id: row.id,
    tournament_id: row.tournament_id,
    phase: row.phase,
    stage_label: row.stage_label,
    round_number: row.round_number,
    match_order: row.match_order,
    stage_order: row.stage_order,
    code: row.code,
    home_slot: row.home_slot,
    away_slot: row.away_slot,
    scheduled_at: row.scheduled_at ?? null,
    home_source: homeSource,
    away_source: awaySource,
    home_label: homeLabel,
    away_label: awayLabel,
    metadata,
    home: {
      slot: row.home_slot,
      source: homeSource,
      teamId: homeRecord?.team_id ?? null,
      teamName: homeRecord?.team_name ?? null,
      placeholder: homeRecord?.placeholder ?? (row.home_slot ? defaultSlotPlaceholder(row.home_slot) : null),
      label: homeLabel
    },
    away: {
      slot: row.away_slot,
      source: awaySource,
      teamId: awayRecord?.team_id ?? null,
      teamName: awayRecord?.team_name ?? null,
      placeholder: awayRecord?.placeholder ?? (row.away_slot ? defaultSlotPlaceholder(row.away_slot) : null),
      label: awayLabel
    },
    result
  };
}

export async function getTournamentSchedule(tournamentId) {
  const teams = await getTournamentTeams(tournamentId);
  const teamsMap = new Map(teams.map((team) => [team.slot_number, team]));

  const { db } = await getConnection();
  const resultLookup = new Map();

  const resultsStmt = db.prepare(
    `SELECT schedule_code, id, team_a, team_b, score_a, score_b, created_at
     FROM games
     WHERE tournament_id = ? AND schedule_code IS NOT NULL
     ORDER BY datetime(created_at) ASC, id ASC`
  );

  try {
    resultsStmt.bind([tournamentId]);
    while (resultsStmt.step()) {
      const row = resultsStmt.getAsObject();
      if (row.schedule_code) {
        resultLookup.set(row.schedule_code, row);
      }
    }
  } finally {
    resultsStmt.free();
  }

  const stmt = db.prepare(
    `SELECT * FROM tournament_schedule
     WHERE tournament_id = ?
     ORDER BY
       CASE WHEN scheduled_at IS NULL OR TRIM(scheduled_at) = '' THEN 1 ELSE 0 END,
       datetime(scheduled_at) ASC,
       stage_order ASC,
       match_order ASC,
       id ASC`
  );

  const rawRows = [];

  try {
    stmt.bind([tournamentId]);
    while (stmt.step()) {
      rawRows.push(stmt.getAsObject());
    }
  } finally {
    stmt.free();
  }

  const matchLabelLookup = new Map();
  rawRows.forEach((row) => {
    if (row.code) {
      matchLabelLookup.set(row.code, {
        stage_label: row.stage_label,
        match_order: row.match_order
      });
    }
  });

  const groupStandingsMap = new Map();
  const groupLabelsToResolve = new Set();
  rawRows.forEach((row) => {
    if (row.phase === 'group') {
      const canonical = canonicalGroupLabel(row.stage_label);
      if (canonical) {
        groupLabelsToResolve.add(canonical);
      }
    }
    const homeSource = safeParse(row.home_source, null);
    const awaySource = safeParse(row.away_source, null);
    [homeSource, awaySource].forEach((source) => {
      if (source?.type === 'groupPosition' && source.group) {
        const canonical = canonicalGroupLabel(source.group);
        if (canonical) {
          groupLabelsToResolve.add(canonical);
        }
      }
    });
  });

  if (groupLabelsToResolve.size > 0) {
    const tasks = Array.from(groupLabelsToResolve).map(async (label) => {
      try {
        const { standings } = await computeGroupStandings(tournamentId, label, {});
        if (Array.isArray(standings) && standings.length > 0) {
          groupStandingsMap.set(label, standings);
        }
      } catch (error) {
        console.error('Gruppenstand konnte für KO-Belegung nicht ermittelt werden:', error);
      }
    });
    await Promise.all(tasks);
  }

  return rawRows.map((row) =>
    mapScheduleRow(row, teamsMap, matchLabelLookup, resultLookup, groupStandingsMap)
  );
}

export async function getTournamentStages(tournamentId) {
  const schedule = await getTournamentSchedule(tournamentId);
  const stageSet = {
    group: new Set(),
    knockout: new Set(),
    placement: new Set()
  };

  schedule.forEach((match) => {
    if (match.phase === 'group') {
      stageSet.group.add(match.stage_label);
    } else if (match.phase === 'knockout') {
      stageSet.knockout.add(match.stage_label);
    } else if (match.phase === 'placement') {
      stageSet.placement.add(match.stage_label);
    }
  });

  return {
    group: Array.from(stageSet.group),
    knockout: Array.from(stageSet.knockout),
    placement: Array.from(stageSet.placement)
  };
}

function sortMatches(matches) {
  return matches
    .slice()
    .sort((a, b) => {
      const timeA = toScheduledTimestamp(a?.scheduled_at);
      const timeB = toScheduledTimestamp(b?.scheduled_at);
      if (timeA !== null && timeB !== null && timeA !== timeB) {
        return timeA - timeB;
      }
      if (timeA !== null && timeB === null) {
        return -1;
      }
      if (timeA === null && timeB !== null) {
        return 1;
      }
      if ((a.round_number ?? 0) !== (b.round_number ?? 0)) {
        return (a.round_number ?? 0) - (b.round_number ?? 0);
      }
      if ((a.match_order ?? 0) !== (b.match_order ?? 0)) {
        return (a.match_order ?? 0) - (b.match_order ?? 0);
      }
      return a.id - b.id;
    });
}

export function groupScheduleByPhase(schedule = []) {
  const grouped = {
    group: [],
    knockout: [],
    placement: []
  };

  const groupStageMap = new Map();
  const otherStageMaps = {
    knockout: new Map(),
    placement: new Map()
  };

  schedule.forEach((match) => {
    if (match.phase === 'group') {
      const key = match.stage_label;
      if (!groupStageMap.has(key)) {
        groupStageMap.set(key, { stage_label: key, rounds: new Map() });
      }
      const entry = groupStageMap.get(key);
      const roundKey = match.round_number || 1;
      if (!entry.rounds.has(roundKey)) {
        entry.rounds.set(roundKey, []);
      }
      entry.rounds.get(roundKey).push(match);
    } else if (match.phase === 'knockout' || match.phase === 'placement') {
      const stageMap = otherStageMaps[match.phase];
      if (!stageMap.has(match.stage_label)) {
        stageMap.set(match.stage_label, []);
      }
      stageMap.get(match.stage_label).push(match);
    }
  });

  grouped.group = Array.from(groupStageMap.values())
    .map((stage) => ({
      stage_label: stage.stage_label,
      rounds: Array.from(stage.rounds.entries())
        .sort(([a], [b]) => a - b)
        .map(([round, matches]) => ({
          round,
          matches: sortMatches(matches)
        }))
    }))
    .sort((a, b) => a.stage_label.localeCompare(b.stage_label, 'de', { sensitivity: 'base' }));

  ['knockout', 'placement'].forEach((phase) => {
    grouped[phase] = Array.from(otherStageMaps[phase].entries())
      .map(([stageLabel, matches]) => ({
        stage_label: stageLabel,
        matches: sortMatches(matches)
      }))
      .sort(
        (a, b) =>
          a.matches[0]?.stage_order - b.matches[0]?.stage_order ||
          a.stage_label.localeCompare(b.stage_label, 'de', { sensitivity: 'base' })
      );
  });

  return grouped;
}

export async function updateTournamentScheduleEntry(tournamentId, entryId, patch = {}) {
  const numericTournamentId = Number(tournamentId);
  if (!Number.isInteger(numericTournamentId) || numericTournamentId <= 0) {
    throw new Error('Ungültige Turnier-ID.');
  }

  const numericEntryId = Number(entryId);
  if (!Number.isInteger(numericEntryId) || numericEntryId <= 0) {
    throw new Error('Ungültige Spielplan-ID.');
  }

  const { SQL, db } = await getConnection();
  const selectStmt = db.prepare(
    'SELECT * FROM tournament_schedule WHERE tournament_id = ? AND id = ?'
  );

  let existing = null;
  try {
    selectStmt.bind([numericTournamentId, numericEntryId]);
    if (selectStmt.step()) {
      existing = selectStmt.getAsObject();
    }
  } finally {
    selectStmt.free();
  }

  if (!existing) {
    return null;
  }

  const updates = {};

  if (
    Object.prototype.hasOwnProperty.call(patch, 'scheduledAt') ||
    Object.prototype.hasOwnProperty.call(patch, 'scheduled_at')
  ) {
    const rawValue = patch.scheduledAt ?? patch.scheduled_at;
    const normalized = normalizeScheduledAtValue(rawValue);
    const current = existing.scheduled_at ?? null;
    if (normalized !== current) {
      updates.scheduled_at = normalized;
    }
  }

  if (Object.keys(updates).length > 0) {
    const assignments = Object.entries(updates);
    const setClause = assignments.map(([key]) => `${key} = :${key}`).join(', ');
    const params = {
      ':tournament_id': numericTournamentId,
      ':id': numericEntryId
    };

    assignments.forEach(([key, value]) => {
      params[`:${key}`] = value;
    });

    db.run(
      `UPDATE tournament_schedule
       SET ${setClause}
       WHERE tournament_id = :tournament_id AND id = :id`,
      params
    );

    persistDatabase(db, SQL);
  }

  const schedule = await getTournamentSchedule(numericTournamentId);
  return schedule.find((entry) => entry.id === numericEntryId) ?? null;
}

export async function getTournamentStructureDetails(tournamentId) {
  const id = Number(tournamentId);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  const tournament = await getTournament(id);
  if (!tournament) {
    return null;
  }

  const teams = await getTournamentTeams(id);
  const teamMap = new Map(teams.map((team) => [team.slot_number, team]));

  const groupCount = Math.max(1, Number(tournament.group_count) || 0);
  const teamCount = Math.max(0, Number(tournament.team_count) || 0);
  const groupLabels = createGroupLabels(groupCount);
  const assignments = distributeSlotsAcrossGroups(teamCount, groupLabels);

  const { knockoutEntrants, qualifiersByGroup } = calculateQualifierDistribution(tournament, groupLabels, assignments);

  const standingsPromises = groupLabels.map((label) => computeGroupStandings(id, label, {}));
  const standingsResults = await Promise.all(standingsPromises);

  const groups = groupLabels.map((label, index) => {
    const slots = assignments.get(label) ?? [];
    const slotEntries = slots.map((slotNumber) => {
      const record = teamMap.get(slotNumber);
      const placeholder = record?.placeholder || defaultSlotPlaceholder(slotNumber);
      const teamName = record?.team_name ?? null;
      return {
        slotNumber,
        teamId: record?.team_id ?? null,
        teamName,
        placeholder,
        displayName: teamName || placeholder
      };
    });

    const standingsResult = standingsResults[index] ?? { standings: [], recordedGamesCount: 0 };
    const totalMatches = slots.length <= 1 ? 0 : (slots.length * (slots.length - 1)) / 2;
    const qualifiers = qualifiersByGroup.get(label) ?? { count: 0, positions: [] };
    const recordedGamesCount = standingsResult.recordedGamesCount ?? 0;
    const isComplete = totalMatches > 0 && recordedGamesCount >= totalMatches;

    const standingsEntries = Array.isArray(standingsResult.standings)
      ? standingsResult.standings.map((entry, entryIndex) => {
          const status =
            qualifiers.count > 0
              ? entryIndex < qualifiers.count
                ? isComplete
                  ? 'qualified'
                  : 'in_position'
                : 'contender'
              : 'neutral';
          return {
            position: entryIndex + 1,
            team: entry.team,
            played: entry.played,
            wins: entry.wins,
            draws: entry.draws,
            losses: entry.losses,
            goalsFor: entry.goalsFor,
            goalsAgainst: entry.goalsAgainst,
            goalDiff: entry.goalDiff,
            points: entry.points,
            penalties: entry.penalties,
            status
          };
        })
      : [];

    const qualifiedTeams = standingsEntries.filter((entry) => entry.status === 'qualified').map((entry) => entry.team);
    const provisionalTeams = standingsEntries
      .filter((entry) => entry.status === 'in_position')
      .map((entry) => entry.team);

    return {
      label,
      slots: slotEntries,
      standings: {
        recordedGamesCount,
        totalMatches,
        entries: standingsEntries
      },
      qualifiers: {
        count: qualifiers.count,
        positions: qualifiers.positions,
        qualifiedTeams,
        provisionalTeams,
        isComplete
      }
    };
  });

  const scheduleEntries = await getTournamentSchedule(id);
  const groupedSchedule = groupScheduleByPhase(scheduleEntries);

  return {
    tournament,
    groups,
    schedule: groupedSchedule,
    scheduleRaw: scheduleEntries,
    knockout: {
      entrants: knockoutEntrants,
      rounds: Math.max(0, Number(tournament.knockout_rounds) || 0),
      classificationMode: String(tournament.classification_mode ?? 'top4'),
      qualifiersPerGroup: groupLabels.map((label) => ({
        label,
        count: qualifiersByGroup.get(label)?.count ?? 0
      }))
    }
  };
}
