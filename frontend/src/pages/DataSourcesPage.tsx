import { useState } from 'react';
import AllSourcesPanel from '@/components/datasources/AllSourcesPanel';
import MIRCSourcesPanel from '@/components/datasources/MIRCSourcesPanel';
import ExcelWatchPanel from '@/components/datasources/ExcelWatchPanel';
import TAKSourcesPanel from '@/components/datasources/TAKSourcesPanel';

const tabs = [
  { key: 'all' as const, label: 'ALL SOURCES' },
  { key: 'mirc' as const, label: 'MIRC SOURCES' },
  { key: 'excel' as const, label: 'EXCEL WATCH' },
  { key: 'tak' as const, label: 'TAK SERVERS' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

export default function DataSourcesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  return (
    <div>
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          marginBottom: 20,
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 0,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: activeTab === tab.key ? 600 : 400,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              border: 'none',
              borderBottom:
                activeTab === tab.key
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent',
              backgroundColor: 'transparent',
              color:
                activeTab === tab.key
                  ? 'var(--color-accent)'
                  : 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'all var(--transition)',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'all' && <AllSourcesPanel />}
      {activeTab === 'mirc' && <MIRCSourcesPanel />}
      {activeTab === 'excel' && <ExcelWatchPanel />}
      {activeTab === 'tak' && <TAKSourcesPanel />}
    </div>
  );
}
