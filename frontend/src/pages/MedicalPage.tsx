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
          className="flex items-center gap-2.5"
        >
          <Heart size={18} className="text-[var(--color-danger)]" />
          <span
            className="font-[var(--font-mono)] text-sm font-bold tracking-[3px] text-[var(--color-text-bright)] uppercase"
          >
            MEDICAL &amp; CASEVAC
          </span>
        </div>
        {activeCasualties > 0 && (
          <div
            className="flex items-center gap-1.5 py-1 px-2.5 bg-[rgba(239,68,68,0.12)] rounded-[var(--radius)] border border-[rgba(239,68,68,0.3)]"
          >
            <AlertTriangle size={12} className="text-[#ef4444]" />
            <span
              className="font-[var(--font-mono)] text-[10px] font-bold text-[#ef4444] tracking-[1px]"
            >
              {activeCasualties} ACTIVE
            </span>
          </div>
        )}
      </div>

      {/* KPI Summary Row */}
      <div
        className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]"
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
            className="py-3.5 px-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)]"
          >
            <div
              className="flex items-center gap-1.5 mb-1.5"
            >
              <kpi.icon size={11} className="text-[var(--color-text-muted)]" />
              <span
                className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] uppercase"
              >
                {kpi.label}
              </span>
            </div>
            <div
              className="font-[var(--font-mono)] text-[22px] font-bold" style={{ color: kpi.color }}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Sub-KPIs: Evacuating / At MTF */}
      <div
        className="flex gap-3 flex-wrap"
      >
        {[
          { label: 'EVACUATING', value: evacuating, color: '#3b82f6' },
          { label: 'AT MTF', value: atMtf, color: '#8b5cf6' },
        ].map((sub) => (
          <div
            key={sub.label}
            className="flex items-center gap-2 py-1.5 px-3.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)]"
          >
            <span
              className="font-[var(--font-mono)] text-[9px] tracking-[1.5px] text-[var(--color-text-muted)] uppercase"
            >
              {sub.label}
            </span>
            <span
              className="font-[var(--font-mono)] text-sm font-bold" style={{ color: sub.color }}
            >
              {sub.value}
            </span>
          </div>
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
            className="py-2 px-4 font-[var(--font-mono)] text-[10px] tracking-[1.5px] uppercase border-0 bg-transparent cursor-pointer mb-[-1px] flex items-center gap-1.5" style={{ fontWeight: activeTab === tab.key ? 600 : 400, borderBottom: activeTab === tab.key
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent', color: activeTab === tab.key
                  ? 'var(--color-accent)'
                  : 'var(--color-text-muted)', transition: 'all var(--transition)' }}
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
