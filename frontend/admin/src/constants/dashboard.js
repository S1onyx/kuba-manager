export const POINT_OPTIONS = [1, 2, 3];

export const DISPLAY_VIEW_OPTIONS = [
  { id: 'scoreboard', labelKey: 'displayViews.scoreboard' },
  { id: 'bracket', labelKey: 'displayViews.bracket' }
];

export const PENALTY_PRESETS = [
  { value: '60', minutes: 1 },
  { value: '120', minutes: 2 },
  { value: 'custom', labelKey: 'penaltyPresets.custom' }
];

export const CONTROL_TABS = [
  { id: 'control', labelKey: 'tabs.control' },
  { id: 'schedule', labelKey: 'tabs.schedule' },
  { id: 'audio', labelKey: 'tabs.audio' },
  { id: 'history', labelKey: 'tabs.history' },
  { id: 'players', labelKey: 'tabs.players' },
  { id: 'teams', labelKey: 'tabs.teams' },
  { id: 'tournaments', labelKey: 'tabs.tournaments' },
  { id: 'export', labelKey: 'tabs.export' }
];

export const TOURNAMENT_CLASSIFICATION_OPTIONS = [
  { value: 'top4', labelKey: 'classification.top4' },
  { value: 'all', labelKey: 'classification.all' }
];

export const SCHEDULE_PHASE_OPTIONS = [
  { value: 'all', labelKey: 'phases.all' },
  { value: 'group', labelKey: 'phases.group' },
  { value: 'knockout', labelKey: 'phases.knockout' },
  { value: 'placement', labelKey: 'phases.placement' }
];
