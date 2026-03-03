import { useDashboardStore } from '@/stores/dashboardStore';
import CommanderView from '@/components/dashboard/CommanderView';
import S4View from '@/components/dashboard/S4View';
import S3View from '@/components/dashboard/S3View';

const views = [
  { key: 'commander' as const, label: 'COMMANDER' },
  { key: 's4' as const, label: 'S-4 (LOGISTICS)' },
  { key: 's3' as const, label: 'S-3 (OPERATIONS)' },
] as const;

export default function DashboardPage() {
  const { activeView, setActiveView } = useDashboardStore();

  return (
    <div>
      {/* View Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          marginBottom: 20,
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 0,
        }}
      >
        {views.map((view) => (
          <button
            key={view.key}
            onClick={() => setActiveView(view.key)}
            style={{
              padding: '8px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: activeView === view.key ? 600 : 400,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              border: 'none',
              borderBottom:
                activeView === view.key
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent',
              backgroundColor: 'transparent',
              color:
                activeView === view.key
                  ? 'var(--color-accent)'
                  : 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'all var(--transition)',
              marginBottom: -1,
            }}
          >
            {view.label}
          </button>
        ))}
      </div>

      {/* View Content */}
      {activeView === 'commander' && <CommanderView />}
      {activeView === 's4' && <S4View />}
      {activeView === 's3' && <S3View />}
    </div>
  );
}
