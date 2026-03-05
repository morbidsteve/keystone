// =============================================================================
// TransportationPage — Transportation & Movement dashboard (4-tab layout)
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ConvoyMap from '@/components/transportation/ConvoyMap';
import MovementTracker from '@/components/transportation/MovementTracker';
import ThroughputChart from '@/components/transportation/ThroughputChart';
import RoutePlannerModal from '@/components/transportation/RoutePlannerModal';
import MovementDetailModal from '@/components/transportation/MovementDetailModal';
import ActiveConvoyTracker from '@/components/transportation/ActiveConvoyTracker';
import ConvoyPlanList from '@/components/transportation/ConvoyPlanList';
import ConvoyPlanDetail from '@/components/transportation/ConvoyPlanDetail';
import MarchTableView from '@/components/transportation/MarchTableView';
import LiftRequestBoard from '@/components/transportation/LiftRequestBoard';
import MovementHistoryTable from '@/components/transportation/MovementHistoryTable';
import { mockApi } from '@/api/mockClient';
import {
  getConvoyPlans,
  approveConvoyPlan,
  executeConvoyPlan,
  cancelConvoyPlan,
  getMarchTable,
  getLiftRequests,
  getActiveMovements,
  getMovementHistory,
} from '@/api/transportation';
import type { Movement, ConvoyPlan, MarchTableData } from '@/lib/types';
import { useDashboardStore } from '@/stores/dashboardStore';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'active' as const, label: 'ACTIVE CONVOYS' },
  { key: 'planning' as const, label: 'CONVOY PLANNING' },
  { key: 'lift' as const, label: 'LIFT REQUESTS' },
  { key: 'history' as const, label: 'MOVEMENT HISTORY' },
];

type TabKey = (typeof TABS)[number]['key'];

// Convoy Planning sub-views
type PlanningView = 'list' | 'detail' | 'marchTable';

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function TransportationPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const [movements, setMovements] = useState<Movement[]>([]);
  const [selectedConvoyId, setSelectedConvoyId] = useState<string | null>(null);
  const [routePlannerOpen, setRoutePlannerOpen] = useState(false);
  const [detailMovement, setDetailMovement] = useState<Movement | null>(null);

  // Planning sub-view state
  const [planningView, setPlanningView] = useState<PlanningView>('list');
  const [selectedPlan, setSelectedPlan] = useState<ConvoyPlan | null>(null);
  const [marchTableData, setMarchTableData] = useState<MarchTableData | null>(null);
  const [marchTablePlanName, setMarchTablePlanName] = useState('');

  const selectedUnitId = useDashboardStore((s) => s.selectedUnitId);
  const queryClient = useQueryClient();

  // -------------------------------------------------------------------------
  // Legacy movements for Active tab (ConvoyMap + MovementTracker)
  // -------------------------------------------------------------------------

  useEffect(() => {
    mockApi.getMovements({ unitId: selectedUnitId ?? undefined }).then(setMovements);
  }, [selectedUnitId]);

  const handleSaveRoute = async (data: Partial<Movement>) => {
    await mockApi.createMovement(data);
    const updated = await mockApi.getMovements({ unitId: selectedUnitId ?? undefined });
    setMovements(updated);
    setRoutePlannerOpen(false);
  };

  // -------------------------------------------------------------------------
  // Active Convoy Tracker data
  // -------------------------------------------------------------------------

  const {
    data: activeMovements,
    isLoading: activeMovementsLoading,
  } = useQuery({
    queryKey: ['active-movements'],
    queryFn: () => getActiveMovements(),
    enabled: activeTab === 'active',
  });

  // -------------------------------------------------------------------------
  // Convoy Plans data
  // -------------------------------------------------------------------------

  const {
    data: convoyPlans,
    isLoading: plansLoading,
  } = useQuery({
    queryKey: ['convoy-plans'],
    queryFn: () => getConvoyPlans(),
    enabled: activeTab === 'planning',
  });

  const approveMutation = useMutation({
    mutationFn: (planId: number) => approveConvoyPlan(planId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['convoy-plans'] }),
  });

  const executeMutation = useMutation({
    mutationFn: (planId: number) => executeConvoyPlan(planId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['convoy-plans'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (planId: number) => cancelConvoyPlan(planId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['convoy-plans'] }),
  });

  const handleSelectPlan = (plan: ConvoyPlan) => {
    setSelectedPlan(plan);
    setPlanningView('detail');
  };

  const handleOpenMarchTable = async (planId: number) => {
    const data = await getMarchTable(planId);
    setMarchTableData(data);
    setMarchTablePlanName(selectedPlan?.name ?? 'Convoy Plan');
    setPlanningView('marchTable');
  };

  const handleBackToList = () => {
    setPlanningView('list');
    setSelectedPlan(null);
    setMarchTableData(null);
  };

  const handleBackToDetail = () => {
    setPlanningView('detail');
    setMarchTableData(null);
  };

  // -------------------------------------------------------------------------
  // Lift Requests data
  // -------------------------------------------------------------------------

  const {
    data: liftRequests,
    isLoading: liftRequestsLoading,
  } = useQuery({
    queryKey: ['lift-requests'],
    queryFn: () => getLiftRequests(),
    enabled: activeTab === 'lift',
  });

  // -------------------------------------------------------------------------
  // Movement History data
  // -------------------------------------------------------------------------

  const {
    data: movementHistory,
    isLoading: historyLoading,
  } = useQuery({
    queryKey: ['movement-history'],
    queryFn: () => getMovementHistory(),
    enabled: activeTab === 'history',
  });

  // -------------------------------------------------------------------------
  // ESC handler
  // -------------------------------------------------------------------------

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setRoutePlannerOpen(false);
        setDetailMovement(null);
      }
    },
    [],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
          TRANSPORTATION
        </div>
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
            onClick={() => {
              setActiveTab(tab.key);
              // Reset planning sub-view when switching tabs
              if (tab.key === 'planning') {
                setPlanningView('list');
                setSelectedPlan(null);
                setMarchTableData(null);
              }
            }}
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

      {/* ================================================================= */}
      {/* Tab 1: ACTIVE CONVOYS */}
      {/* ================================================================= */}
      {activeTab === 'active' && (
        <>
          {/* Convoy Map - full width */}
          <ConvoyMap
            movements={movements}
            selectedConvoyId={selectedConvoyId}
            onSelectConvoy={setSelectedConvoyId}
            onOpenRoutePlanner={() => setRoutePlannerOpen(true)}
            onViewDetail={(mov) => setDetailMovement(mov)}
            height="45vh"
          />

          {/* Active Convoy Tracker */}
          <ActiveConvoyTracker
            movements={activeMovements ?? []}
            isLoading={activeMovementsLoading}
          />

          {/* Bottom section - 2 columns */}
          <div className="grid-responsive-2col">
            <MovementTracker
              movements={movements}
              selectedConvoyId={selectedConvoyId}
              onSelectConvoy={setSelectedConvoyId}
              onViewDetail={(mov) => setDetailMovement(mov)}
            />
            <ThroughputChart />
          </div>

          {/* Route Planner Modal */}
          <RoutePlannerModal
            isOpen={routePlannerOpen}
            onClose={() => setRoutePlannerOpen(false)}
            onSaveRoute={handleSaveRoute}
          />

          {/* Movement Detail Modal */}
          <MovementDetailModal
            movement={detailMovement}
            onClose={() => setDetailMovement(null)}
          />
        </>
      )}

      {/* ================================================================= */}
      {/* Tab 2: CONVOY PLANNING */}
      {/* ================================================================= */}
      {activeTab === 'planning' && (
        <>
          {planningView === 'list' && (
            <ConvoyPlanList
              plans={convoyPlans ?? []}
              isLoading={plansLoading}
              onSelectPlan={handleSelectPlan}
              onCreatePlan={() => {
                // Placeholder — could open a create modal
              }}
              onApprovePlan={(id) => approveMutation.mutate(id)}
              onExecutePlan={(id) => executeMutation.mutate(id)}
              onCancelPlan={(id) => cancelMutation.mutate(id)}
            />
          )}

          {planningView === 'detail' && selectedPlan && (
            <ConvoyPlanDetail
              plan={selectedPlan}
              onBack={handleBackToList}
              onOpenMarchTable={handleOpenMarchTable}
              onApprovePlan={(id) => {
                approveMutation.mutate(id);
                handleBackToList();
              }}
              onExecutePlan={(id) => {
                executeMutation.mutate(id);
                handleBackToList();
              }}
              onCancelPlan={(id) => {
                cancelMutation.mutate(id);
                handleBackToList();
              }}
            />
          )}

          {planningView === 'marchTable' && marchTableData && (
            <MarchTableView
              marchTable={marchTableData}
              planName={marchTablePlanName}
              onBack={handleBackToDetail}
            />
          )}
        </>
      )}

      {/* ================================================================= */}
      {/* Tab 3: LIFT REQUESTS */}
      {/* ================================================================= */}
      {activeTab === 'lift' && (
        <LiftRequestBoard
          requests={liftRequests ?? []}
          isLoading={liftRequestsLoading}
          onCreateRequest={() => {
            // Placeholder — could open a create modal
          }}
        />
      )}

      {/* ================================================================= */}
      {/* Tab 4: MOVEMENT HISTORY */}
      {/* ================================================================= */}
      {activeTab === 'history' && (
        <MovementHistoryTable
          records={movementHistory ?? []}
          isLoading={historyLoading}
        />
      )}
    </div>
  );
}
