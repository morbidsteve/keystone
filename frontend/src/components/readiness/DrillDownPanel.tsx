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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <RatingBadge rating={data.rRating} />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            fontWeight: 700,
            color: getPctColor(data.overallReadinessPct),
          }}
        >
          {Math.round(data.overallReadinessPct)}%
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>
          as of {data.snapshotDate}
        </span>
      </div>

      {/* Category summary bar */}
      {data.summaryByCategory && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {Object.entries(data.summaryByCategory).map(([cat, pct]) => (
            <div
              key={cat}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {cat}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: getPctColor(pct) }}>
                {pct}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Equipment table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--color-text-bright)' }}>{item.tamcn}</td>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <RatingBadge rating={data.sRating} />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            fontWeight: 700,
            color: getPctColor(data.overallReadinessPct),
          }}
        >
          {Math.round(data.overallReadinessPct)}%
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>
          as of {data.snapshotDate}
        </span>
      </div>

      {/* DOS by class summary */}
      {data.dosByClass && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {Object.entries(data.dosByClass).map(([cls, dos]) => (
            <div
              key={cls}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {cls}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: dos < 5 ? '#f87171' : dos < 15 ? '#fbbf24' : '#4ade80' }}>
                {dos < 100 ? dos.toFixed(1) : Math.round(dos)} DOS
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Supply table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--color-text-bright)' }}>{item.supplyClass}</td>
                <td style={tdStyle}>{item.description}</td>
                <td style={tdRight}>{item.onHand.toLocaleString()}</td>
                <td style={tdRight}>{item.required.toLocaleString()}</td>
                <td style={{ ...tdRight, fontWeight: 700, color: item.dos < 5 ? '#f87171' : item.dos < 15 ? '#fbbf24' : '#4ade80' }}>
                  {item.dos < 100 ? item.dos.toFixed(1) : Math.round(item.dos)}
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '1px',
                      color: getStatusColor(item.status),
                      backgroundColor: `${getStatusColor(item.status)}15`,
                      border: `1px solid ${getStatusColor(item.status)}30`,
                    }}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <RatingBadge rating={data.pRating} />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            fontWeight: 700,
            color: getPctColor(data.overallReadinessPct),
          }}
        >
          {Math.round(data.overallReadinessPct)}%
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>
          as of {data.snapshotDate}
        </span>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Authorized', value: data.authorizedTotal.toLocaleString() },
          { label: 'Assigned', value: data.assignedTotal.toLocaleString() },
          { label: 'Fill Rate', value: `${data.fillRatePct}%`, color: getPctColor(data.fillRatePct) },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              flex: '1 1 120px',
              padding: '12px 16px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {card.label}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: card.color ?? 'var(--color-text-bright)' }}>
              {card.value}
            </span>
          </div>
        ))}
      </div>

      {/* MOS Shortfalls table */}
      {data.mosShortfalls.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-text-muted)', marginBottom: 8 }}>
            MOS SHORTFALLS
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                    <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--color-text-bright)' }}>{s.mos}</td>
                    <td style={tdStyle}>{s.mosTitle}</td>
                    <td style={tdRight}>{s.authorized}</td>
                    <td style={tdRight}>{s.assigned}</td>
                    <td style={{ ...tdRight, fontWeight: 700, color: '#f87171' }}>-{s.shortfall}</td>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <RatingBadge rating={data.tRating} />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            fontWeight: 700,
            color: getPctColor(data.overallReadinessPct),
          }}
        >
          {Math.round(data.overallReadinessPct)}%
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>
          as of {data.snapshotDate}
        </span>
      </div>

      {/* Qualification currency rates */}
      {data.qualificationCurrencyRates && (
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-text-muted)', marginBottom: 8 }}>
            QUALIFICATION CURRENCY RATES
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-text-muted)', marginBottom: 8 }}>
            UPCOMING EXPIRATIONS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {data.upcomingExpirations.map((exp, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text)' }}>
                  {exp.qualification}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#fb923c' }}>
                    {exp.count} Marines
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)' }}>
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
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-text-muted)', marginBottom: 8 }}>
            COMBAT READINESS STATS
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(data.combatReadinessStats).map(([stat, pct]) => (
              <div
                key={stat}
                style={{
                  flex: '1 1 140px',
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {stat}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: getPctColor(pct) }}>
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
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: 'var(--color-text-bright)',
          }}
        >
          {DOMAIN_LABELS[domain]}
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius)',
            transition: 'color var(--transition)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-bright)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="skeleton" style={{ width: 200, height: 16, margin: '0 auto 12px' }} />
            <div className="skeleton" style={{ width: 300, height: 12, margin: '0 auto' }} />
          </div>
        ) : error ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--color-danger)',
            }}
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
