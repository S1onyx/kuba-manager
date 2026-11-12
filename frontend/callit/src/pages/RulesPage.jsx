import { useTranslation } from 'react-i18next';
import { formatPoints } from '../utils/format.js';

export default function RulesPage({ info }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { points, multipliers, joker, underdog, specials } = info.settings;
  const p = (value) => formatPoints(value, lang);

  return (
    <div className="stack">
      <h1 className="page-title" style={{ marginBottom: 0 }}>{t('rules.title')}</h1>
      <div className="card stack">
        <strong>{t('rules.matchTips')}</strong>
        <span className="muted small">{t('rules.matchTipsText')}</span>
        <table className="points-table">
          <tbody>
            <tr><td>{t('rules.exact')}</td><td>{p(points.exact)}</td></tr>
            <tr><td>{t('rules.diff')}</td><td>{p(points.diff)}</td></tr>
            <tr><td>{t('rules.tendency')}</td><td>{p(points.tendency)}</td></tr>
            <tr><td>{t('rules.koAdvance')}</td><td>+{p(points.koAdvance)}</td></tr>
          </tbody>
        </table>
        <span className="muted small">{t('rules.notCumulative')}</span>
      </div>

      <div className="card stack">
        <strong>{t('rules.bonus')}</strong>
        <ul className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
          <li>{t('rules.multipliers', { group: p(multipliers.group), knockout: p(multipliers.knockout), placement: p(multipliers.placement), final: p(multipliers.final) })}</li>
          {joker.enabled ? <li>{t('rules.joker', { count: joker.perPhase })}</li> : null}
          {underdog.enabled ? <li>{t('rules.underdog', { bonus: p(underdog.bonus), pct: p(underdog.thresholdPct), min: underdog.minTips })}</li> : null}
          <li>{t('rules.formula')}</li>
        </ul>
      </div>

      <div className="card stack">
        <strong>{t('specials.title')}</strong>
        <table className="points-table">
          <tbody>
            {Object.entries(specials)
              .filter(([, config]) => config.enabled)
              .map(([type, config]) => (
                <tr key={type}>
                  <td>{type === 'group_winner' ? t('rules.groupWinnerEach') : t(`specials.types.${type}`)}</td>
                  <td>{p(config.points)}</td>
                </tr>
              ))}
          </tbody>
        </table>
        <span className="muted small">{t('rules.specialsText')}</span>
      </div>

      <div className="card stack">
        <strong>{t('rules.fairness')}</strong>
        <ul className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
          <li>{t('rules.lock')}</li>
          <li>{t('rules.hidden')}</li>
          <li>{t('rules.tiebreak')}</li>
          <li>{t('rules.late')}</li>
          <li>{t('rules.live')}</li>
        </ul>
      </div>

      {info.rulesText ? (
        <div className="card stack">
          <strong>{t('rules.organizer')}</strong>
          <span className="small" style={{ whiteSpace: 'pre-wrap' }}>{info.rulesText}</span>
        </div>
      ) : null}
    </div>
  );
}
