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
        className="flex gap-0.5 mb-5 border-b border-b-[var(--color-border)] pb-0"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="py-2 px-4 font-[var(--font-mono)] text-[10px] tracking-[1.5px] uppercase border-0 bg-transparent cursor-pointer mb-[-1px]" style={{ fontWeight: activeTab === tab.key ? 600 : 400, borderBottom: activeTab === tab.key
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent', color: activeTab === tab.key
                  ? 'var(--color-accent)'
                  : 'var(--color-text-muted)', transition: 'all var(--transition)' }}
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
