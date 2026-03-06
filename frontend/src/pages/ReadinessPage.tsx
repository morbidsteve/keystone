// =============================================================================
// ReadinessPage — Full readiness dashboard with gauges, trends, strength, rollup
// =============================================================================

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboardStore';
import Card from '@/components/ui/Card';
import ReadinessGauge from '@/components/readiness/ReadinessGauge';
import ReadinessCard from '@/components/readiness/ReadinessCard';
import ReadinessTrendChart from '@/components/readiness/ReadinessTrendChart';
import StrengthTable from '@/components/readiness/StrengthTable';
import ReadinessRollupTree from '@/components/readiness/ReadinessRollupTree';
import RatingBadge from '@/components/readiness/RatingBadge';
import DrillDownPanel from '@/components/readiness/DrillDownPanel';
import {
  getReadinessSnapshot,
  getReadinessHistory,
  getReadinessRollup,
  getReadinessDashboard,
  getUnitStrength,
} from '@/api/readiness';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'overview' as const, label: 'OVERVIEW' },
  { key: 'trend' as const, label: 'TREND' },
  { key: 'strength' as const, label: 'STRENGTH' },
  { key: 'subordinates' as const, label: 'SUBORDINATES' },
];

type TabKey = (typeof TABS)[number]['key'];

const TREND_RANGES = [
  { label: '30D', value: 30 },
  { label: '60D', value: 60 },
  { label: '90D', value: 90 },
];

// ---------------------------------------------------------------------------
// Unit name lookup
// ---------------------------------------------------------------------------

function getUnitName(id: number, dashboardUnits?: Array<{ unitId: number; unitName: string }>): string {
  const found = dashboardUnits?.find((u) => u.unitId === id);
  return found?.unitName ?? `Unit ${id}`;
}

type DrillDownDomain = 'equipment' | 'supply' | 'personnel' | 'training';

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function ReadinessPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [trendDays, setTrendDays] = useState(30);
  const [showComponents, setShowComponents] = useState(false);
  const [activeDrillDown, setActiveDrillDown] = useState<DrillDownDomain | null>(null);

  const selectedUnitId = useDashboardStore((s) => s.selectedUnitId);

  // Resolve numeric unit ID (for API calls)
  const numericUnitId = useMemo(() => {
    if (!selectedUnitId) return 1; // default to I MEF
    const parsed = parseInt(selectedUnitId, 10);
    return isNaN(parsed) ? 1 : parsed;
  }, [selectedUnitId]);

  // Fetch current snapshot
  const {
    data: snapshot,
    isLoading: snapshotLoading,
    error: snapshotError,
  } = useQuery({
    queryKey: ['readiness-snapshot', numericUnitId],
    queryFn: () => getReadinessSnapshot(numericUnitId),
  });

  // Fetch trend history
  const {
    data: history,
    isLoading: historyLoading,
  } = useQuery({
    queryKey: ['readiness-history', numericUnitId, trendDays],
    queryFn: () => getReadinessHistory(numericUnitId, trendDays),
  });

  // Fetch rollup
  const {
    data: rollup,
    isLoading: rollupLoading,
  } = useQuery({
    queryKey: ['readiness-rollup', numericUnitId],
    queryFn: () => getReadinessRollup(numericUnitId),
  });

  // Fetch strength
  const {
    data: strength,
    isLoading: strengthLoading,
  } = useQuery({
    queryKey: ['unit-strength', numericUnitId],
    queryFn: () => getUnitStrength(numericUnitId),
  });

  // Fetch dashboard overview
  const {
    data: dashboard,
  } = useQuery({
    queryKey: ['readiness-dashboard'],
    queryFn: () => getReadinessDashboard(),
  });

  // Convert history to trend chart data
  const trendData = useMemo(() => {
    if (!history) return [];
    return history.map((s) => ({
      date: s.snapshotDate,
      overall: s.overallReadinessPct,
      equipment: s.equipmentReadinessPct ?? undefined,
      supply: s.supplyReadinessPct ?? undefined,
      personnel: s.personnelFillPct ?? undefined,
    }));
  }, [history]);

  // ESC key to close drill-down panel
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setActiveDrillDown(null);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

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

  const renderError = () => (
    <div
      className="p-10 text-center font-[var(--font-mono)] text-xs text-[var(--color-danger)]"
    >
      Failed to load readiness data. {String(snapshotError)}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Page layout
  // ---------------------------------------------------------------------------

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      {/* Gauges overview row */}
      {snapshotLoading ? (
        renderLoadingSkeleton()
      ) : snapshotError ? (
        renderError()
      ) : snapshot ? (
        <>
          {/* 5 Gauges */}
          <Card title={`READINESS \u2014 ${getUnitName(numericUnitId, dashboard?.units)}`}>
            <div
              className="flex justify-around items-start flex-wrap gap-4"
            >
              <ReadinessGauge
                percentage={snapshot.overallReadinessPct}
                rating={snapshot.cRating}
                size={90}
                label="Overall"
                domain="overall"
                onDrillDown={setActiveDrillDown}
              />
              <ReadinessGauge
                percentage={snapshot.equipmentReadinessPct ?? 0}
                rating={snapshot.rRating}
                size={80}
                label="Equipment"
                domain="equipment"
                onDrillDown={setActiveDrillDown}
              />
              <ReadinessGauge
                percentage={snapshot.supplyReadinessPct ?? 0}
                rating={snapshot.sRating}
                size={80}
                label="Supply"
                domain="supply"
                onDrillDown={setActiveDrillDown}
              />
              <ReadinessGauge
                percentage={snapshot.personnelFillPct ?? 0}
                rating={snapshot.pRating}
                size={80}
                label="Personnel"
                domain="personnel"
                onDrillDown={setActiveDrillDown}
              />
              <ReadinessGauge
                percentage={snapshot.trainingReadinessPct ?? 0}
                rating={snapshot.tRating}
                size={80}
                label="Training"
                domain="training"
                onDrillDown={setActiveDrillDown}
              />
            </div>
          </Card>

          {/* Drill-down detail panel */}
          {activeDrillDown && (
            <DrillDownPanel
              unitId={numericUnitId}
              domain={activeDrillDown}
              onClose={() => setActiveDrillDown(null)}
            />
          )}

          {/* Limiting factor alert banner */}
          {snapshot.limitingFactor && (
            <div
              className="flex items-center gap-2.5 py-2.5 px-4 bg-[rgba(251,191,36,0.08)] rounded-[var(--radius)]" style={{ border: '1px solid rgba(251, 191, 36, 0.2)' }}
            >
              <AlertTriangle size={16} className="text-[#fbbf24] shrink-0" />
              <span
                className="font-[var(--font-mono)] text-[11px] text-[#fbbf24] leading-[1.4]"
              >
                <strong>LIMITING FACTOR:</strong> {snapshot.limitingFactor}
              </span>
            </div>
          )}
        </>
      ) : null}

      {/* Tabs */}
      <div
        className="flex gap-0.5 border-b border-b-[var(--color-border)] pb-0"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="py-2 px-4 font-[var(--font-mono)] text-[10px] tracking-[1.5px] uppercase border-0 bg-transparent cursor-pointer mb-[-1px]" style={{ fontWeight: activeTab === tab.key ? 600 : 400, borderBottom: activeTab === tab.key
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent', color: activeTab === tab.key
                  ? 'var(--color-accent)'
                  : 'var(--color-text-muted)', transition: 'all var(--transition)' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-4">
          {/* Rating summary grid */}
          {snapshot && (
            <Card title="DRRS RATINGS">
              <div
                className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]"
              >
                {[
                  { label: 'COMBINED', rating: snapshot.cRating, pct: snapshot.overallReadinessPct, domain: null as DrillDownDomain | null },
                  { label: 'EQUIPMENT', rating: snapshot.rRating, pct: snapshot.equipmentReadinessPct, domain: 'equipment' as DrillDownDomain | null },
                  { label: 'SUPPLY', rating: snapshot.sRating, pct: snapshot.supplyReadinessPct, domain: 'supply' as DrillDownDomain | null },
                  { label: 'PERSONNEL', rating: snapshot.pRating, pct: snapshot.personnelFillPct, domain: 'personnel' as DrillDownDomain | null },
                  { label: 'TRAINING', rating: snapshot.tRating, pct: snapshot.trainingReadinessPct, domain: 'training' as DrillDownDomain | null },
                ].map((item) => (
                  <div
                    key={item.label}
                    onClick={() => item.domain && setActiveDrillDown(item.domain)}
                    className="p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] flex flex-col gap-2" style={{ cursor: item.domain ? 'pointer' : 'default', transition: 'background-color var(--transition)' }}
                    onMouseEnter={(e) => {
                      if (item.domain) e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg)';
                    }}
                  >
                    <span
                      className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)]"
                    >
                      {item.label}
                    </span>
                    <div className="flex items-center justify-between">
                      <RatingBadge rating={item.rating} />
                      <span
                        className="font-[var(--font-mono)] text-sm font-bold text-[var(--color-text-bright)]"
                      >
                        {item.pct != null ? `${Math.round(item.pct)}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Notes */}
          {snapshot?.notes && (
            <Card title="COMMANDER NOTES">
              <p
                className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)] leading-relaxed m-0"
              >
                {snapshot.notes}
              </p>
            </Card>
          )}

          {/* Dashboard cards */}
          {dashboard && (
            <div>
              <div
                className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-2.5"
              >
                ALL UNITS OVERVIEW
              </div>
              <div
                className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]"
              >
                {dashboard.units.map((u) => (
                  <ReadinessCard
                    key={u.unitId}
                    unitId={u.unitId}
                    unitName={u.unitName}
                    cRating={u.cRating}
                    overallReadinessPct={u.overallReadinessPct}
                    limitingFactor={u.limitingFactor ?? undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'trend' && (
        <Card
          title="READINESS TREND"
          headerRight={
            <div className="flex items-center gap-2">
              {/* Show components toggle */}
              <button
                onClick={() => setShowComponents(!showComponents)}
                className="font-[var(--font-mono)] text-[9px] py-[3px] px-2 rounded-[var(--radius)] cursor-pointer uppercase tracking-[1px]" style={{ border: `1px solid ${showComponents ? 'var(--color-accent)' : 'var(--color-border)'}`, backgroundColor: showComponents ? 'rgba(77, 171, 247, 0.1)' : 'transparent', color: showComponents ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
              >
                COMPONENTS
              </button>
              {/* Time range selector */}
              {TREND_RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setTrendDays(r.value)}
                  className="font-[var(--font-mono)] text-[9px] py-[3px] px-2 rounded-[var(--radius)] cursor-pointer uppercase tracking-[1px]" style={{ border: `1px solid ${trendDays === r.value ? 'var(--color-accent)' : 'var(--color-border)'}`, backgroundColor: trendDays === r.value
                        ? 'rgba(77, 171, 247, 0.1)'
                        : 'transparent', color: trendDays === r.value
                        ? 'var(--color-accent)'
                        : 'var(--color-text-muted)' }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          }
        >
          {historyLoading ? (
            renderLoadingSkeleton()
          ) : trendData.length > 0 ? (
            <ReadinessTrendChart
              data={trendData}
              showComponents={showComponents}
              height={320}
            />
          ) : (
            <div
              className="p-10 text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
            >
              No trend data available
            </div>
          )}
        </Card>
      )}

      {activeTab === 'strength' && (
        <Card title="PERSONNEL STRENGTH">
          {strengthLoading ? (
            renderLoadingSkeleton()
          ) : strength ? (
            <StrengthTable strength={strength} />
          ) : (
            <div
              className="p-10 text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
            >
              No strength data available
            </div>
          )}
        </Card>
      )}

      {activeTab === 'subordinates' && (
        <div>
          {rollupLoading ? (
            renderLoadingSkeleton()
          ) : rollup && rollup.subordinates.length > 0 ? (
            <ReadinessRollupTree
              parentUnitName={getUnitName(numericUnitId, dashboard?.units)}
              subordinates={rollup.subordinates}
              avgOverallPct={rollup.avgOverallReadinessPct}
            />
          ) : (
            <Card title="SUBORDINATE UNITS">
              <div
                className="p-10 text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
              >
                No subordinate units available for this echelon
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
