export function formatTime(seconds = 0) {
  const total = Math.max(0, Math.trunc(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// t ist optional: ohne Übersetzungsfunktion bleibt das bisherige deutsche Verhalten.
export function formatGroupLabel(label, t) {
  if (!label) {
    return '';
  }

  const upper = label.toUpperCase();
  if (upper.startsWith('GRUPPE')) {
    return label;
  }
  return t ? t('stage.groupLabel', { label }) : `Gruppe ${label}`;
}

export function formatStageDescription(stageType, stageLabel, t) {
  if (!stageLabel) {
    return '';
  }

  switch (stageType) {
    case 'group':
      return t
        ? t('stage.groupPhase', { label: formatGroupLabel(stageLabel, t) })
        : `Gruppenphase · ${formatGroupLabel(stageLabel)}`;
    case 'knockout':
      return t ? t('stage.knockoutPhase', { label: stageLabel }) : `KO-Runde · ${stageLabel}`;
    case 'placement':
      return t ? t('stage.placementPhase', { label: stageLabel }) : `Platzierung · ${stageLabel}`;
    default:
      return stageLabel;
  }
}

// Lokalisiert ein Backend-Descriptor-Objekt (stage_label_i18n / labelI18n / stageLabelI18n)
// der Form { type, group, round, participants, rangeFrom, rangeTo }.
// Ohne Descriptor oder bei unbekanntem Typ greift der Fallback (altes stage_label-Feld).
export function formatStageLabelI18n(t, descriptor, fallback = '') {
  if (!descriptor || typeof descriptor !== 'object' || !descriptor.type) {
    return fallback;
  }

  switch (descriptor.type) {
    case 'group':
      return descriptor.group ? t('stage.groupLabel', { label: descriptor.group }) : fallback;
    case 'knockout_final':
      return t('stage.knockoutFinal');
    case 'knockout_round': {
      const participants = Number(descriptor.participants);
      if (Number.isInteger(participants) && participants > 0) {
        // Bekannte Runden (Halbfinale, Viertelfinale, …) haben eigene Keys,
        // der Rest fällt auf die generische Form mit Pluralregel zurück.
        return t([`stage.round.p${participants}`, 'stage.knockoutRoundGeneric'], {
          count: participants
        });
      }
      return fallback;
    }
    case 'placement_match': {
      const from = Number(descriptor.rangeFrom);
      if (Number.isInteger(from) && from > 0) {
        return t('stage.placementMatch', { from, to: descriptor.rangeTo ?? from });
      }
      return fallback;
    }
    case 'placement_round': {
      const from = Number(descriptor.rangeFrom);
      const to = Number(descriptor.rangeTo);
      if (Number.isInteger(from) && Number.isInteger(to)) {
        return t('stage.placementRound', { from, to });
      }
      return fallback;
    }
    default:
      return fallback;
  }
}
