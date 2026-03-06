import { useState } from 'react';
import { AlertTriangle, Settings, Bell, Shield, Lightbulb } from 'lucide-react';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';
import AlertsTab from './alerts/AlertsTab';
import RulesTab from './alerts/RulesTab';
import NotificationsTab from './alerts/NotificationsTab';
import PredictionsTab from './alerts/PredictionsTab';

type TabKey = 'alerts' | 'rules' | 'notifications' | 'preferences' | 'predictions';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'alerts', label: 'ALERTS' },
  { key: 'rules', label: 'RULES' },
  { key: 'notifications', label: 'NOTIFICATIONS' },
  { key: 'preferences', label: 'PREFERENCES' },
  { key: 'predictions', label: 'PREDICTIONS' },
];

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('alerts');

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      {/* Tabs */}
      <div
        className="flex gap-0.5 border-b border-b-[var(--color-border)] pb-0"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="py-2 px-4 font-[var(--font-mono)] text-[10px] tracking-[1.5px] uppercase border-0 bg-transparent cursor-pointer mb-[-1px] flex items-center gap-1.5" style={{ fontWeight: activeTab === tab.key ? 600 : 400, borderBottom: activeTab === tab.key
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent', color: activeTab === tab.key
                  ? 'var(--color-accent)'
                  : 'var(--color-text-muted)', transition: 'all var(--transition)' }}
          >
            {tab.key === 'alerts' && <AlertTriangle size={10} />}
            {tab.key === 'rules' && <Settings size={10} />}
            {tab.key === 'notifications' && <Bell size={10} />}
            {tab.key === 'preferences' && <Shield size={10} />}
            {tab.key === 'predictions' && <Lightbulb size={10} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'alerts' && <AlertsTab />}
      {activeTab === 'rules' && <RulesTab />}
      {activeTab === 'notifications' && <NotificationsTab />}
      {activeTab === 'preferences' && <NotificationPreferences />}
      {activeTab === 'predictions' && <PredictionsTab />}
    </div>
  );
}
