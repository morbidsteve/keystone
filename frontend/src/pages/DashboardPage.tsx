import { useEffect, useMemo } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useAuthStore } from '@/stores/authStore';
import CommanderView from '@/components/dashboard/CommanderView';
import S4View from '@/components/dashboard/S4View';
import S3View from '@/components/dashboard/S3View';
import OperatorDashboard from '@/components/dashboard/OperatorDashboard';
import ViewerDashboard from '@/components/dashboard/ViewerDashboard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { Role } from '@/lib/types';

type DashboardView = 'commander' | 's4' | 's3' | 'operator' | 'viewer';

/** Map a user role to its default dashboard view */
function roleToDefaultView(role: string | undefined): DashboardView {
  switch (role?.toUpperCase()) {
    case Role.ADMIN:
    case Role.COMMANDER:
      return 'commander';
    case Role.S4:
      return 's4';
    case Role.S3:
      return 's3';
    case Role.OPERATOR:
    case Role.ARMORER:
      return 'operator';
    case Role.VIEWER:
      return 'viewer';
    default:
      return 'commander';
  }
}

/** Determine which tab options a role can see */
function getAvailableTabs(role: string | undefined): { key: DashboardView; label: string }[] {
  const upper = role?.toUpperCase();
  // Commanders and admins can switch between commander/s4/s3
  if (upper === Role.ADMIN || upper === Role.COMMANDER) {
    return [
      { key: 'commander', label: 'COMMANDER' },
      { key: 's4', label: 'S-4 (LOGISTICS)' },
      { key: 's3', label: 'S-3 (OPERATIONS)' },
    ];
  }
  // Other roles see only their own view — no tab switcher
  return [];
}

export default function DashboardPage() {
  const { activeView, setActiveView } = useDashboardStore();
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role;

  // Set default view based on role on mount / role change
  useEffect(() => {
    setActiveView(roleToDefaultView(userRole));
  }, [userRole, setActiveView]);

  const tabs = useMemo(() => getAvailableTabs(userRole), [userRole]);

  return (
    <div>
      {/* View Tabs — only shown when the user has multiple view options */}
      {tabs.length > 0 && (
        <div
          className="responsive-tabs flex gap-0.5 mb-5 border-b border-b-[var(--color-border)] pb-0"
          
        >
          {tabs.map((view) => (
            <button
              key={view.key}
              onClick={() => setActiveView(view.key)}
              className={`py-2 px-4 font-[var(--font-mono)] text-[10px] tracking-[1.5px] uppercase border-0 bg-transparent cursor-pointer mb-[-1px] transition-all duration-[var(--transition)] ${
                activeView === view.key
                  ? 'font-semibold border-b-2 border-b-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'font-normal border-b-2 border-b-transparent text-[var(--color-text-muted)]'
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>
      )}

      {/* View Content */}
      {activeView === 'commander' && <CommanderView />}
      {activeView === 's4' && <S4View />}
      {activeView === 's3' && <S3View />}
      {activeView === 'operator' && <OperatorDashboard />}
      {activeView === 'viewer' && <ViewerDashboard />}

      {/* Activity Feed */}
      <div className="mt-5">
        <ActivityFeed />
      </div>
    </div>
  );
}
