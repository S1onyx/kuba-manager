export function defaultSlotPlaceholder(slotNumber) {
  return `Team ${slotNumber}`;
}

export function parseNonNegativeInt(value, fallback = 0) {
  if (value === undefined || value === null || value === '') {
    return Math.max(0, Math.trunc(Number(fallback) || 0));
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return Math.max(0, Math.trunc(Number(fallback) || 0));
  }
  return Math.max(0, Math.trunc(numeric));
}

export function normalizeClassificationMode(mode, fallback = 'top4') {
  const normalized = String(mode ?? fallback ?? 'top4').trim().toLowerCase();
  if (normalized === 'top4') {
    return 'top4';
  }

  if (normalized === 'all' || normalized === 'alle') {
    return 'all';
  }
  throw new Error('Ungültiger Platzierungsmodus.');
}

export function sanitizeTournamentBooleans(flag, fallback = false) {
  if (flag === undefined) {
    return Boolean(fallback);
  }
  if (flag === true || flag === 'true' || flag === 1 || flag === '1') {
    return true;
  }
  if (flag === false || flag === 'false' || flag === 0 || flag === '0') {
    return false;
  }
  return Boolean(flag);
}

export function validateTournamentNumbers({ groupCount, knockoutRounds, teamCount }) {
  if (groupCount < 1) {
    throw new Error('Es muss mindestens eine Gruppe geben.');
  }

  if (teamCount < 2) {
    throw new Error('Ein Turnier benötigt mindestens 2 Teams.');
  }

  if (groupCount > teamCount) {
    throw new Error('Gruppenzahl darf Teamanzahl nicht überschreiten.');
  }

  const maxKnockoutRounds = Math.floor(Math.log2(teamCount));
  if (knockoutRounds > maxKnockoutRounds) {
    const label = maxKnockoutRounds === 1 ? '1 KO-Runde' : `${maxKnockoutRounds} KO-Runden`;
    throw new Error(`Für ${teamCount} Teams sind höchstens ${label} möglich.`);
  }
}

export function normalizeTournamentPayload(payload = {}, defaults = {}) {
  const name = payload.name !== undefined ? String(payload.name).trim() : String(defaults.name ?? '').trim();
  if (!name) {
    throw new Error('Turniername darf nicht leer sein.');
  }

  const groupCount = parseNonNegativeInt(payload.group_count, defaults.group_count ?? 0);
  const knockoutRounds = parseNonNegativeInt(payload.knockout_rounds, defaults.knockout_rounds ?? 0);
  const teamCount = parseNonNegativeInt(payload.team_count, defaults.team_count ?? 0);
  const classification = normalizeClassificationMode(
    payload.classification_mode !== undefined ? payload.classification_mode : defaults.classification_mode ?? 'top4'
  );
  const isPublic = sanitizeTournamentBooleans(
    payload.is_public !== undefined ? payload.is_public : defaults.is_public ?? false
  );

  validateTournamentNumbers({ groupCount, knockoutRounds, teamCount });

  return {
    name,
    groupCount,
    knockoutRounds,
    teamCount,
    classification,
    isPublic
  };
}

export function canonicalGroupLabel(label) {
  const raw = String(label ?? '').trim();
  if (!raw) {
    return '';
  }

  const upper = raw.toUpperCase();
  const match = upper.match(/^(GRUPPE|GROUP)\s+/);
  if (match) {
    return upper.slice(match[0].length).trim();
  }

  return upper.trim();
}

export function highestPowerOfTwo(value) {
  const sanitized = Math.max(1, Math.trunc(value || 0));
  return 2 ** Math.floor(Math.log2(sanitized));
}

function createGroupLabel(index) {
  let label = '';
  let i = index;
  while (i >= 0) {
    label = String.fromCharCode(65 + (i % 26)) + label;
    i = Math.floor(i / 26) - 1;
  }
  return label;
}

export function createGroupLabels(count) {
  const labels = [];
  for (let i = 0; i < Math.max(1, count); i += 1) {
    labels.push(createGroupLabel(i));
  }
  return labels;
}

export function distributeSlotsAcrossGroups(teamCount, groupLabels) {
  const assignments = new Map();
  const totalGroups = Math.max(1, groupLabels.length);
  const slots = Array.from({ length: teamCount }, (_, index) => index + 1);
  const basePerGroup = Math.floor(teamCount / totalGroups);
  let remainder = teamCount % totalGroups;
  let cursor = 0;

  groupLabels.forEach((label) => {
    const quantity = basePerGroup + (remainder > 0 ? 1 : 0);
    if (remainder > 0) {
      remainder -= 1;
    }
    const slice = slots.slice(cursor, cursor + quantity);
    assignments.set(label, slice);
    cursor += quantity;
  });

  return assignments;
}

export function generateRoundRobinFixtures(slots) {
  const teamSlots = [...slots];
  if (teamSlots.length <= 1) {
    return [];
  }

  if (teamSlots.length % 2 === 1) {
    teamSlots.push(null);
  }

  const rounds = teamSlots.length - 1;
  const half = teamSlots.length / 2;
  const fixtures = [];

  const participants = [...teamSlots];
  for (let round = 0; round < rounds; round += 1) {
    const matches = [];
    for (let i = 0; i < half; i += 1) {
      const home = participants[i];
      const away = participants[participants.length - 1 - i];
      if (home !== null && away !== null) {
        matches.push({ home, away });
      }
    }
    fixtures.push(matches);

    const first = participants[0];
    const rest = participants.slice(1);
    rest.unshift(rest.pop());
    participants.splice(0, participants.length, first, ...rest);
  }

  return fixtures;
}

export function getRoundLabel(participantCount) {
  const labels = new Map([
    [2, 'Finale'],
    [4, 'Halbfinale'],
    [8, 'Viertelfinale'],
    [16, 'Achtelfinale'],
    [32, 'Sechzehntelfinale'],
    [64, 'Zweiunddreißigstelfinale'],
    [128, 'Vierundsechzigstelfinale']
  ]);
  return labels.get(participantCount) || `KO-Runde (${participantCount} Teams)`;
}

export function createSlotSource(slot, groupLabel) {
  return {
    type: 'slot',
    slot,
    group: groupLabel || null
  };
}

export function createGroupPositionSource(group, position) {
  return {
    type: 'groupPosition',
    group,
    position
  };
}

export function createPreviousMatchSource(code, result) {
  return {
    type: 'previousMatch',
    code,
    result
  };
}

export function descriptorLabelFromSource(source, matchLabelLookup) {
  if (!source) {
    return '';
  }

  if (source.type === 'slot') {
    if (source.group) {
      return `Team ${source.slot} – Gruppe ${source.group}`;
    }
    return `Team ${source.slot}`;
  }

  if (source.type === 'groupPosition') {
    return `Platz ${source.position} Gruppe ${source.group}`;
  }

  if (source.type === 'previousMatch') {
    const ref = matchLabelLookup.get(source.code);
    const stageLabel = ref?.stage_label ?? 'vorheriges Spiel';
    const matchNumber = ref ? ref.match_order : '';
    if (source.result === 'winner') {
      return `Sieger ${stageLabel}${matchNumber ? ` – Spiel ${matchNumber}` : ''}`;
    }
    return `Verlierer ${stageLabel}${matchNumber ? ` – Spiel ${matchNumber}` : ''}`;
  }

  if (source.type === 'placeholder') {
    return source.label ?? '';
  }

  return '';
}

export function createMatchCode(prefix, stageIndex, matchIndex) {
  return `${prefix}_R${stageIndex + 1}_M${matchIndex + 1}`;
}

export function generateClassificationStages(sources, basePlacement, prefix) {
  const stages = [];

  const recurse = (currentSources, base, depth, branch) => {
    if (!currentSources || currentSources.length < 2) {
      return;
    }

    const isFinal = currentSources.length === 2;
    const label = isFinal
      ? `Spiel um Platz ${base} / ${base + 1}`
      : `Platzierungsrunde ${base}-${base + currentSources.length - 1}`;

    const matches = [];
    for (let i = 0; i < currentSources.length; i += 2) {
      const matchCode = `${prefix}_R${depth}_${branch || 'A'}${Math.floor(i / 2) + 1}`;
      matches.push({
        code: matchCode,
        home_source: currentSources[i],
        away_source: currentSources[i + 1]
      });
    }

    stages.push({ key: `${prefix}-${depth}-${branch || 'A'}`, label, matches });

    if (isFinal) {
      return;
    }

    const winners = matches.map((match) => createPreviousMatchSource(match.code, 'winner'));
    const losers = matches.map((match) => createPreviousMatchSource(match.code, 'loser'));

    recurse(winners, base, depth + 1, `${branch || 'A'}W`);
    recurse(losers, base + winners.length, depth + 1, `${branch || 'A'}L`);
  };

  recurse(sources, basePlacement, 1, '');
  return stages;
}

export function generateKnockoutStages({ initialParticipants, knockoutRounds, classificationMode }) {
  const mainStages = [];
  const placementStages = [];
  if (!initialParticipants || initialParticipants.length < 2 || knockoutRounds <= 0) {
    return { mainStages, placementStages };
  }

  let participants = initialParticipants.map((descriptor) => ({ ...descriptor }));
  let teamsInRound = participants.length;
  let stageIndex = 0;
  const roundInfo = [];

  while (participants.length >= 2 && stageIndex < knockoutRounds) {
    const stageLabel = getRoundLabel(teamsInRound);
    const matches = [];
    const pairCount = Math.floor(participants.length / 2);

    for (let i = 0; i < pairCount; i += 1) {
      const home = participants[i];
      const away = participants[participants.length - 1 - i];
      matches.push({
        code: createMatchCode('KO', stageIndex, i),
        home_source: home.source,
        away_source: away.source
      });
    }

    mainStages.push({
      key: `main-${stageIndex}`,
      label: stageLabel,
      matches,
      participantsCount: teamsInRound
    });

    roundInfo.push({ matches, participantsCount: teamsInRound });

    participants = matches.map((match) => ({
      source: createPreviousMatchSource(match.code, 'winner')
    }));

    teamsInRound = participants.length;
    stageIndex += 1;
  }

  if (classificationMode === 'top4') {
    const semifinalInfo = roundInfo.find((info) => info.participantsCount === 4);
    if (semifinalInfo) {
      const losers = semifinalInfo.matches.map((match) => createPreviousMatchSource(match.code, 'loser'));
      placementStages.push(...generateClassificationStages(losers, 3, 'PL-SF'));
    }
  } else if (classificationMode === 'all') {
    roundInfo.forEach((info) => {
      const basePlacement = info.participantsCount / 2 + 1;
      if (basePlacement >= 3) {
        const losers = info.matches.map((match) => createPreviousMatchSource(match.code, 'loser'));
        placementStages.push(...generateClassificationStages(losers, basePlacement, `PL-${info.participantsCount}`));
      }
    });
  }

  return { mainStages, placementStages };
}

export function resolveParticipantLabel({
  slot,
  source,
  teamsMap,
  matchLabelLookup,
  resultsByCode,
  groupStandingsMap
}) {
  if (slot) {
    const team = teamsMap.get(slot);
    if (team) {
      return team.team_name || team.placeholder || `Team ${slot}`;
    }
    return `Team ${slot}`;
  }

  if (source) {
    if (source.type === 'previousMatch' && resultsByCode) {
      const reference = resultsByCode.get(source.code);
      if (reference) {
        const scoreA = Number(reference.score_a ?? 0);
        const scoreB = Number(reference.score_b ?? 0);
        const teamA = reference.team_a ?? '';
        const teamB = reference.team_b ?? '';

        if (source.result === 'winner') {
          if (scoreA > scoreB) {
            return teamA || descriptorLabelFromSource(source, matchLabelLookup);
          }
          if (scoreB > scoreA) {
            return teamB || descriptorLabelFromSource(source, matchLabelLookup);
          }
        }

        if (source.result === 'loser') {
          if (scoreA > scoreB) {
            return teamB || descriptorLabelFromSource(source, matchLabelLookup);
          }
          if (scoreB > scoreA) {
            return teamA || descriptorLabelFromSource(source, matchLabelLookup);
          }
        }
      }
    }

    if (source.type === 'groupPosition' && groupStandingsMap) {
      const canonical = canonicalGroupLabel(source.group);
      if (canonical) {
        const entry = groupStandingsMap.get(canonical);
        const wrapper =
          entry && !Array.isArray(entry)
            ? entry
            : {
                standings: Array.isArray(entry) ? entry : [],
                isComplete: false
              };
        const standings = Array.isArray(wrapper.standings) ? wrapper.standings : [];
        if (standings.length >= source.position) {
          const standingEntry = standings[source.position - 1];
          if (standingEntry?.team) {
            return standingEntry.team;
          }
        }
      }
    }

    return descriptorLabelFromSource(source, matchLabelLookup);
  }

  return '';
}

export function calculateQualifierDistribution(tournament, groupLabels, assignments) {
  const teamCount = Math.max(0, Number(tournament.team_count) || 0);
  const knockoutRounds = Math.max(0, Number(tournament.knockout_rounds) || 0);
  const initialTeamsCapacity = knockoutRounds > 0 ? 2 ** Math.max(0, knockoutRounds) : 0;
  const highestPossible = teamCount > 0 ? highestPowerOfTwo(teamCount) : 0;
  const knockoutEntrants =
    teamCount > 0 && initialTeamsCapacity > 0 ? Math.min(initialTeamsCapacity, highestPossible) : 0;

  const qualifiersByGroup = new Map();

  if (knockoutEntrants >= 2) {
    const groupArray = groupLabels.map((label) => assignments.get(label) ?? []);
    const qualifiersPerGroup = [];
    const basePerGroup = Math.floor(knockoutEntrants / groupLabels.length);
    let remainder = knockoutEntrants % groupLabels.length;

    groupArray.forEach((slots, index) => {
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

    groupLabels.forEach((label, index) => {
      const count = qualifiersPerGroup[index] ?? 0;
      const positions = Array.from({ length: count }, (_, positionIndex) => positionIndex + 1);
      qualifiersByGroup.set(label, {
        count,
        positions
      });
    });
  }

  return {
    qualifiersByGroup,
    knockoutEntrants
  };
}
