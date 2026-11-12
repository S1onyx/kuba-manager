import { useTranslation } from 'react-i18next';
import { IconChart, IconTips, IconTrophy, IconUser } from './Icons.jsx';

const ITEMS = [
  { tab: 'tippen', icon: IconTips, labelKey: 'nav.tips' },
  { tab: 'ranking', icon: IconTrophy, labelKey: 'nav.ranking' },
  { tab: 'stats', icon: IconChart, labelKey: 'nav.stats' },
  { tab: 'ich', icon: IconUser, labelKey: 'nav.me' }
];

export default function BottomNav({ tournamentId, activeTab, openCount = 0, finished = false }) {
  const { t } = useTranslation();
  const active = activeTab === 'match' ? 'stats' : activeTab === 'user' ? 'ranking' : activeTab === 'regeln' ? 'tippen' : activeTab;
  // Nach Turnierende wird „Tippen“ zum Endstand
  return (
    <nav className="bottom-nav" aria-label={t('nav.label')}>
      {ITEMS.map(({ tab, icon: Icon, labelKey }) => (
        <a
          key={tab}
          href={`#/t/${tournamentId}/${tab}`}
          className={`bottom-nav__item${active === tab ? ' bottom-nav__item--active' : ''}`}
          aria-current={active === tab ? 'page' : undefined}
          style={{ textDecoration: 'none' }}
        >
          <Icon />
          <span>{t(finished && tab === 'tippen' ? 'nav.final' : labelKey)}</span>
          {tab === 'tippen' && openCount > 0 ? <span className="nav-badge">{openCount}</span> : null}
        </a>
      ))}
    </nav>
  );
}
