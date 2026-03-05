// =============================================================================
// ConvoyPlanList — Table of convoy plans with filtering and actions
// =============================================================================

import { useState, useMemo } from 'react';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import type { ConvoyPlan, ConvoyPlanStatus, RiskAssessmentLevel } from '@/lib/types';
import Card from '@/components/ui/Card';

// ---------------------------------------------------------------------------
// Status / Risk badge helpers
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

function StatusBadge({ status }: { status: ConvoyPlanStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 2,
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.5px',
        color: c.text,
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
      }}
    >
      {status}
    </span>
  );
}

function RiskBadge({ level }: { level: RiskAssessmentLevel | null }) {
  if (!level) return <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 9 }}>--</span>;
  const c = RISK_COLORS[level];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 6px',
        borderRadius: 2,
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        fontWeight: 600,
        color: c.text,
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
      }}
    >
      {level}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ConvoyPlanListProps {
  plans: ConvoyPlan[];
  isLoading: boolean;
  onSelectPlan: (plan: ConvoyPlan) => void;
  onCreatePlan: () => void;
  onApprovePlan: (planId: number) => void;
  onExecutePlan: (planId: number) => void;
  onCancelPlan: (planId: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ConvoyPlanList({
  plans,
  isLoading,
  onSelectPlan,
  onCreatePlan,
  onApprovePlan,
  onExecutePlan,
  onCancelPlan,
}: ConvoyPlanListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filteredPlans = useMemo(() => {
    if (statusFilter === 'ALL') return plans;
    return plans.filter((p) => p.status === statusFilter);
  }, [plans, statusFilter]);

  const formatDate = (iso: string | null) => {
    if (!iso) return '--';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const cellStyle: React.CSSProperties = {
    padding: '8px 10px',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--color-text)',
    borderBottom: '1px solid var(--color-border)',
    whiteSpace: 'nowrap',
  };

  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '1px',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    position: 'sticky' as const,
    top: 0,
    backgroundColor: 'var(--color-bg-elevated)',
    zIndex: 1,
  };

  if (isLoading) {
    return (
      <Card title="CONVOY PLANS">
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div className="skeleton" style={{ width: 200, height: 16, margin: '0 auto 12px' }} />
          <div className="skeleton" style={{ width: 300, height: 12, margin: '0 auto' }} />
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="CONVOY PLANS"
      headerRight={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '4px 8px',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.5px',
              color: 'var(--color-text)',
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">ALL STATUS</option>
            <option value="DRAFT">DRAFT</option>
            <option value="APPROVED">APPROVED</option>
            <option value="EXECUTING">EXECUTING</option>
            <option value="COMPLETE">COMPLETE</option>
            <option value="CANCELED">CANCELED</option>
          </select>
          <button
            onClick={onCreatePlan}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              backgroundColor: 'rgba(77, 171, 247, 0.1)',
              border: '1px solid var(--color-accent)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
          >
            <Plus size={11} /> NEW PLAN
          </button>
        </div>
      }
    >
      {filteredPlans.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-text-muted)',
          }}
        >
          No convoy plans found
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={headerCellStyle}></th>
                <th style={headerCellStyle}>Name</th>
                <th style={headerCellStyle}>Status</th>
                <th style={headerCellStyle}>Route</th>
                <th style={headerCellStyle}>Dist (km)</th>
                <th style={headerCellStyle}>Duration</th>
                <th style={headerCellStyle}>Departure</th>
                <th style={headerCellStyle}>Risk</th>
                <th style={headerCellStyle}>Serials</th>
                <th style={headerCellStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map((plan) => (
                <>
                  <tr
                    key={plan.id}
                    style={{
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--color-bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent';
                    }}
                    onClick={() => setExpandedId(expandedId === plan.id ? null : plan.id)}
                  >
                    <td style={cellStyle}>
                      {expandedId === plan.id ? (
                        <ChevronDown size={12} />
                      ) : (
                        <ChevronRight size={12} />
                      )}
                    </td>
                    <td style={{ ...cellStyle, fontWeight: 600, color: 'var(--color-text-bright)' }}>
                      {plan.name}
                    </td>
                    <td style={cellStyle}>
                      <StatusBadge status={plan.status} />
                    </td>
                    <td style={cellStyle}>{plan.route_name ?? '--'}</td>
                    <td style={cellStyle}>{plan.total_distance_km ?? '--'}</td>
                    <td style={cellStyle}>
                      {plan.estimated_duration_hours ? `${plan.estimated_duration_hours}h` : '--'}
                    </td>
                    <td style={cellStyle}>{formatDate(plan.departure_time_planned)}</td>
                    <td style={cellStyle}>
                      <RiskBadge level={plan.risk_assessment_level} />
                    </td>
                    <td style={cellStyle}>{plan.serials.length}</td>
                    <td style={cellStyle}>
                      <div
                        style={{ display: 'flex', gap: 4 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {plan.status === 'DRAFT' && (
                          <button
                            onClick={() => onApprovePlan(plan.id)}
                            style={{
                              padding: '2px 6px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 8,
                              fontWeight: 600,
                              color: '#60a5fa',
                              backgroundColor: 'rgba(96, 165, 250, 0.1)',
                              border: '1px solid rgba(96, 165, 250, 0.3)',
                              borderRadius: 2,
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
                              padding: '2px 6px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 8,
                              fontWeight: 600,
                              color: '#4ade80',
                              backgroundColor: 'rgba(74, 222, 128, 0.1)',
                              border: '1px solid rgba(74, 222, 128, 0.3)',
                              borderRadius: 2,
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
                              padding: '2px 6px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 8,
                              fontWeight: 600,
                              color: '#f87171',
                              backgroundColor: 'rgba(248, 113, 113, 0.1)',
                              border: '1px solid rgba(248, 113, 113, 0.3)',
                              borderRadius: 2,
                              cursor: 'pointer',
                            }}
                          >
                            CANCEL
                          </button>
                        )}
                        <button
                          onClick={() => onSelectPlan(plan)}
                          style={{
                            padding: '2px 6px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 8,
                            fontWeight: 600,
                            color: 'var(--color-accent)',
                            backgroundColor: 'rgba(77, 171, 247, 0.1)',
                            border: '1px solid rgba(77, 171, 247, 0.3)',
                            borderRadius: 2,
                            cursor: 'pointer',
                          }}
                        >
                          DETAIL
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === plan.id && (
                    <tr key={`${plan.id}-detail`}>
                      <td colSpan={10} style={{ padding: 0, borderBottom: '1px solid var(--color-border)' }}>
                        <div
                          style={{
                            padding: '12px 16px',
                            backgroundColor: 'var(--color-bg-surface)',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: 16,
                          }}
                        >
                          <div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '1px', marginBottom: 4 }}>
                              ROUTE DESCRIPTION
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text)' }}>
                              {plan.route_description ?? 'No description'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '1px', marginBottom: 4 }}>
                              PRIMARY ROUTE
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text)' }}>
                              {plan.route_primary ?? '--'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '1px', marginBottom: 4 }}>
                              SERIALS SUMMARY
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text)' }}>
                              {plan.serials.length} serials,{' '}
                              {plan.serials.reduce((a, s) => a + s.vehicle_count, 0)} vehicles,{' '}
                              {plan.serials.reduce((a, s) => a + s.pax_count, 0)} PAX
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
