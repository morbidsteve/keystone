// =============================================================================
// ConvoyPlanDetail — Full detail view for a selected convoy plan
// =============================================================================

import { ArrowLeft, Clock, MapPin, Radio, ShieldAlert, Cross } from 'lucide-react';
import type { ConvoyPlan, ConvoyPlanStatus, RiskAssessmentLevel } from '@/lib/types';
import Card from '@/components/ui/Card';

// ---------------------------------------------------------------------------
// Badge helpers (duplicated for isolation; could be shared in a util)
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<ConvoyPlanStatus, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.4)' },
  APPROVED: { bg: 'rgba(96, 165, 250, 0.15)', text: '#60a5fa', border: 'rgba(96, 165, 250, 0.4)' },
  EXECUTING: { bg: 'rgba(74, 222, 128, 0.15)', text: '#4ade80', border: 'rgba(74, 222, 128, 0.4)' },
  COMPLETE: { bg: 'rgba(148, 163, 184, 0.10)', text: '#64748b', border: 'rgba(148, 163, 184, 0.3)' },
  CANCELED: { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171', border: 'rgba(248, 113, 113, 0.4)' },
};

const RISK_COLORS: Record<RiskAssessmentLevel, { bg: string; text: string; border: string }> = {
  LOW: { bg: 'rgba(74, 222, 128, 0.15)', text: '#4ade80', border: 'rgba(74, 222, 128, 0.4)' },
  MEDIUM: { bg: 'rgba(250, 204, 21, 0.15)', text: '#facc15', border: 'rgba(250, 204, 21, 0.4)' },
  HIGH: { bg: 'rgba(251, 146, 60, 0.15)', text: '#fb923c', border: 'rgba(251, 146, 60, 0.4)' },
  EXTREME: { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171', border: 'rgba(248, 113, 113, 0.4)' },
};

function Badge({ label, colorSet }: { label: string; colorSet: { bg: string; text: string; border: string } }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 2,
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.5px',
        color: colorSet.text,
        backgroundColor: colorSet.bg,
        border: `1px solid ${colorSet.border}`,
      }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ConvoyPlanDetailProps {
  plan: ConvoyPlan;
  onBack: () => void;
  onOpenMarchTable: (planId: number) => void;
  onApprovePlan: (planId: number) => void;
  onExecutePlan: (planId: number) => void;
  onCancelPlan: (planId: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ConvoyPlanDetail({
  plan,
  onBack,
  onOpenMarchTable,
  onApprovePlan,
  onExecutePlan,
  onCancelPlan,
}: ConvoyPlanDetailProps) {
  const formatDate = (iso: string | null) => {
    if (!iso) return '--';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '1.5px',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };

  const fieldLabelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    letterSpacing: '0.5px',
    marginBottom: 2,
  };

  const fieldValueStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--color-text)',
    lineHeight: 1.4,
  };

  const cellStyle: React.CSSProperties = {
    padding: '6px 10px',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--color-text)',
    borderBottom: '1px solid var(--color-border)',
  };

  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '1px',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    backgroundColor: 'var(--color-bg-elevated)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={12} /> BACK
          </button>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--color-text-bright)',
              letterSpacing: '1px',
            }}
          >
            {plan.name}
          </span>
          <Badge label={plan.status} colorSet={STATUS_COLORS[plan.status]} />
          {plan.risk_assessment_level && (
            <Badge label={`RISK: ${plan.risk_assessment_level}`} colorSet={RISK_COLORS[plan.risk_assessment_level]} />
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onOpenMarchTable(plan.id)}
            style={{
              padding: '5px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.5px',
              color: 'var(--color-accent)',
              backgroundColor: 'rgba(77, 171, 247, 0.1)',
              border: '1px solid var(--color-accent)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
          >
            MARCH TABLE
          </button>
          {plan.status === 'DRAFT' && (
            <button
              onClick={() => onApprovePlan(plan.id)}
              style={{
                padding: '5px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 600,
                color: '#60a5fa',
                backgroundColor: 'rgba(96, 165, 250, 0.1)',
                border: '1px solid rgba(96, 165, 250, 0.4)',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
              }}
            >
              APPROVE
            </button>
          )}
          {plan.status === 'APPROVED' && (
            <button
              onClick={() => onExecutePlan(plan.id)}
              style={{
                padding: '5px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 600,
                color: '#4ade80',
                backgroundColor: 'rgba(74, 222, 128, 0.1)',
                border: '1px solid rgba(74, 222, 128, 0.4)',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
              }}
            >
              EXECUTE
            </button>
          )}
          {(plan.status === 'DRAFT' || plan.status === 'APPROVED') && (
            <button
              onClick={() => onCancelPlan(plan.id)}
              style={{
                padding: '5px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 600,
                color: '#f87171',
                backgroundColor: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid rgba(248, 113, 113, 0.4)',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
              }}
            >
              CANCEL
            </button>
          )}
        </div>
      </div>

      {/* Route Info */}
      <Card title="ROUTE INFORMATION">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={fieldLabelStyle}>ROUTE NAME</div>
            <div style={fieldValueStyle}>{plan.route_name ?? '--'}</div>
          </div>
          <div>
            <div style={fieldLabelStyle}>MCN</div>
            <div style={fieldValueStyle}>{plan.movement_credit_number ?? 'Not assigned'}</div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={fieldLabelStyle}>DESCRIPTION</div>
            <div style={fieldValueStyle}>{plan.route_description ?? '--'}</div>
          </div>
          <div>
            <div style={fieldLabelStyle}>PRIMARY ROUTE</div>
            <div style={fieldValueStyle}>{plan.route_primary ?? '--'}</div>
          </div>
          <div>
            <div style={fieldLabelStyle}>ALTERNATE ROUTE</div>
            <div style={fieldValueStyle}>{plan.route_alternate ?? '--'}</div>
          </div>
          <div>
            <div style={fieldLabelStyle}>TOTAL DISTANCE</div>
            <div style={{ ...fieldValueStyle, fontWeight: 700, color: 'var(--color-text-bright)' }}>
              {plan.total_distance_km ? `${plan.total_distance_km} km` : '--'}
            </div>
          </div>
          <div>
            <div style={fieldLabelStyle}>ESTIMATED DURATION</div>
            <div style={{ ...fieldValueStyle, fontWeight: 700, color: 'var(--color-text-bright)' }}>
              {plan.estimated_duration_hours ? `${plan.estimated_duration_hours} hours` : '--'}
            </div>
          </div>
        </div>
      </Card>

      {/* Timing Section */}
      <Card title="TIMING">
        <div style={{ display: 'flex', gap: 0, overflow: 'auto' }}>
          {[
            { label: 'BRIEF', time: plan.brief_time, icon: Clock },
            { label: 'REHEARSAL', time: plan.rehearsal_time, icon: MapPin },
            { label: 'DEPARTURE', time: plan.departure_time_planned, icon: Clock },
            { label: 'SP TIME', time: plan.sp_time, icon: MapPin },
            { label: 'RP TIME', time: plan.rp_time, icon: MapPin },
          ].map((item, idx) => (
            <div
              key={item.label}
              style={{
                flex: '1 1 0',
                padding: '12px 14px',
                borderRight: idx < 4 ? '1px solid var(--color-border)' : 'none',
                textAlign: 'center',
              }}
            >
              <item.icon
                size={14}
                style={{ color: 'var(--color-accent)', marginBottom: 6 }}
              />
              <div style={fieldLabelStyle}>{item.label}</div>
              <div style={{ ...fieldValueStyle, fontSize: 10, fontWeight: 600 }}>
                {formatDate(item.time)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Serials Table */}
      <Card title="SERIALS">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={headerCellStyle}>Serial #</th>
                <th style={headerCellStyle}>Commander</th>
                <th style={headerCellStyle}>Vehicles</th>
                <th style={headerCellStyle}>PAX</th>
                <th style={headerCellStyle}>March Order</th>
                <th style={headerCellStyle}>Speed (kph)</th>
                <th style={headerCellStyle}>Interval (m)</th>
              </tr>
            </thead>
            <tbody>
              {plan.serials.map((serial) => (
                <tr key={serial.id}>
                  <td style={{ ...cellStyle, fontWeight: 600, color: 'var(--color-text-bright)' }}>
                    {serial.serial_number}
                  </td>
                  <td style={cellStyle}>{serial.serial_commander_name ?? '--'}</td>
                  <td style={cellStyle}>{serial.vehicle_count}</td>
                  <td style={cellStyle}>{serial.pax_count}</td>
                  <td style={cellStyle}>{serial.march_order}</td>
                  <td style={cellStyle}>{serial.march_speed_kph}</td>
                  <td style={cellStyle}>{serial.interval_meters}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          style={{
            marginTop: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--color-text-muted)',
          }}
        >
          Total: {plan.serials.reduce((a, s) => a + s.vehicle_count, 0)} vehicles,{' '}
          {plan.serials.reduce((a, s) => a + s.pax_count, 0)} PAX
        </div>
      </Card>

      {/* Contingencies */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <Card>
          <div style={sectionLabelStyle}>
            <Radio size={12} /> COMM PLAN
          </div>
          <div style={fieldValueStyle}>{plan.comm_plan ?? 'No comm plan specified'}</div>
        </Card>
        <Card>
          <div style={sectionLabelStyle}>
            <ShieldAlert size={12} /> RECOVERY PLAN
          </div>
          <div style={fieldValueStyle}>{plan.recovery_plan ?? 'No recovery plan specified'}</div>
        </Card>
        <Card>
          <div style={sectionLabelStyle}>
            <Cross size={12} /> MEDEVAC PLAN
          </div>
          <div style={fieldValueStyle}>{plan.medevac_plan ?? 'No MEDEVAC plan specified'}</div>
        </Card>
      </div>
    </div>
  );
}
