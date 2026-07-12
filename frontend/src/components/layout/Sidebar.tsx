import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  IconAnalytics,
  IconChat,
  IconDashboard,
  IconDebt,
  IconMemory,
  IconPortfolio,
  IconPrompts,
  IconQuestions,
  IconResearch,
  IconRetirement,
  IconSettings,
  IconTrade,
  IconUser,
} from './Icons';

interface SidebarProps {
  collapsed: boolean;
}

interface TabItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  to: string;
}

interface Section {
  key: 'workspace' | 'agents' | 'tools' | 'system';
  title: string;
  items: TabItem[];
}

const SECTIONS: Section[] = [
  {
    key: 'workspace',
    title: 'Workspace',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: <IconDashboard />, to: '/' },
      { key: 'portfolio', label: 'Portfolio', icon: <IconPortfolio />, to: '/portfolio' },
      { key: 'debt', label: 'Debt', icon: <IconDebt />, to: '/debt' },
      { key: 'retirement', label: 'Retirement', icon: <IconRetirement />, to: '/retirement' },
      { key: 'questions', label: 'Questions', icon: <IconQuestions />, to: '/questions' },
      { key: 'research', label: 'Research', icon: <IconResearch />, to: '/research' },
    ],
  },
  {
    key: 'agents',
    title: 'Agents',
    items: [
      { key: 'chat', label: 'Multi-Agent', icon: <IconChat />, to: '/orchestrate' },
      { key: 'recommendations', label: 'Recommendations', icon: <IconPrompts />, to: '/recommendations' },
      { key: 'execution', label: 'Execution', icon: <IconTrade />, to: '/execution' },
    ],
  },
  {
    key: 'tools',
    title: 'Tools',
    items: [
      { key: 'memory', label: 'Memory', icon: <IconMemory />, to: '/memory' },
      { key: 'community', label: 'Community', icon: <IconChat />, to: '/community' },
      { key: 'analytics', label: 'Analytics', icon: <IconAnalytics />, to: '/analytics' },
      { key: 'backtest', label: 'Backtest', icon: <IconResearch />, to: '/backtest' },
    ],
  },
  {
    key: 'system',
    title: 'System',
    items: [
      { key: 'settings', label: 'Settings', icon: <IconSettings />, to: '/settings' },
    ],
  },
];

const AVATAR_FALLBACK = 'F';
const EMAIL_FALLBACK = 'fin@local.app';

function initialsFromEmail(email: string): string {
  const [handle] = email.split('@');
  if (!handle) return AVATAR_FALLBACK;
  return handle.slice(0, 2).toUpperCase();
}

function readEmail(): string {
  if (typeof window === 'undefined') return EMAIL_FALLBACK;
  return localStorage.getItem('fin.user.email') ?? EMAIL_FALLBACK;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>(readEmail);

  // Listen for email changes from Settings Account section.
  useEffect(() => {
    function onChange(e: Event) {
      const detail = (e as CustomEvent<{ email?: string }>).detail;
      if (detail?.email) setEmail(detail.email);
    }
    window.addEventListener('fin:email-changed', onChange);
    return () => window.removeEventListener('fin:email-changed', onChange);
  }, []);

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
      <div className="sidebar-brand" aria-label="Fin">
        <span className="sidebar-brand-mark">F</span>
        {!collapsed && <span className="sidebar-brand-text">Fin</span>}
      </div>

      <nav className="sidebar-nav">
        {SECTIONS.map((section) => (
          <div key={section.key} className="sidebar-section">
            <div className="sidebar-section-label" aria-hidden={collapsed}>
              {section.title}
            </div>
            <ul className="sidebar-section-list">
              {section.items.map((item) => (
                <li key={item.key}>
                  <Link
                    to={item.to}
                    className={`sidebar-item ${isActive(item.to) ? 'active' : ''}`}
                    aria-current={isActive(item.to) ? 'page' : undefined}
                    aria-label={item.label}
                    data-testid={`nav-${item.key}`}
                  >
                    <span className="sidebar-item-icon" aria-hidden="true">{item.icon}</span>
                    <span className="sidebar-item-label">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-user-card"
          aria-label={`Account: ${email}`}
          data-testid="sidebar-user"
          onClick={() => navigate('/settings')}
        >
          <span className="sidebar-user-avatar" aria-hidden="true">
            {collapsed ? <IconUser /> : initialsFromEmail(email)}
          </span>
          {!collapsed && (
            <span className="sidebar-user-meta">
              <span className="sidebar-user-email">{email}</span>
              <span className="sidebar-user-plan">Local · v20</span>
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
