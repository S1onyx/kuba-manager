import { usePublicApp } from '../../context/PublicAppContext.jsx';

export default function SummaryTabs() {
  const {
    summary: { tabs, activeTab, selectTab }
  } = usePublicApp();

  const buttonStyle = (active) => ({
    padding: '0.5rem 1rem',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.25)',
    background: active ? 'rgba(86, 160, 255, 0.35)' : 'transparent',
    color: active ? '#dcefff' : '#f0f4ff',
    fontWeight: active ? 600 : 500,
    letterSpacing: '0.05em',
    cursor: 'pointer'
  });

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => selectTab(tab.id)}
          style={buttonStyle(activeTab === tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
