import { usePublicApp } from '../../context/PublicAppContext.jsx';

const responsiveStyles = `
  @media (max-width: 768px) {
    .summary-tabs {
      flex-wrap: nowrap;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      padding-bottom: 0.25rem;
      margin: 0 -0.25rem;
      padding-left: 0.25rem;
      padding-right: 0.25rem;
    }
    .summary-tabs button {
      flex-shrink: 0;
    }
  }
`;

export default function SummaryTabs() {
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
      <style>{responsiveStyles}</style>
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
