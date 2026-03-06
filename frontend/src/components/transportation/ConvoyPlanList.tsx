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
      className="inline-block py-0.5 px-2 rounded-[2px] font-[var(--font-mono)] text-[9px] font-bold tracking-[0.5px]" style={{ color: c.text, backgroundColor: c.bg, border: `1px solid ${c.border}` }}
    >
      {status}
    </span>
  );
}

function RiskBadge({ level }: { level: RiskAssessmentLevel | null }) {
  if (!level) return <span className="text-[var(--color-text-muted)] font-[var(--font-mono)] text-[9px]">--</span>;
  const c = RISK_COLORS[level];
  return (
    <span
      className="inline-block py-0.5 px-1.5 rounded-[2px] font-[var(--font-mono)] text-[9px] font-semibold" style={{ color: c.text, backgroundColor: c.bg, border: `1px solid ${c.border}` }}
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
        <div className="p-10 text-center">
          <div className="skeleton w-[200px] h-[16px] mx-auto mb-3" />
          <div className="skeleton w-[300px] h-[12px] mx-auto"  />
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="CONVOY PLANS"
      headerRight={
        <div className="flex items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1 px-2 font-[var(--font-mono)] text-[9px] font-semibold tracking-[0.5px] text-[var(--color-text)] bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius)] cursor-pointer"
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
            className="inline-flex items-center gap-1 py-1 px-2.5 font-[var(--font-mono)] text-[9px] font-semibold tracking-[0.5px] uppercase text-[var(--color-accent)] bg-[rgba(77,171,247,0.1)] border border-[var(--color-accent)] rounded-[var(--radius)] cursor-pointer"
          >
            <Plus size={11} /> NEW PLAN
          </button>
        </div>
      }
    >
      {filteredPlans.length === 0 ? (
        <div
          className="p-10 text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
        >
          No convoy plans found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
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
                    className="cursor-pointer transition-colors duration-150"
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
                    <td className="text-[var(--color-text-bright)]">
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
                        className="flex gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {plan.status === 'DRAFT' && (
                          <button
                            onClick={() => onApprovePlan(plan.id)}
                            className="py-0.5 px-1.5 font-[var(--font-mono)] text-[8px] font-semibold text-[#60a5fa] bg-[rgba(96,165,250,0.1)] rounded-[2px] cursor-pointer" style={{ border: '1px solid rgba(96, 165, 250, 0.3)' }}
                          >
                            APPROVE
                          </button>
                        )}
                        {plan.status === 'APPROVED' && (
                          <button
                            onClick={() => onExecutePlan(plan.id)}
                            className="py-0.5 px-1.5 font-[var(--font-mono)] text-[8px] font-semibold text-[#4ade80] bg-[rgba(74,222,128,0.1)] rounded-[2px] cursor-pointer" style={{ border: '1px solid rgba(74, 222, 128, 0.3)' }}
                          >
                            EXECUTE
                          </button>
                        )}
                        {(plan.status === 'DRAFT' || plan.status === 'APPROVED') && (
                          <button
                            onClick={() => onCancelPlan(plan.id)}
                            className="py-0.5 px-1.5 font-[var(--font-mono)] text-[8px] font-semibold text-[#f87171] bg-[rgba(248,113,113,0.1)] rounded-[2px] cursor-pointer border border-[rgba(248,113,113,0.3)]"
                          >
                            CANCEL
                          </button>
                        )}
                        <button
                          onClick={() => onSelectPlan(plan)}
                          className="py-0.5 px-1.5 font-[var(--font-mono)] text-[8px] font-semibold text-[var(--color-accent)] bg-[rgba(77,171,247,0.1)] rounded-[2px] cursor-pointer border border-[rgba(77,171,247,0.3)]"
                        >
                          DETAIL
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === plan.id && (
                    <tr key={`${plan.id}-detail`}>
                      <td colSpan={10} className="p-0 border-b border-b-[var(--color-border)]">
                        <div
                          className="py-3 px-4 bg-[var(--color-bg-surface)] grid gap-4 grid-cols-3"
                        >
                          <div>
                            <div className="font-[var(--font-mono)] text-[9px] font-semibold text-[var(--color-text-muted)] tracking-[1px] mb-1">
                              ROUTE DESCRIPTION
                            </div>
                            <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text)]">
                              {plan.route_description ?? 'No description'}
                            </div>
                          </div>
                          <div>
                            <div className="font-[var(--font-mono)] text-[9px] font-semibold text-[var(--color-text-muted)] tracking-[1px] mb-1">
                              PRIMARY ROUTE
                            </div>
                            <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text)]">
                              {plan.route_primary ?? '--'}
                            </div>
                          </div>
                          <div>
                            <div className="font-[var(--font-mono)] text-[9px] font-semibold text-[var(--color-text-muted)] tracking-[1px] mb-1">
                              SERIALS SUMMARY
                            </div>
                            <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text)]">
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
