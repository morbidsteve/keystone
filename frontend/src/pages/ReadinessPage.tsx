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

  const renderError = () => (
    <div
      style={{
        padding: 40,
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--color-danger)',
      }}
    >
      Failed to load readiness data. {String(snapshotError)}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Page layout
  // ---------------------------------------------------------------------------

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 16,
              }}
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                backgroundColor: 'rgba(251, 191, 36, 0.08)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
                borderRadius: 'var(--radius)',
              }}
            >
              <AlertTriangle size={16} style={{ color: '#fbbf24', flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: '#fbbf24',
                  lineHeight: 1.4,
                }}
              >
                <strong>LIMITING FACTOR:</strong> {snapshot.limitingFactor}
              </span>
            </div>
          )}
        </>
      ) : null}

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
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Rating summary grid */}
          {snapshot && (
            <Card title="DRRS RATINGS">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 12,
                }}
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
                    style={{
                      padding: 12,
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      cursor: item.domain ? 'pointer' : 'default',
                      transition: 'background-color var(--transition)',
                    }}
                    onMouseEnter={(e) => {
                      if (item.domain) e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg)';
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {item.label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <RatingBadge rating={item.rating} />
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--color-text-bright)',
                        }}
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
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-text)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {snapshot.notes}
              </p>
            </Card>
          )}

          {/* Dashboard cards */}
          {dashboard && (
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: 'var(--color-text-muted)',
                  marginBottom: 10,
                }}
              >
                ALL UNITS OVERVIEW
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: 12,
                }}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Show components toggle */}
              <button
                onClick={() => setShowComponents(!showComponents)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius)',
                  border: `1px solid ${showComponents ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  backgroundColor: showComponents ? 'rgba(77, 171, 247, 0.1)' : 'transparent',
                  color: showComponents ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                COMPONENTS
              </button>
              {/* Time range selector */}
              {TREND_RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setTrendDays(r.value)}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    padding: '3px 8px',
                    borderRadius: 'var(--radius)',
                    border: `1px solid ${trendDays === r.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    backgroundColor:
                      trendDays === r.value
                        ? 'rgba(77, 171, 247, 0.1)'
                        : 'transparent',
                    color:
                      trendDays === r.value
                        ? 'var(--color-accent)'
                        : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
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
              style={{
                padding: 40,
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-text-muted)',
              }}
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
              style={{
                padding: 40,
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-text-muted)',
              }}
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
                style={{
                  padding: 40,
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                }}
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
