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
import { getRequisitions } from '@/api/requisitions';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'all' as const, label: 'ALL REQUISITIONS' },
  { key: 'pending' as const, label: 'PENDING APPROVAL' },
  { key: 'inventory' as const, label: 'INVENTORY' },
];

type TabKey = (typeof TABS)[number]['key'];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function RequisitionsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

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
              requisitions={requisitions ?? []}
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
              requisitions={requisitions ?? []}
              onRefresh={() => refetch()}
            />
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
