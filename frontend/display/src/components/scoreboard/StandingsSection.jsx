import GroupStandings from '../GroupStandings.jsx';
import { formatGroupLabel } from '../../utils/formatting.js';

const sectionStyle = {
  width: '100%',
  maxWidth: '1200px'
};

const headerStyle = {
  textAlign: 'left',
  marginBottom: '1rem',
  fontSize: '2rem'
};

export default function StandingsSection({ visible, meta, loading, error, standings }) {
  if (!visible) {
    return null;
  }

  const stageSuffix = meta?.stageLabel ? ` – ${formatGroupLabel(meta.stageLabel)}` : '';

  return (
    <section style={sectionStyle}>
      <h3 style={headerStyle}>
        Aktuelle Gruppentabelle
        {stageSuffix}
      </h3>
      {loading ? (
        <p style={{ textAlign: 'left' }}>Lade Tabelle...</p>
      ) : error ? (
        <p style={{ textAlign: 'left', color: '#ff8a80' }}>{error}</p>
      ) : (
        <GroupStandings standings={standings ?? []} />
      )}
    </section>
  );
}
