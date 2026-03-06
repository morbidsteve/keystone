// =============================================================================
// PersonnelPage — Personnel & Manning dashboard
// =============================================================================

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDashboardStore } from '@/stores/dashboardStore';
import Card from '@/components/ui/Card';
import AlphaRosterTable from '@/components/personnel/AlphaRosterTable';
import StrengthPanel from '@/components/personnel/StrengthPanel';
import BilletTracker from '@/components/personnel/BilletTracker';
import QualificationMatrix from '@/components/personnel/QualificationMatrix';
import EASTimeline from '@/components/personnel/EASTimeline';
import {
  getPersonnelList,
  getUnitStrength,
  getMOSFill,
  getQualificationStatus,
  getPersonnelReadiness,
  getUpcomingLosses,
  getBillets,
  getManningSnapshots,
} from '@/api/personnel';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'roster' as const, label: 'ALPHA ROSTER' },
  { key: 'strength' as const, label: 'STRENGTH' },
  { key: 'billets' as const, label: 'BILLETS' },
  { key: 'quals' as const, label: 'QUALIFICATIONS' },
  { key: 'eas' as const, label: 'EAS TIMELINE' },
];

type TabKey = (typeof TABS)[number]['key'];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function PersonnelPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('roster');
  const selectedUnitId = useDashboardStore((s) => s.selectedUnitId);
  const queryClient = useQueryClient();

  const numericUnitId = useMemo(() => {
    if (!selectedUnitId) return 4; // default to 1/1 Bn
    const parsed = parseInt(selectedUnitId, 10);
    return isNaN(parsed) ? 4 : parsed;
  }, [selectedUnitId]);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const {
    data: personnel,
    isLoading: personnelLoading,
  } = useQuery({
    queryKey: ['personnel-list', numericUnitId],
    queryFn: () => getPersonnelList(numericUnitId),
  });

  const {
    data: strength,
    isLoading: strengthLoading,
  } = useQuery({
    queryKey: ['personnel-strength', numericUnitId],
    queryFn: () => getUnitStrength(numericUnitId),
  });

  const {
    data: readiness,
  } = useQuery({
    queryKey: ['personnel-readiness', numericUnitId],
    queryFn: () => getPersonnelReadiness(numericUnitId),
  });

  const {
    data: mosFill,
    isLoading: mosFillLoading,
  } = useQuery({
    queryKey: ['personnel-mos-fill', numericUnitId],
    queryFn: () => getMOSFill(numericUnitId),
    enabled: activeTab === 'strength',
  });

  const {
    data: snapshots,
  } = useQuery({
    queryKey: ['personnel-snapshots', numericUnitId],
    queryFn: () => getManningSnapshots(numericUnitId),
    enabled: activeTab === 'strength',
  });

  const {
    data: billets,
    isLoading: billetsLoading,
  } = useQuery({
    queryKey: ['personnel-billets', numericUnitId],
    queryFn: () => getBillets(numericUnitId),
    enabled: activeTab === 'billets',
  });

  const {
    data: quals,
    isLoading: qualsLoading,
  } = useQuery({
    queryKey: ['personnel-quals', numericUnitId],
    queryFn: () => getQualificationStatus(numericUnitId),
    enabled: activeTab === 'quals',
  });

  const {
    data: readinessDetail,
  } = useQuery({
    queryKey: ['personnel-readiness-detail', numericUnitId],
    queryFn: () => getPersonnelReadiness(numericUnitId),
    enabled: activeTab === 'quals',
  });

  const {
    data: losses,
    isLoading: lossesLoading,
  } = useQuery({
    queryKey: ['personnel-losses', numericUnitId],
    queryFn: () => getUpcomingLosses(numericUnitId, 90),
    enabled: activeTab === 'eas',
  });

  // -------------------------------------------------------------------------
  // Refresh callbacks
  // -------------------------------------------------------------------------

  const refreshPersonnel = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['personnel-list'] });
  }, [queryClient]);

  const refreshBillets = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['personnel-billets'] });
  }, [queryClient]);

  // -------------------------------------------------------------------------
  // ESC handler
  // -------------------------------------------------------------------------

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      // placeholder for modal close
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
    <div className="p-10 text-center">
      <div
        className="skeleton w-[200px] h-[16px] mx-auto mb-3"
      />
      <div
        className="skeleton w-[300px] h-[12px] mx-auto"
        
      />
    </div>
  );

  // P-Rating color
  const pRatingColor = (rating: string): string => {
    switch (rating) {
      case 'P1': return '#4ade80';
      case 'P2': return '#60a5fa';
      case 'P3': return '#fbbf24';
      case 'P4': return '#fb923c';
      case 'P5': return '#f87171';
      default: return '#94a3b8';
    }
  };

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
          className="font-[var(--font-mono)] text-sm font-bold tracking-[3px] text-[var(--color-text-bright)] uppercase"
        >
          PERSONNEL &amp; MANNING
        </div>
        {readiness && (
          <div
            className="flex items-center gap-2"
          >
            <span
              className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]"
            >
              P-RATING:
            </span>
            <span
              className="inline-block py-0.5 px-2 rounded-[2px] font-[var(--font-mono)] text-[11px] font-bold" style={{ color: pRatingColor(readiness.p_rating), backgroundColor: `${pRatingColor(readiness.p_rating)}15`, border: `1px solid ${pRatingColor(readiness.p_rating)}40` }}
            >
              {readiness.p_rating}
            </span>
          </div>
        )}
      </div>

      {/* KPI Summary Row */}
      {strengthLoading ? (
        <div className="flex gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="skeleton h-[80px] rounded-[var(--radius)] flex-1"
            />
          ))}
        </div>
      ) : strength ? (
        <div
          className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]"
        >
          {[
            { label: 'AUTHORIZED', value: strength.total_authorized, color: 'var(--color-text-bright)' },
            { label: 'ASSIGNED', value: strength.total_assigned, color: '#60a5fa' },
            { label: 'PRESENT', value: strength.present_for_duty, color: '#4ade80' },
            {
              label: 'FILL RATE',
              value: `${strength.fill_rate_pct.toFixed(1)}%`,
              color: strength.fill_rate_pct >= 90 ? '#4ade80' : strength.fill_rate_pct >= 80 ? '#fbbf24' : '#f87171',
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="py-3.5 px-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)]"
            >
              <div
                className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] uppercase mb-1.5"
              >
                {kpi.label}
              </div>
              <div
                className="font-[var(--font-mono)] text-[22px] font-bold" style={{ color: kpi.color }}
              >
                {kpi.value}
              </div>
            </div>
          ))}
        </div>
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
      {activeTab === 'roster' && (
        <Card title="ALPHA ROSTER">
          {personnelLoading ? (
            renderLoadingSkeleton()
          ) : (
            <AlphaRosterTable personnel={personnel ?? []} onRefresh={refreshPersonnel} />
          )}
        </Card>
      )}

      {activeTab === 'strength' && (
        <Card title="UNIT STRENGTH &amp; MOS FILL">
          {mosFillLoading ? (
            renderLoadingSkeleton()
          ) : mosFill ? (
            <StrengthPanel mosFill={mosFill} snapshots={snapshots ?? []} />
          ) : (
            <div
              className="p-10 text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
            >
              No strength data available
            </div>
          )}
        </Card>
      )}

      {activeTab === 'billets' && (
        <Card title="BILLET TRACKER">
          {billetsLoading ? (
            renderLoadingSkeleton()
          ) : (
            <BilletTracker billets={billets ?? []} onRefresh={refreshBillets} personnel={personnel ?? []} />
          )}
        </Card>
      )}

      {activeTab === 'quals' && (
        <Card title="QUALIFICATION MATRIX">
          {qualsLoading ? (
            renderLoadingSkeleton()
          ) : quals && readinessDetail ? (
            <QualificationMatrix quals={quals} readiness={readinessDetail} />
          ) : (
            <div
              className="p-10 text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
            >
              No qualification data available
            </div>
          )}
        </Card>
      )}

      {activeTab === 'eas' && (
        <Card title="EAS TIMELINE (90 DAYS)">
          {lossesLoading ? (
            renderLoadingSkeleton()
          ) : (
            <EASTimeline losses={losses ?? []} />
          )}
        </Card>
      )}
    </div>
  );
}
