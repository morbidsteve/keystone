// =============================================================================
// MedicalPage — Medical Logistics & CASEVAC dashboard
// =============================================================================

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, AlertTriangle, Activity, Building, Plus } from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboardStore';
import Card from '@/components/ui/Card';
import CasualtyTable from '@/components/medical/CasualtyTable';
import NineLineForm from '@/components/medical/NineLineForm';
import MTFStatusCards from '@/components/medical/MTFStatusCards';
import BloodBankDashboard from '@/components/medical/BloodBankDashboard';
import BurnRateTable from '@/components/medical/BurnRateTable';
import {
  getCasualties,
  getFacilities,
  getBloodProducts,
  getBurnRates,
  getPERSTATMedical,
} from '@/api/medical';
import { CasualtyReportStatus, CASEVACPrecedence, MTFStatus } from '@/lib/types';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'casualties' as const, label: 'CASUALTIES' },
  { key: 'nineline' as const, label: '9-LINE' },
  { key: 'facilities' as const, label: 'FACILITIES' },
  { key: 'bloodbank' as const, label: 'BLOOD BANK' },
  { key: 'burnrates' as const, label: 'BURN RATES' },
];

type TabKey = (typeof TABS)[number]['key'];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function MedicalPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('casualties');
  const selectedUnitId = useDashboardStore((s) => s.selectedUnitId);

  const numericUnitId = useMemo(() => {
    if (!selectedUnitId) return 4;
    const parsed = parseInt(selectedUnitId, 10);
    return isNaN(parsed) ? 4 : parsed;
  }, [selectedUnitId]);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const {
    data: casualties,
    isLoading: casualtiesLoading,
  } = useQuery({
    queryKey: ['medical-casualties', numericUnitId],
    queryFn: () => getCasualties(numericUnitId),
  });

  const {
    data: facilities,
    isLoading: facilitiesLoading,
  } = useQuery({
    queryKey: ['medical-facilities'],
    queryFn: () => getFacilities(),
  });

  const {
    data: bloodProducts,
    isLoading: bloodLoading,
  } = useQuery({
    queryKey: ['medical-blood-products'],
    queryFn: () => getBloodProducts(),
    enabled: activeTab === 'bloodbank',
  });

  const {
    data: burnRates,
    isLoading: burnRatesLoading,
  } = useQuery({
    queryKey: ['medical-burn-rates', numericUnitId],
    queryFn: () => getBurnRates(numericUnitId),
    enabled: activeTab === 'burnrates',
  });

  const {
    data: perstat,
  } = useQuery({
    queryKey: ['medical-perstat', numericUnitId],
    queryFn: () => getPERSTATMedical(numericUnitId),
  });

  // -------------------------------------------------------------------------
  // KPI Computations
  // -------------------------------------------------------------------------

  const activeCasualties = useMemo(() => {
    if (!casualties) return 0;
    return casualties.filter(
      (c) => c.status !== CasualtyReportStatus.CLOSED,
    ).length;
  }, [casualties]);

  const urgentSurgical = useMemo(() => {
    if (!casualties) return 0;
    return casualties.filter(
      (c) =>
        c.precedence === CASEVACPrecedence.URGENT_SURGICAL &&
        c.status !== CasualtyReportStatus.CLOSED,
    ).length;
  }, [casualties]);

  const evacuating = useMemo(() => {
    if (!casualties) return 0;
    return casualties.filter(
      (c) => c.status === CasualtyReportStatus.EVACUATING,
    ).length;
  }, [casualties]);

  const atMtf = useMemo(() => {
    if (!casualties) return 0;
    return casualties.filter(
      (c) => c.status === CasualtyReportStatus.AT_MTF,
    ).length;
  }, [casualties]);

  const mtfsOperational = useMemo(() => {
    if (!facilities) return 0;
    return facilities.filter((f) => f.status === MTFStatus.OPERATIONAL).length;
  }, [facilities]);

  const tcccCertRate = perstat?.tccc_cert_rate_pct ?? 0;

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
            gap: 10,
          }}
        >
          <Heart size={18} style={{ color: 'var(--color-danger)' }} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '3px',
              color: 'var(--color-text-bright)',
              textTransform: 'uppercase',
            }}
          >
            MEDICAL &amp; CASEVAC
          </span>
        </div>
        {activeCasualties > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius)',
            }}
          >
            <AlertTriangle size={12} style={{ color: '#ef4444' }} />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 700,
                color: '#ef4444',
                letterSpacing: '1px',
              }}
            >
              {activeCasualties} ACTIVE
            </span>
          </div>
        )}
      </div>

      {/* KPI Summary Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
        }}
      >
        {[
          {
            label: 'ACTIVE CASUALTIES',
            value: activeCasualties,
            color: activeCasualties > 0 ? '#ef4444' : '#22c55e',
            icon: AlertTriangle,
          },
          {
            label: 'URGENT SURGICAL',
            value: urgentSurgical,
            color: urgentSurgical > 0 ? '#ef4444' : 'var(--color-text-muted)',
            icon: Heart,
          },
          {
            label: 'MTFs OPERATIONAL',
            value: `${mtfsOperational}/${facilities?.length ?? 0}`,
            color: '#22c55e',
            icon: Building,
          },
          {
            label: 'TCCC CERT RATE',
            value: `${tcccCertRate.toFixed(1)}%`,
            color: tcccCertRate >= 85 ? '#22c55e' : tcccCertRate >= 70 ? '#f59e0b' : '#ef4444',
            icon: Activity,
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
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 6,
              }}
            >
              <kpi.icon size={11} style={{ color: 'var(--color-text-muted)' }} />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '1.5px',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                {kpi.label}
              </span>
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

      {/* Sub-KPIs: Evacuating / At MTF */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: 'EVACUATING', value: evacuating, color: '#3b82f6' },
          { label: 'AT MTF', value: atMtf, color: '#8b5cf6' },
        ].map((sub) => (
          <div
            key={sub.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              backgroundColor: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                letterSpacing: '1.5px',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
              }}
            >
              {sub.label}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                fontWeight: 700,
                color: sub.color,
              }}
            >
              {sub.value}
            </span>
          </div>
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
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {tab.key === 'nineline' && <Plus size={10} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'casualties' && (
        <Card title="CASUALTY TRACKER">
          {casualtiesLoading ? (
            renderLoadingSkeleton()
          ) : (
            <CasualtyTable casualties={casualties ?? []} />
          )}
        </Card>
      )}

      {activeTab === 'nineline' && (
        <Card title="9-LINE CASEVAC REQUEST" accentColor="#ef4444">
          <NineLineForm />
        </Card>
      )}

      {activeTab === 'facilities' && (
        <Card title="MEDICAL TREATMENT FACILITIES">
          {facilitiesLoading ? (
            renderLoadingSkeleton()
          ) : (
            <MTFStatusCards facilities={facilities ?? []} />
          )}
        </Card>
      )}

      {activeTab === 'bloodbank' && (
        <Card title="BLOOD PRODUCT INVENTORY">
          {bloodLoading || facilitiesLoading ? (
            renderLoadingSkeleton()
          ) : (
            <BloodBankDashboard
              products={bloodProducts ?? []}
              facilities={facilities ?? []}
            />
          )}
        </Card>
      )}

      {activeTab === 'burnrates' && (
        <Card title="CLASS VIII BURN RATES">
          {burnRatesLoading ? (
            renderLoadingSkeleton()
          ) : (
            <BurnRateTable burnRates={burnRates ?? []} />
          )}
        </Card>
      )}
    </div>
  );
}
