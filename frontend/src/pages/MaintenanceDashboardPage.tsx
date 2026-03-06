// =============================================================================
// MaintenanceDashboardPage — Full maintenance management dashboard
// =============================================================================

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDashboardStore } from '@/stores/dashboardStore';
import Card from '@/components/ui/Card';
import MaintenanceAnalyticsPanel from '@/components/maintenance/MaintenanceAnalyticsPanel';
import DeadlineBoard from '@/components/maintenance/DeadlineBoard';
import PMScheduleTable from '@/components/maintenance/PMScheduleTable';
import MaintenanceTrendChart from '@/components/maintenance/MaintenanceTrendChart';
import TopFaultsChart from '@/components/maintenance/TopFaultsChart';
import MaintenanceQueue from '@/components/equipment/MaintenanceQueue';
import PersonnelWorkloadChart from '@/components/maintenance/PersonnelWorkloadChart';
import EquipmentReliabilityChart from '@/components/maintenance/EquipmentReliabilityChart';
import EquipmentHealthTable from '@/components/maintenance/EquipmentHealthTable';
import PredictiveAlertsPanel from '@/components/maintenance/PredictiveAlertsPanel';
import PartsForecastTable from '@/components/maintenance/PartsForecastTable';
import {
  getMaintenanceDeadlines,
  liftDeadline,
  getPMSchedule,
  getMaintenanceAnalytics,
} from '@/api/maintenanceExpanded';
import { useToast } from '@/hooks/useToast';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'work-orders' as const, label: 'WORK ORDERS' },
  { key: 'pm-schedule' as const, label: 'PM SCHEDULE' },
  { key: 'deadlines' as const, label: 'DEADLINES' },
  { key: 'analytics' as const, label: 'ANALYTICS' },
  { key: 'predictive' as const, label: 'PREDICTIVE' },
];

type TabKey = (typeof TABS)[number]['key'];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function MaintenanceDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('work-orders');
  const selectedUnitId = useDashboardStore((s) => s.selectedUnitId);
  const queryClient = useQueryClient();
  const toast = useToast();

  // Resolve numeric unit ID (for API calls)
  const numericUnitId = useMemo(() => {
    if (!selectedUnitId) return 1;
    const parsed = parseInt(selectedUnitId, 10);
    return isNaN(parsed) ? 1 : parsed;
  }, [selectedUnitId]);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const {
    data: analytics,
    isLoading: analyticsLoading,
  } = useQuery({
    queryKey: ['maintenance-analytics', numericUnitId],
    queryFn: () => getMaintenanceAnalytics(numericUnitId),
  });

  const {
    data: deadlines,
    isLoading: deadlinesLoading,
  } = useQuery({
    queryKey: ['maintenance-deadlines', numericUnitId],
    queryFn: () => getMaintenanceDeadlines(numericUnitId),
    enabled: activeTab === 'deadlines',
  });

  const {
    data: pmSchedule,
    isLoading: pmLoading,
  } = useQuery({
    queryKey: ['pm-schedule', numericUnitId],
    queryFn: () => getPMSchedule(numericUnitId),
    enabled: activeTab === 'pm-schedule',
  });

  // Lift deadline mutation
  const liftMutation = useMutation({
    mutationFn: liftDeadline,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-deadlines'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-analytics'] });
      toast.success('Deadline lifted successfully');
    },
    onError: () => {
      toast.danger('Failed to lift deadline');
    },
  });

  // -------------------------------------------------------------------------
  // ESC handler
  // -------------------------------------------------------------------------

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Placeholder for modal close
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const renderLoadingSkeleton = () => (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div
        className="skeleton"
        style={{ width: 200, height: 16, margin: '0 auto 12px' }}
      />
      <div
        className="skeleton"
        style={{ width: 300, height: 12, margin: '0 auto' }}
      />
    </div>
  );

  // -------------------------------------------------------------------------
  // Page layout
  // -------------------------------------------------------------------------

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '3px',
            color: 'var(--color-text-bright)',
            textTransform: 'uppercase',
          }}
        >
          MAINTENANCE MANAGEMENT
        </div>
        {analytics && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span>
              {analytics.manHoursLast30d.toLocaleString()} MAN-HRS (30D)
            </span>
            <span>
              {analytics.deadlineEquipment.filter((d) => d.liftedDate == null).length} DEADLINED
            </span>
            <span>
              {analytics.overduePms.length} OVERDUE PMs
            </span>
          </div>
        )}
      </div>

      {/* Analytics KPI row — always visible */}
      {analyticsLoading ? (
        <div style={{ display: 'flex', gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ flex: '1 1 0', height: 100, borderRadius: 'var(--radius)' }}
            />
          ))}
        </div>
      ) : (
        <MaintenanceAnalyticsPanel analytics={analytics} />
      )}

      {/* Tabs */}
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

      {/* Tab content */}
      {activeTab === 'work-orders' && (
        <MaintenanceQueue />
      )}

      {activeTab === 'pm-schedule' && (
        <Card title="PREVENTIVE MAINTENANCE SCHEDULE">
          {pmLoading ? renderLoadingSkeleton() : (
            <PMScheduleTable schedule={pmSchedule ?? []} />
          )}
        </Card>
      )}

      {activeTab === 'deadlines' && (
        <Card title="DEADLINE EQUIPMENT">
          {deadlinesLoading ? renderLoadingSkeleton() : (
            <DeadlineBoard
              deadlines={deadlines ?? []}
              onLift={(id) => liftMutation.mutate(id)}
            />
          )}
        </Card>
      )}

      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: 16,
            }}
          >
            <Card title="WEEKLY MAINTENANCE TREND">
              {analytics ? (
                <MaintenanceTrendChart data={analytics.weeklyTrend} height={300} />
              ) : (
                renderLoadingSkeleton()
              )}
            </Card>
            <Card title="TOP EQUIPMENT FAULTS">
              {analytics ? (
                <TopFaultsChart faults={analytics.topFaults} height={300} />
              ) : (
                renderLoadingSkeleton()
              )}
            </Card>
          </div>
          <Card title="PERSONNEL WORKLOAD (30D)">
            <PersonnelWorkloadChart unitId={numericUnitId} days={30} />
          </Card>
          <Card title="EQUIPMENT RELIABILITY (90D)">
            <EquipmentReliabilityChart unitId={numericUnitId} days={90} />
          </Card>
          <Card title="EQUIPMENT HEALTH &amp; MTBF">
            <EquipmentHealthTable unitId={numericUnitId} />
          </Card>
        </div>
      )}

      {activeTab === 'predictive' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="PREDICTIVE MAINTENANCE ALERTS">
            <PredictiveAlertsPanel unitId={numericUnitId} />
          </Card>
          <Card title="EQUIPMENT HEALTH SCORES">
            <EquipmentHealthTable unitId={numericUnitId} />
          </Card>
          <Card title="PARTS DEMAND FORECAST (90D)">
            <PartsForecastTable unitId={numericUnitId} days={90} />
          </Card>
        </div>
      )}
    </div>
  );
}
