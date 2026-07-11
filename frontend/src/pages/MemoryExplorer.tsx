import React, { useState } from 'react';
import MemoryGraph from '../components/memory/MemoryGraph';
import MemoryTimeline from '../components/memory/MemoryTimeline';
import MemorySearch from '../components/memory/MemorySearch';

const TABS = [
  { key: 'graph', label: 'Graph View' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'search', label: 'Search' },
] as const;

type Tab = (typeof TABS)[number]['key'];

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '32px 40px',
    maxWidth: 1200,
    margin: '0 auto',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--text-primary, #E8F4FD)',
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--text-muted, #64748B)',
    marginTop: 4,
  },
  tabBar: {
    display: 'flex',
    gap: 0,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    marginBottom: 24,
  },
  tab: {
    padding: '12px 24px',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-muted, #64748B)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'color 0.15s, border-color 0.15s',
  },
  tabActive: {
    color: '#2563eb',
    borderBottomColor: '#2563eb',
  },
};

export default function MemoryExplorer() {
  const [activeTab, setActiveTab] = useState<Tab>('graph');

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Memory Explorer</h1>
        <p style={styles.subtitle}>Your financial decision history</p>
      </div>

      <div style={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.key ? styles.tabActive : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'graph' && <MemoryGraph />}
      {activeTab === 'timeline' && <MemoryTimeline />}
      {activeTab === 'search' && <MemorySearch />}
    </div>
  );
}