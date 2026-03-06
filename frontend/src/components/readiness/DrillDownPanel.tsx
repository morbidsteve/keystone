// =============================================================================
// DrillDownPanel — Detailed readiness drill-down for equipment/supply/personnel/training
// =============================================================================

import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import RatingBadge from './RatingBadge';
import {
  getEquipmentDetail,
  getSupplyDetail,
  getPersonnelDetail,
  getTrainingDetail,
} from '@/api/readiness';
import type {
  EquipmentDetailResponse,
  SupplyDetailResponse,
  PersonnelDetailResponse,
  TrainingDetailResponse,
} from '@/lib/types';

type DrillDownDomain = 'equipment' | 'supply' | 'personnel' | 'training';

interface DrillDownPanelProps {
  unitId: number;
  domain: DrillDownDomain;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function getPctColor(pct: number): string {
  if (pct >= 90) return '#4ade80';
  if (pct >= 75) return '#fbbf24';
  if (pct >= 60) return '#fb923c';
  return '#f87171';
}

function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'GREEN': return '#4ade80';
    case 'AMBER': return '#fbbf24';
    case 'RED': return '#f87171';
    default: return 'var(--color-text-muted)';
  }
}

// ---------------------------------------------------------------------------
// Table header/cell styles
// ---------------------------------------------------------------------------

const thStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  color: 'var(--color-text-muted)',
  textAlign: 'left',
  padding: '8px 10px',
  borderBottom: '1px solid var(--color-border)',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  color: 'var(--color-text)',
  padding: '7px 10px',
  borderBottom: '1px solid var(--color-border)',
  whiteSpace: 'nowrap',
};

const thRight: React.CSSProperties = { ...thStyle, textAlign: 'right' };
const tdRight: React.CSSProperties = { ...tdStyle, textAlign: 'right' };

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EquipmentDrillDown({ data }: { data: EquipmentDetailResponse }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Summary header */}
      <div className="flex items-center gap-3">
        <RatingBadge rating={data.rRating} />
        <span
          className="font-[var(--font-mono)] text-sm font-bold" style={{ color: getPctColor(data.overallReadinessPct) }}
        >
          {Math.round(data.overallReadinessPct)}%
        </span>
        <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]">
          as of {data.snapshotDate}
        </span>
      </div>

      {/* Category summary bar */}
      {data.summaryByCategory && (
        <div className="flex gap-3 flex-wrap">
          {Object.entries(data.summaryByCategory).map(([cat, pct]) => (
            <div
              key={cat}
              className="py-1.5 px-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] flex flex-col items-center gap-0.5"
            >
              <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] uppercase tracking-[1px]">
                {cat}
              </span>
              <span className="font-[var(--font-mono)] text-sm font-bold" style={{ color: getPctColor(pct) }}>
                {pct}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Equipment table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th style={thStyle}>TAMCN</th>
              <th style={thStyle}>Nomenclature</th>
              <th style={thRight}>Total</th>
              <th style={thRight}>MC</th>
              <th style={thRight}>NMC-M</th>
              <th style={thRight}>NMC-S</th>
              <th style={thRight}>Readiness</th>
            </tr>
          </thead>
          <tbody>
            {data.equipmentItems.map((item) => (
              <tr key={item.tamcn}>
                <td className="text-[var(--color-text-bright)]">{item.tamcn}</td>
                <td style={tdStyle}>{item.nomenclature}</td>
                <td style={tdRight}>{item.totalPossessed}</td>
                <td style={tdRight}>{item.missionCapable}</td>
                <td style={{ ...tdRight, color: item.nmcM > 0 ? '#fb923c' : 'var(--color-text)' }}>{item.nmcM}</td>
                <td style={{ ...tdRight, color: item.nmcS > 0 ? '#fbbf24' : 'var(--color-text)' }}>{item.nmcS}</td>
                <td style={{ ...tdRight, fontWeight: 700, color: getPctColor(item.readinessPct) }}>
                  {item.readinessPct.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SupplyDrillDown({ data }: { data: SupplyDetailResponse }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Summary header */}
      <div className="flex items-center gap-3">
        <RatingBadge rating={data.sRating} />
        <span
          className="font-[var(--font-mono)] text-sm font-bold" style={{ color: getPctColor(data.overallReadinessPct) }}
        >
          {Math.round(data.overallReadinessPct)}%
        </span>
        <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]">
          as of {data.snapshotDate}
        </span>
      </div>

      {/* DOS by class summary */}
      {data.dosByClass && (
        <div className="flex gap-3 flex-wrap">
          {Object.entries(data.dosByClass).map(([cls, dos]) => (
            <div
              key={cls}
              className="py-1.5 px-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] flex flex-col items-center gap-0.5"
            >
              <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] uppercase tracking-[1px]">
                {cls}
              </span>
              <span className="font-[var(--font-mono)] text-sm font-bold" style={{ color: dos < 5 ? '#f87171' : dos < 15 ? '#fbbf24' : '#4ade80' }}>
                {dos < 100 ? dos.toFixed(1) : Math.round(dos)} DOS
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Supply table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th style={thStyle}>Class</th>
              <th style={thStyle}>Description</th>
              <th style={thRight}>On Hand</th>
              <th style={thRight}>Required</th>
              <th style={thRight}>DOS</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.supplyItems.map((item, idx) => (
              <tr key={`${item.supplyClass}-${idx}`}>
                <td className="text-[var(--color-text-bright)]">{item.supplyClass}</td>
                <td style={tdStyle}>{item.description}</td>
                <td style={tdRight}>{item.onHand.toLocaleString()}</td>
                <td style={tdRight}>{item.required.toLocaleString()}</td>
                <td style={{ ...tdRight, fontWeight: 700, color: item.dos < 5 ? '#f87171' : item.dos < 15 ? '#fbbf24' : '#4ade80' }}>
                  {item.dos < 100 ? item.dos.toFixed(1) : Math.round(item.dos)}
                </td>
                <td style={tdStyle}>
                  <span
                    className="inline-block py-0.5 px-2 rounded-[var(--radius)] font-[var(--font-mono)] text-[9px] font-bold tracking-[1px]" style={{ color: getStatusColor(item.status), backgroundColor: `${getStatusColor(item.status)}15`, border: `1px solid ${getStatusColor(item.status)}30` }}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PersonnelDrillDown({ data }: { data: PersonnelDetailResponse }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Summary header */}
      <div className="flex items-center gap-3">
        <RatingBadge rating={data.pRating} />
        <span
          className="font-[var(--font-mono)] text-sm font-bold" style={{ color: getPctColor(data.overallReadinessPct) }}
        >
          {Math.round(data.overallReadinessPct)}%
        </span>
        <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]">
          as of {data.snapshotDate}
        </span>
      </div>

      {/* Summary cards */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Authorized', value: data.authorizedTotal.toLocaleString() },
          { label: 'Assigned', value: data.assignedTotal.toLocaleString() },
          { label: 'Fill Rate', value: `${data.fillRatePct}%`, color: getPctColor(data.fillRatePct) },
        ].map((card) => (
          <div
            key={card.label}
            className="py-3 px-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] flex flex-col gap-1 flex-[1_1_120px]"
          >
            <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] uppercase tracking-[1px]">
              {card.label}
            </span>
            <span className="font-[var(--font-mono)] text-xl font-bold" style={{ color: card.color ?? 'var(--color-text-bright)' }}>
              {card.value}
            </span>
          </div>
        ))}
      </div>

      {/* MOS Shortfalls table */}
      {data.mosShortfalls.length > 0 && (
        <div>
          <div className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-2">
            MOS SHORTFALLS
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th style={thStyle}>MOS</th>
                  <th style={thStyle}>Title</th>
                  <th style={thRight}>Auth</th>
                  <th style={thRight}>Assigned</th>
                  <th style={thRight}>Shortfall</th>
                </tr>
              </thead>
              <tbody>
                {data.mosShortfalls.map((s) => (
                  <tr key={s.mos}>
                    <td className="text-[var(--color-text-bright)]">{s.mos}</td>
                    <td style={tdStyle}>{s.mosTitle}</td>
                    <td style={tdRight}>{s.authorized}</td>
                    <td style={tdRight}>{s.assigned}</td>
                    <td className="text-[#f87171]">-{s.shortfall}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TrainingDrillDown({ data }: { data: TrainingDetailResponse }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Summary header */}
      <div className="flex items-center gap-3">
        <RatingBadge rating={data.tRating} />
        <span
          className="font-[var(--font-mono)] text-sm font-bold" style={{ color: getPctColor(data.overallReadinessPct) }}
        >
          {Math.round(data.overallReadinessPct)}%
        </span>
        <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]">
          as of {data.snapshotDate}
        </span>
      </div>

      {/* Qualification currency rates */}
      {data.qualificationCurrencyRates && (
        <div>
          <div className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-2">
            QUALIFICATION CURRENCY RATES
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th style={thStyle}>Qualification</th>
                  <th style={thRight}>Currency Rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.qualificationCurrencyRates).map(([qual, rate]) => (
                  <tr key={qual}>
                    <td style={tdStyle}>{qual}</td>
                    <td style={{ ...tdRight, fontWeight: 700, color: getPctColor(rate) }}>{rate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upcoming expirations */}
      {data.upcomingExpirations && data.upcomingExpirations.length > 0 && (
        <div>
          <div className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-2">
            UPCOMING EXPIRATIONS
          </div>
          <div className="flex flex-col gap-1">
            {data.upcomingExpirations.map((exp, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 px-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)]"
              >
                <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)]">
                  {exp.qualification}
                </span>
                <div className="flex items-center gap-2.5">
                  <span className="font-[var(--font-mono)] text-[11px] font-bold text-[#fb923c]">
                    {exp.count} Marines
                  </span>
                  <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]">
                    within {exp.dueWithin}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Combat readiness stats */}
      {data.combatReadinessStats && (
        <div>
          <div className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-2">
            COMBAT READINESS STATS
          </div>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(data.combatReadinessStats).map(([stat, pct]) => (
              <div
                key={stat}
                className="py-2 px-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] flex flex-col gap-0.5 flex-[1_1_140px]"
              >
                <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] uppercase tracking-[1px]">
                  {stat}
                </span>
                <span className="font-[var(--font-mono)] text-lg font-bold" style={{ color: getPctColor(pct) }}>
                  {pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main DrillDownPanel
// ---------------------------------------------------------------------------

const DOMAIN_LABELS: Record<DrillDownDomain, string> = {
  equipment: 'EQUIPMENT DETAIL',
  supply: 'SUPPLY DETAIL',
  personnel: 'PERSONNEL DETAIL',
  training: 'TRAINING DETAIL',
};

export default function DrillDownPanel({ unitId, domain, onClose }: DrillDownPanelProps) {
  const queryFn = async (): Promise<EquipmentDetailResponse | SupplyDetailResponse | PersonnelDetailResponse | TrainingDetailResponse> => {
    switch (domain) {
      case 'equipment': return getEquipmentDetail(unitId);
      case 'supply': return getSupplyDetail(unitId);
      case 'personnel': return getPersonnelDetail(unitId);
      case 'training': return getTrainingDetail(unitId);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['readiness-drilldown', unitId, domain],
    queryFn,
  });

  return (
    <div
      className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between py-3 px-4 border-b border-b-[var(--color-border)] bg-[var(--color-bg)]"
      >
        <span
          className="font-[var(--font-mono)] text-[10px] font-bold tracking-[1.5px] uppercase text-[var(--color-text-bright)]"
        >
          {DOMAIN_LABELS[domain]}
        </span>
        <button
          onClick={onClose}
          className="bg-transparent border-0 cursor-pointer text-[var(--color-text-muted)] p-1 flex items-center justify-center rounded-[var(--radius)] transition-colors duration-[var(--transition)]"
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-bright)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="p-10 text-center">
            <div className="skeleton w-[200px] h-[16px] mx-auto mb-3" />
            <div className="skeleton w-[300px] h-[12px] mx-auto"  />
          </div>
        ) : error ? (
          <div
            className="p-10 text-center font-[var(--font-mono)] text-xs text-[var(--color-danger)]"
          >
            Failed to load {domain} detail data.
          </div>
        ) : data ? (
          <>
            {domain === 'equipment' && <EquipmentDrillDown data={data as EquipmentDetailResponse} />}
            {domain === 'supply' && <SupplyDrillDown data={data as SupplyDetailResponse} />}
            {domain === 'personnel' && <PersonnelDrillDown data={data as PersonnelDetailResponse} />}
            {domain === 'training' && <TrainingDrillDown data={data as TrainingDetailResponse} />}
          </>
        ) : null}
      </div>
    </div>
  );
}
