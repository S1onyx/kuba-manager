// Sichtbare Labels/Beschreibungen liegen in src/i18n/locales/*.json
// unter volume.categories.<key>.
export const VOLUME_CATEGORIES = [
  { key: 'score' },
  { key: 'game' },
  { key: 'events' },
  { key: 'manual' }
];

export const DEFAULT_VOLUME_SETTINGS = VOLUME_CATEGORIES.reduce(
  (acc, category) => {
    acc[category.key] = 1;
    return acc;
  },
  {}
);
