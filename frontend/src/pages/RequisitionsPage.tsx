// =============================================================================
// RequisitionsPage — Requisition & Supply Chain Workflow Module
// =============================================================================

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboardStore';
import Card from '@/components/ui/Card';
import RequisitionTable from '@/components/requisitions/RequisitionTable';
import ApprovalQueue from '@/components/requisitions/ApprovalQueue';
import InventoryPanel from '@/components/requisitions/InventoryPanel';
import CreateRequisitionModal from '@/components/requisitions/CreateRequisitionModal';
import { getRequisitions, getRequisitionAnalytics } from '@/api/requisitions';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'all' as const, label: 'ALL REQUISITIONS' },
  { key: 'pending' as const, label: 'PENDING APPROVAL' },
  { key: 'analytics' as const, label: 'ANALYTICS' },
  { key: 'inventory' as const, label: 'INVENTORY' },
];

const ACTIVE_STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'SOURCING', 'BACKORDERED', 'SHIPPED'];
const ARCHIVED_STATUSES = ['RECEIVED', 'DENIED', 'CANCELED'];

type TabKey = (typeof TABS)[number]['key'];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function RequisitionsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'ACTIVE' | 'ARCHIVED' | 'ALL'>('ACTIVE');

  const selectedUnitId = useDashboardStore((s) => s.selectedUnitId);

  const numericUnitId = useMemo(() => {
    if (!selectedUnitId) return 1;
    const parsed = parseInt(selectedUnitId, 10);
    return isNaN(parsed) ? 1 : parsed;
  }, [selectedUnitId]);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const {
    data: requisitions,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['requisitions'],
    queryFn: () => getRequisitions(),
  });

  const { data: analytics } = useQuery({
    queryKey: ['requisition-analytics'],
    queryFn: () => getRequisitionAnalytics(),
    enabled: activeTab === 'analytics',
  });

  const filteredRequisitions = useMemo(() => {
    if (!requisitions) return [];
    if (viewMode === 'ACTIVE') return requisitions.filter(r => ACTIVE_STATUSES.includes(r.status));
    if (viewMode === 'ARCHIVED') return requisitions.filter(r => ARCHIVED_STATUSES.includes(r.status));
    return requisitions;
  }, [requisitions, viewMode]);

  // -------------------------------------------------------------------------
  // ESC handler
  // -------------------------------------------------------------------------

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCreateModal(false);
      }
    },
    [],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------

  const stats = useMemo(() => {
    if (!requisitions) return { total: 0, pending: 0, inTransit: 0 };
    return {
      total: requisitions.length,
      pending: requisitions.filter((r) => r.status === 'SUBMITTED').length,
      inTransit: requisitions.filter((r) => r.status === 'SHIPPED').length,
    };
  }, [requisitions]);

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const renderLoadingSkeleton = () => (
    <div className="p-10 text-center">
      <div
        className="skeleton w-[200px] h-[16px] mx-auto mb-3"
      />
      <div
        className="skeleton w-[300px] h-[12px] mx-auto"
        
      />
    </div>
  );

  // -------------------------------------------------------------------------
  // Page layout
  // -------------------------------------------------------------------------

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      {/* Page header */}
      <div
        className="flex items-center justify-between"
      >
        <div
          className="flex items-center gap-4"
        >
          <div
            className="font-[var(--font-mono)] text-sm font-bold tracking-[3px] text-[var(--color-text-bright)] uppercase"
          >
            REQUISITIONS
          </div>
          <div
            className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] flex items-center gap-3"
          >
            <span>{stats.total} TOTAL</span>
            <span
              className={stats.pending > 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-muted)]'}
            >
              {stats.pending} PENDING
            </span>
            <span
              className={stats.inTransit > 0 ? 'text-[#a78bfa]' : 'text-[var(--color-text-muted)]'}
            >
              {stats.inTransit} IN TRANSIT
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 py-[7px] px-3.5 font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] uppercase text-[var(--color-accent)] bg-[rgba(77,171,247,0.1)] border border-[var(--color-accent)] rounded-[var(--radius)] cursor-pointer transition-all duration-[var(--transition)]"
        >
          <Plus size={13} /> NEW REQUISITION
        </button>
      </div>

      {/* View mode toggle */}
      <div className="flex gap-0.5">
        {(['ACTIVE', 'ARCHIVED', 'ALL'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`py-1.5 px-3 font-[var(--font-mono)] text-[9px] tracking-[1px] border-0 bg-transparent cursor-pointer transition-all duration-[var(--transition)] ${
              viewMode === mode
                ? 'font-semibold border-b-2 border-b-[var(--color-accent)] text-[var(--color-accent)]'
                : 'font-normal border-b-2 border-b-transparent text-[var(--color-text-muted)]'
            }`}
          >
            {mode}
            {mode === 'ACTIVE' && (
              <span className="ml-1.5 text-[8px] font-bold text-[var(--color-success)]">
                {requisitions?.filter(r => ACTIVE_STATUSES.includes(r.status)).length ?? 0}
              </span>
            )}
            {mode === 'ARCHIVED' && (
              <span className="ml-1.5 text-[8px] font-bold text-[var(--color-text-muted)]">
                {requisitions?.filter(r => ARCHIVED_STATUSES.includes(r.status)).length ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div
        className="flex gap-0.5 border-b border-b-[var(--color-border)] pb-0"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-2 px-4 font-[var(--font-mono)] text-[10px] tracking-[1.5px] uppercase border-0 bg-transparent cursor-pointer mb-[-1px] transition-all duration-[var(--transition)] ${
              activeTab === tab.key
                ? 'font-semibold border-b-2 border-b-[var(--color-accent)] text-[var(--color-accent)]'
                : 'font-normal border-b-2 border-b-transparent text-[var(--color-text-muted)]'
            }`}
          >
            {tab.label}
            {tab.key === 'pending' && stats.pending > 0 && (
              <span
                className="ml-1.5 inline-block py-px px-1.5 rounded-[8px] text-[8px] font-bold bg-[var(--color-warning)] text-[#000] align-middle"
              >
                {stats.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'all' && (
        <Card title="ALL REQUISITIONS">
          {isLoading ? (
            renderLoadingSkeleton()
          ) : (
            <RequisitionTable
              requisitions={filteredRequisitions}
              onRefresh={() => refetch()}
            />
          )}
        </Card>
      )}

      {activeTab === 'pending' && (
        <div>
          {isLoading ? (
            renderLoadingSkeleton()
          ) : (
            <ApprovalQueue
              requisitions={filteredRequisitions}
              onRefresh={() => refetch()}
            />
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="flex flex-col gap-4">
          {analytics && (
            <>
              <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
                {[
                  { label: 'TOTAL', value: analytics.summary.total, color: 'var(--color-text-bright)' },
                  { label: 'ACTIVE', value: analytics.summary.active, color: 'var(--color-accent)' },
                  { label: 'FULFILLED', value: analytics.summary.fulfilled, color: 'var(--color-success)' },
                  { label: 'DENIED', value: analytics.summary.denied, color: 'var(--color-danger)' },
                  { label: 'CANCELED', value: analytics.summary.canceled, color: 'var(--color-text-muted)' },
                  { label: 'APPROVAL RATE', value: `${analytics.summary.approvalRate}%`, color: 'var(--color-warning)' },
                ].map((kpi) => (
                  <Card key={kpi.label} title={kpi.label}>
                    <div className="font-[var(--font-mono)] text-[28px] font-bold text-center py-2 px-0" style={{ color: kpi.color }}>
                      {kpi.value}
                    </div>
                  </Card>
                ))}
              </div>

              <Card title="STATUS BREAKDOWN">
                <div className="flex flex-col gap-2 py-2 px-0">
                  {Object.entries(analytics.byStatus).map(([status, count]) => {
                    const maxCount = Math.max(...Object.values(analytics.byStatus));
                    const pct = maxCount > 0 ? ((count as number) / maxCount) * 100 : 0;
                    return (
                      <div key={status} className="flex items-center gap-2.5">
                        <span className="font-[var(--font-mono)] text-[10px] font-semibold w-[100px] text-right text-[var(--color-text-muted)]">{status.replace(/_/g, ' ')}</span>
                        <div className="flex-1 h-[16px] bg-[var(--color-bg)] rounded-[2px] overflow-hidden">
                          <div className="h-full bg-[var(--color-accent)] rounded-[2px] transition-[width] duration-300 ease-in-out" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-[var(--font-mono)] text-[11px] font-bold w-[30px] text-[var(--color-text-bright)]">{count as number}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card title="FULFILLMENT METRICS">
                <div className="flex items-center gap-4 py-2 px-0">
                  <div className="text-center">
                    <div className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] uppercase">AVG FULFILLMENT TIME</div>
                    <div className="font-[var(--font-mono)] text-[28px] font-bold text-[var(--color-accent)]">{analytics.avgFulfillmentDays}d</div>
                  </div>
                </div>
              </Card>
            </>
          )}
          {!analytics && (
            <div className="p-10 text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]">
              Loading analytics...
            </div>
          )}
        </div>
      )}

      {activeTab === 'inventory' && (
        <InventoryPanel unitId={numericUnitId} />
      )}

      {/* Create modal */}
      <CreateRequisitionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        unitId={numericUnitId}
      />
    </div>
  );
}
