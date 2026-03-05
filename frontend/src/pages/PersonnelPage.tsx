// =============================================================================
// PersonnelPage — Personnel & Manning dashboard
// =============================================================================

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
          PERSONNEL &amp; MANNING
        </div>
        {readiness && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-text-muted)',
              }}
            >
              P-RATING:
            </span>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 2,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 700,
                color: pRatingColor(readiness.p_rating),
                backgroundColor: `${pRatingColor(readiness.p_rating)}15`,
                border: `1px solid ${pRatingColor(readiness.p_rating)}40`,
              }}
            >
              {readiness.p_rating}
            </span>
          </div>
        )}
      </div>

      {/* KPI Summary Row */}
      {strengthLoading ? (
        <div style={{ display: 'flex', gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ flex: '1 1 0', height: 80, borderRadius: 'var(--radius)' }}
            />
          ))}
        </div>
      ) : strength ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
          }}
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
              style={{
                padding: '14px 16px',
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '1.5px',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                {kpi.label}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 22,
                  fontWeight: 700,
                  color: kpi.color,
                }}
              >
                {kpi.value}
              </div>
            </div>
          ))}
        </div>
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
      {activeTab === 'roster' && (
        <Card title="ALPHA ROSTER">
          {personnelLoading ? (
            renderLoadingSkeleton()
          ) : (
            <AlphaRosterTable personnel={personnel ?? []} />
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

      {activeTab === 'billets' && (
        <Card title="BILLET TRACKER">
          {billetsLoading ? (
            renderLoadingSkeleton()
          ) : (
            <BilletTracker billets={billets ?? []} />
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
              style={{
                padding: 40,
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-text-muted)',
              }}
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
