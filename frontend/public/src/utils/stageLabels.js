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
