import { useTranslation } from 'react-i18next';
import { usePublicApp } from '../../context/PublicAppContext.jsx';

export default function SummaryTabs() {
  const { t } = useTranslation();
  const {
    summary: { tabs, activeTab, selectTab }
  } = usePublicApp();

  const buttonStyle = (active) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '44px',
    padding: '0.5rem 1rem',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.25)',
    background: active ? 'rgba(86, 160, 255, 0.35)' : 'transparent',
    color: active ? '#dcefff' : '#f0f4ff',
    fontWeight: active ? 600 : 500,
    letterSpacing: '0.05em',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  });

  return (
    <div className="summary-tabs" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => selectTab(tab)}
          style={buttonStyle(activeTab === tab)}
        >
          {t(`tabs.${tab}`)}
        </button>
      ))}
    </div>
  );
}
