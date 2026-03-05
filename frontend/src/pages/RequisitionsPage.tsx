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
            display: 'flex',
            alignItems: 'center',
            gap: 16,
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
            REQUISITIONS
          </div>
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
            <span>{stats.total} TOTAL</span>
            <span
              style={{
                color: stats.pending > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)',
              }}
            >
              {stats.pending} PENDING
            </span>
            <span
              style={{
                color: stats.inTransit > 0 ? '#a78bfa' : 'var(--color-text-muted)',
              }}
            >
              {stats.inTransit} IN TRANSIT
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
            backgroundColor: 'rgba(77, 171, 247, 0.1)',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            transition: 'all var(--transition)',
          }}
        >
          <Plus size={13} /> NEW REQUISITION
        </button>
      </div>

      {/* View mode toggle */}
      <div style={{ display: 'flex', gap: 2 }}>
        {(['ACTIVE', 'ARCHIVED', 'ALL'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              padding: '5px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: viewMode === mode ? 600 : 400,
              letterSpacing: '1px',
              border: 'none',
              borderBottom: viewMode === mode ? '2px solid var(--color-accent)' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: viewMode === mode ? 'var(--color-accent)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'all var(--transition)',
            }}
          >
            {mode}
            {mode === 'ACTIVE' && (
              <span style={{ marginLeft: 6, fontSize: 8, fontWeight: 700, color: 'var(--color-success)' }}>
                {requisitions?.filter(r => ACTIVE_STATUSES.includes(r.status)).length ?? 0}
              </span>
            )}
            {mode === 'ARCHIVED' && (
              <span style={{ marginLeft: 6, fontSize: 8, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                {requisitions?.filter(r => ARCHIVED_STATUSES.includes(r.status)).length ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

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
            {tab.key === 'pending' && stats.pending > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  display: 'inline-block',
                  padding: '1px 5px',
                  borderRadius: 8,
                  fontSize: 8,
                  fontWeight: 700,
                  backgroundColor: 'var(--color-warning)',
                  color: '#000',
                  verticalAlign: 'middle',
                }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {analytics && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {[
                  { label: 'TOTAL', value: analytics.summary.total, color: 'var(--color-text-bright)' },
                  { label: 'ACTIVE', value: analytics.summary.active, color: 'var(--color-accent)' },
                  { label: 'FULFILLED', value: analytics.summary.fulfilled, color: 'var(--color-success)' },
                  { label: 'DENIED', value: analytics.summary.denied, color: 'var(--color-danger)' },
                  { label: 'CANCELED', value: analytics.summary.canceled, color: 'var(--color-text-muted)' },
                  { label: 'APPROVAL RATE', value: `${analytics.summary.approvalRate}%`, color: 'var(--color-warning)' },
                ].map((kpi) => (
                  <Card key={kpi.label} title={kpi.label}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: kpi.color, textAlign: 'center', padding: '8px 0' }}>
                      {kpi.value}
                    </div>
                  </Card>
                ))}
              </div>

              <Card title="STATUS BREAKDOWN">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
                  {Object.entries(analytics.byStatus).map(([status, count]) => {
                    const maxCount = Math.max(...Object.values(analytics.byStatus));
                    const pct = maxCount > 0 ? ((count as number) / maxCount) * 100 : 0;
                    return (
                      <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, width: 100, textAlign: 'right', color: 'var(--color-text-muted)' }}>{status}</span>
                        <div style={{ flex: 1, height: 16, backgroundColor: 'var(--color-bg)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--color-accent)', borderRadius: 2, transition: 'width 0.3s ease' }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, width: 30, color: 'var(--color-text-bright)' }}>{count as number}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card title="FULFILLMENT METRICS">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', color: 'var(--color-text-muted)', textTransform: 'uppercase' as const }}>AVG FULFILLMENT TIME</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: 'var(--color-accent)' }}>{analytics.avgFulfillmentDays}d</div>
                  </div>
                </div>
              </Card>
            </>
          )}
          {!analytics && (
            <div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}>
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
