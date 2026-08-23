import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

// Lokalisiert die strukturierten Stage-Label-Metadaten des Backends
// (stage_label_i18n: { type, group, round, participants, rangeFrom, rangeTo }).
// Fallback ist immer das originale (deutsche) stage_label.
export function formatStageLabelI18n(stageLabelI18n, t, fallback = '') {
  if (!stageLabelI18n || typeof stageLabelI18n !== 'object') {
    return fallback;
  }

  switch (stageLabelI18n.type) {
    case 'group':
      return stageLabelI18n.group ? t('stageLabels.group', { group: stageLabelI18n.group }) : fallback;
    case 'knockout_final':
      return t('stageLabels.knockoutFinal');
    case 'knockout_round': {
      const participants = Number(stageLabelI18n.participants);
      if (participants === 4) {
        return t('stageLabels.semifinal');
      }
      if (participants === 8) {
        return t('stageLabels.quarterfinal');
      }
      if (participants === 16) {
        return t('stageLabels.roundOf16');
      }
      return Number.isFinite(participants) && participants > 0
        ? t('stageLabels.knockoutRound', { count: participants })
        : fallback;
    }
    case 'placement_match': {
      const from = Number(stageLabelI18n.rangeFrom);
      const to = Number(stageLabelI18n.rangeTo);
      return Number.isFinite(from) && Number.isFinite(to)
        ? t('stageLabels.placementMatch', { from, to })
        : fallback;
    }
    case 'placement_round': {
      const from = Number(stageLabelI18n.rangeFrom);
      const to = Number(stageLabelI18n.rangeTo);
      return Number.isFinite(from) && Number.isFinite(to)
        ? t('stageLabels.placementRound', { from, to })
        : fallback;
    }
    default:
      return fallback;
  }
}

export function useFormatStageLabel() {
  const { t } = useTranslation();
  return useCallback(
    (stageLabelI18n, fallback = '') => formatStageLabelI18n(stageLabelI18n, t, fallback),
    [t]
  );
}
