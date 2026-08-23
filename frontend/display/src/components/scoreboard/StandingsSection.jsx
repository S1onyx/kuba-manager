import { useTranslation } from 'react-i18next';
import GroupStandings from '../GroupStandings.jsx';
import { formatGroupLabel } from '../../utils/formatting.js';

const sectionStyle = {
  width: '100%',
  maxWidth: '1200px'
};

const headerStyle = {
  textAlign: 'left',
  marginBottom: '1rem',
  fontSize: 'clamp(1.2rem, 2.5vw, 2rem)'
};

export default function StandingsSection({ visible, meta, loading, error, standings }) {
  const { t } = useTranslation();

  if (!visible) {
    return null;
  }

  const stageSuffix = meta?.stageLabel ? ` – ${formatGroupLabel(meta.stageLabel, t)}` : '';

  return (
    <section style={sectionStyle}>
      <h3 style={headerStyle}>
        {t('standings.currentTitle')}
        {stageSuffix}
      </h3>
      {loading ? (
        <p style={{ textAlign: 'left' }}>{t('standings.loading')}</p>
      ) : error ? (
        <p style={{ textAlign: 'left', color: '#ff8a80' }}>{error}</p>
      ) : (
        <GroupStandings standings={standings ?? []} />
      )}
    </section>
  );
}
