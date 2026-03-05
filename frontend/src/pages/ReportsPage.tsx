import { useState } from 'react';
import ReportGenerator from '@/components/reports/ReportGenerator';
import ReportViewer from '@/components/reports/ReportViewer';
import ExportDestinations from '@/components/reports/ExportDestinations';
import TemplateManager from '@/components/reports/TemplateManager';
import ScheduleManager from '@/components/reports/ScheduleManager';
import QuickGeneratePanel from '@/components/reports/QuickGeneratePanel';

const TABS = [
  { key: 'REPORTS' as const, label: 'REPORTS' },
  { key: 'GENERATE' as const, label: 'GENERATE' },
  { key: 'TEMPLATES' as const, label: 'TEMPLATES' },
  { key: 'SCHEDULES' as const, label: 'SCHEDULES' },
  { key: 'EXPORT' as const, label: 'EXPORT' },
];

type TabKey = (typeof TABS)[number]['key'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('REPORTS');

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 0,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: activeTab === tab.key ? 700 : 400,
              letterSpacing: '1.5px',
              color: activeTab === tab.key ? 'var(--color-accent)' : 'var(--color-text-muted)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom:
                activeTab === tab.key
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all var(--transition)',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'REPORTS' && <ReportViewer />}

      {activeTab === 'GENERATE' && (
        <div className="grid-responsive-sidebar-content">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <QuickGeneratePanel />
          </div>
          <ReportGenerator />
        </div>
      )}

      {activeTab === 'TEMPLATES' && <TemplateManager />}

      {activeTab === 'SCHEDULES' && <ScheduleManager />}

      {activeTab === 'EXPORT' && <ExportDestinations />}
    </div>
  );
}
