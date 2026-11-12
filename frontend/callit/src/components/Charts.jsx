import { useTranslation } from 'react-i18next';
import { formatPct, formatQuote } from '../utils/format.js';

export function ShareBar({ shares, quotes, labels, showQuotes = true }) {
  const { t, i18n } = useTranslation();
  const parts = [
    { key: 'home', className: 'bar__home', label: labels?.home ?? '1' },
    { key: 'draw', className: 'bar__draw', label: t('stats.draw') },
    { key: 'away', className: 'bar__away', label: labels?.away ?? '2' }
  ];
  return (
    <div className="stack" style={{ gap: 6 }}>
      <div className="bar" role="img" aria-label={parts.map((part) => `${part.label} ${formatPct(shares[part.key], i18n.language)}`).join(', ')}>
        {parts.map((part) =>
          shares[part.key] > 0 ? (
            <div key={part.key} className={part.className} style={{ width: `${shares[part.key]}%` }}>
              {shares[part.key] >= 12 ? formatPct(shares[part.key], i18n.language) : ''}
            </div>
          ) : null
        )}
      </div>
      <div className="row row--between small">
        {parts.map((part) => (
          <span key={part.key} style={{ flex: 1, textAlign: part.key === 'home' ? 'left' : part.key === 'away' ? 'right' : 'center', minWidth: 0 }}>
            <span className="ellipsis" style={{ display: 'block' }}>{part.label}</span>
            <span className="muted">
              {formatPct(shares[part.key], i18n.language)}
              {showQuotes ? ` · ${t('stats.quote')} ${formatQuote(quotes?.[part.key], i18n.language)}` : ''}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function HBarList({ items, valueLabel }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return (
    <ul className="list-plain">
      {items.map((item) => (
        <li key={item.key} className="hbar">
          <div className="row row--between small">
            <span className="ellipsis grow">{item.label}</span>
            <span className="muted">{valueLabel(item)}</span>
          </div>
          <div className="hbar__track">
            <div className="hbar__fill" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

// Heatmap der getippten Spielstände (Zeilen = Heim, Spalten = Gast).
export function Heatmap({ cells, result, homeLabel, awayLabel }) {
  const { t } = useTranslation();
  if (!cells?.length) return null;
  const maxScore = Math.min(12, Math.max(4, ...cells.map((cell) => Math.max(cell.home, cell.away)), result ? Math.max(result.home, result.away) : 0));
  const maxCount = Math.max(...cells.map((cell) => cell.count));
  const lookup = new Map(cells.map((cell) => [`${Math.min(cell.home, maxScore)}:${Math.min(cell.away, maxScore)}`, cell.count]));
  const size = maxScore + 1;
  return (
    <div className="stack" style={{ gap: 6 }}>
      <div className="row row--between dim small">
        <span>↓ {homeLabel}</span>
        <span>{awayLabel} →</span>
      </div>
      <div className="heatmap" style={{ gridTemplateColumns: `18px repeat(${size}, 1fr)` }} role="img" aria-label={t('stats.heatmap')}>
        <span />
        {Array.from({ length: size }, (_, away) => (
          <span key={`h${away}`} className="heatmap__cell dim">
            {away === maxScore && maxScore >= 12 ? `${away}+` : away}
          </span>
        ))}
        {Array.from({ length: size }, (_, home) => [
          <span key={`r${home}`} className="heatmap__cell dim">
            {home === maxScore && maxScore >= 12 ? `${home}+` : home}
          </span>,
          ...Array.from({ length: size }, (_, away) => {
            const count = lookup.get(`${home}:${away}`) ?? 0;
            const isResult = result && result.home === home && result.away === away;
            const alpha = count ? 0.18 + (count / maxCount) * 0.72 : 0.04;
            return (
              <span
                key={`${home}:${away}`}
                className="heatmap__cell"
                title={`${home}:${away} · ${count}`}
                style={{
                  background: `rgba(249, 115, 22, ${alpha})`,
                  outline: isResult ? '2px solid #4ade80' : 'none',
                  fontWeight: count ? 700 : 400,
                  color: count ? '#fff' : 'transparent'
                }}
              >
                {count || '.'}
              </span>
            );
          })
        ])}
      </div>
    </div>
  );
}

export function Sparkline({ points }) {
  if (!points || points.length < 2) return null;
  const width = 300;
  const height = 80;
  const max = Math.max(1, ...points);
  const step = width / (points.length - 1);
  const path = points.map((value, index) => `${index === 0 ? 'M' : 'L'}${(index * step).toFixed(1)},${(height - 6 - (value / max) * (height - 12)).toFixed(1)}`).join(' ');
  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="spark" x1="0" x2="1">
          <stop offset="0" stopColor="#56a0ff" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke="url(#spark)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
