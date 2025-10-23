import { usePublicApp } from '../../context/PublicAppContext.jsx';

export default function PublicFooter() {
  const {
    impressum: { open }
  } = usePublicApp();

  return (
    <footer
      style={{
        marginTop: 'auto',
        display: 'flex',
        justifyContent: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap',
        padding: '1rem 0 0'
      }}
    >
      <button
        type="button"
        onClick={open}
        style={{
          padding: '0.4rem 1rem',
          borderRadius: '999px',
          border: '1px solid rgba(255,255,255,0.35)',
          background: 'transparent',
          color: '#f0f4ff',
          letterSpacing: '0.06em',
          cursor: 'pointer',
          fontSize: '0.9rem'
        }}
      >
        Impressum
      </button>
    </footer>
  );
}
