import i18next from 'i18next';

export function formatResultScore(scoreA, scoreB, shootout, separator = ' : ') {
  const base = `${scoreA ?? 0}${separator}${scoreB ?? 0}`;
  return shootout ? `${base} ${i18next.t('shootout.short')}` : base;
}
