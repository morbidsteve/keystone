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
    <div className="animate-fade-in flex flex-col gap-4">
      {/* Tab bar */}
      <div
        className="flex gap-0.5 border-b border-b-[var(--color-border)] pb-0"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="py-2 px-4 font-[var(--font-mono)] text-[10px] tracking-[1.5px] bg-transparent border-0 cursor-pointer mb-[-1px]" style={{ fontWeight: activeTab === tab.key ? 700 : 400, color: activeTab === tab.key ? 'var(--color-accent)' : 'var(--color-text-muted)', borderBottom: activeTab === tab.key
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent', transition: 'all var(--transition)' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'REPORTS' && <ReportViewer />}

      {activeTab === 'GENERATE' && (
        <div className="grid-responsive-sidebar-content">
          <div className="flex flex-col gap-4">
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
