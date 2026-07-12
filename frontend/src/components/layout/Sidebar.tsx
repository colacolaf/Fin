import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  collapsed: boolean;
}

interface TabItem {
  key: string;
  label: string;
  icon: string;
  to: string;
}

const TOP_TABS: TabItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '◐', to: '/' },
  { key: 'portfolio', label: 'Portfolio', icon: '◆', to: '/portfolio' },
  { key: 'debt', label: 'Debt', icon: '◇', to: '/debt' },
  { key: 'retirement', label: 'Retirement', icon: '●', to: '/retirement' },
  { key: 'questions', label: 'Questions', icon: '?', to: '/questions' },
  { key: 'research', label: 'Research', icon: '⌕', to: '/research' },
];

const BOTTOM_TABS: TabItem[] = [
  { key: 'settings', label: 'Settings', icon: '⚙', to: '/settings' },
  { key: 'memory', label: 'Memory', icon: '◌', to: '/memory' },
  { key: 'chat', label: 'Chat', icon: '◑', to: '/chat' },
  { key: 'trade', label: 'Trade', icon: '⇄', to: '/trade' },
  { key: 'analytics', label: 'Analytics', icon: '⌬', to: '/analytics' },
];

export default function Sidebar({ collapsed }: SidebarProps) {
  const location = useLocation();

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname === to || location.pathname.startsWith(to + '/');
  };

  return (
    <aside
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      role="navigation"
      aria-label="Primary navigation"
      data-testid="sidebar"
      data-collapsed={collapsed}
    >
      <nav className="sidebar-nav">
        {TOP_TABS.map((tab) => (
          <Link
            key={tab.key}
            to={tab.to}
            className={`sidebar-item ${isActive(tab.to) ? 'active' : ''}`}
            aria-current={isActive(tab.to) ? 'page' : undefined}
            aria-label={tab.label}
            data-testid={`nav-${tab.key}`}
          >
            <span className="sidebar-item-icon" aria-hidden="true">{tab.icon}</span>
            <span className="sidebar-item-label">{tab.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        {BOTTOM_TABS.map((tab) => (
          <Link
            key={tab.key}
            to={tab.to}
            className={`sidebar-item ${isActive(tab.to) ? 'active' : ''}`}
            aria-current={isActive(tab.to) ? 'page' : undefined}
            aria-label={tab.label}
            data-testid={`nav-${tab.key}`}
          >
            <span className="sidebar-item-icon" aria-hidden="true">{tab.icon}</span>
            <span className="sidebar-item-label">{tab.label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
