export const VOLUME_CATEGORIES = [
  {
    key: 'score',
    label: 'Korbhymnen',
    description: 'Alle Treffersounds (Team-spezifisch oder allgemein).'
  },
  {
    key: 'game',
    label: 'Spielstart / Pause / Ende',
    description: 'Statusmeldungen wie Startsignal, Halbzeit- oder Endstand.'
  },
  {
    key: 'events',
    label: 'Spielereignisse',
    description: 'Weitere Trigger wie Fouls oder individuelle Events.'
  },
  {
    key: 'manual',
    label: 'Manuelle Wiedergabe',
    description: 'Sounds, die direkt aus der Bibliothek gestartet werden.'
  }
];

export const DEFAULT_VOLUME_SETTINGS = VOLUME_CATEGORIES.reduce(
  (acc, category) => {
    acc[category.key] = 1;
    return acc;
  },
  {}
);
