import i18next from 'i18next';

// Ergebnis mit Kennzeichnung " n.F." bzw. " n.V."; Stechen schlägt Verlängerung.
export function formatResultScore(scoreA, scoreB, result, separator = ' : ') {
  const base = `${scoreA ?? 0}${separator}${scoreB ?? 0}`;
  if (result?.shootout) return `${base} ${i18next.t('shootout.short')}`;
  return result?.overtime ? `${base} ${i18next.t('overtime.short')}` : base;
}
