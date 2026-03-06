// =============================================================================
// ApprovalQueue — Card-based queue for SUBMITTED requisitions pending approval
// =============================================================================

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, XCircle, Clock, AlertTriangle, ClipboardCheck } from 'lucide-react';
import type { Requisition, RequisitionPriority } from '@/lib/types';
import EmptyState from '@/components/ui/EmptyState';
import { approveRequisition, denyRequisition } from '@/api/requisitions';
import { useToast } from '@/hooks/useToast';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function priorityLabel(p: RequisitionPriority): string {
  if (p === '01') return 'ROUTINE';
  if (p === '02') return 'URGENT';
  if (p === '03') return 'EMERGENCY';
  return `PRI ${p}`;
}

function priorityColor(p: RequisitionPriority): string {
  if (p === '03') return 'var(--color-danger)';
  if (p === '02') return 'var(--color-warning)';
  if (p === '01') return 'var(--color-success)';
  return 'var(--color-text-muted)';
}

function priorityBorder(p: RequisitionPriority): string {
  if (p === '03') return '2px solid var(--color-danger)';
  if (p === '02') return '2px solid var(--color-warning)';
  return '1px solid var(--color-border)';
}

// ---------------------------------------------------------------------------
// Single Approval Card
// ---------------------------------------------------------------------------

function ApprovalCard({ req, onRefresh }: { req: Requisition; onRefresh?: () => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [denyReason, setDenyReason] = useState('');
  const [showDenyInput, setShowDenyInput] = useState(false);
  const [approveQty, setApproveQty] = useState<number>(req.quantity_requested);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['requisitions'] });
    onRefresh?.();
  };

  const approveMut = useMutation({
    mutationFn: () => approveRequisition(req.id, { quantity_approved: approveQty }),
    onSuccess: () => {
      setShowApproveConfirm(false);
      invalidateAll();
      toast.success('Requisition approved');
    },
    onError: () => {
      toast.danger('Failed to approve requisition');
    },
  });
  const denyMut = useMutation({
    mutationFn: () => denyRequisition(req.id, { reason: denyReason }),
    onSuccess: () => {
      setShowDenyInput(false);
      invalidateAll();
      toast.warning('Requisition denied');
    },
    onError: () => {
      toast.danger('Failed to deny requisition');
    },
  });

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: 'var(--color-text-muted)',
  };

  const btnStyle = (color: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 10px',
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color,
    backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
    border: `1px solid ${color}`,
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    transition: 'all var(--transition)',
  });

  return (
    <div
      className="bg-[var(--color-bg-elevated)] rounded-[var(--radius)] overflow-hidden" style={{ border: priorityBorder(req.priority) }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between py-2.5 px-3.5 border-b border-b-[var(--color-border)]"
      >
        <span
          className="font-[var(--font-mono)] text-[11px] font-bold text-[var(--color-accent)]"
        >
          {req.requisition_number}
        </span>
        <span
          className="inline-flex items-center gap-1 py-0.5 px-1.5 rounded-[2px] text-[9px] font-bold tracking-[0.5px] font-[var(--font-mono)]" style={{ color: priorityColor(req.priority), border: `1px solid ${priorityColor(req.priority)}`, backgroundColor: `color-mix(in srgb, ${priorityColor(req.priority)} 10%, transparent)` }}
        >
          {req.priority === '03' && <AlertTriangle size={9} />}
          {priorityLabel(req.priority)}
        </span>
      </div>

      {/* Card body */}
      <div className="py-2.5 px-3.5 flex flex-col gap-2">
        <div
          className="font-[var(--font-mono)] text-[11px] font-semibold text-[var(--color-text-bright)]"
        >
          {req.nomenclature}
        </div>

        <div className="flex gap-4 flex-wrap">
          <div>
            <div style={labelStyle}>QTY</div>
            <div
              className="font-[var(--font-mono)] text-xs font-bold text-[var(--color-text)]"
            >
              {req.quantity_requested.toLocaleString()} {req.unit_of_issue}
            </div>
          </div>
          <div>
            <div style={labelStyle}>REQUESTED BY</div>
            <div
              className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)]"
            >
              {req.requested_by_name ?? `ID ${req.requested_by_id}`}
            </div>
          </div>
          <div>
            <div style={labelStyle}>SUBMITTED</div>
            <div
              className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)] flex items-center gap-1"
            >
              <Clock size={10} className="text-[var(--color-text-muted)]" />
              {req.submitted_at ? new Date(req.submitted_at).toLocaleDateString() : '--'}
            </div>
          </div>
        </div>

        {req.justification && (
          <div
            className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] py-1.5 px-2 bg-[var(--color-bg)] rounded-[var(--radius)] leading-normal"
          >
            {req.justification}
          </div>
        )}
      </div>

      {/* Action footer */}
      <div
        className="flex gap-1.5 py-2.5 px-3.5 border-t border-t-[var(--color-border)] flex-wrap items-center"
      >
        {!showApproveConfirm && !showDenyInput && (
          <>
            <button
              style={btnStyle('var(--color-success)')}
              onClick={() => setShowApproveConfirm(true)}
            >
              <Check size={11} /> APPROVE
            </button>
            <button
              style={btnStyle('var(--color-danger)')}
              onClick={() => setShowDenyInput(true)}
            >
              <XCircle size={11} /> DENY
            </button>
          </>
        )}

        {showApproveConfirm && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span style={{ ...labelStyle, marginBottom: 0 }}>QTY:</span>
            <input
              type="number"
              value={approveQty}
              onChange={(e) => setApproveQty(Number(e.target.value))}
              className="w-[70px] py-1 px-1.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text)] font-[var(--font-mono)] text-[11px]"
            />
            <button
              style={btnStyle('var(--color-success)')}
              onClick={() => approveMut.mutate()}
              disabled={approveMut.isPending}
            >
              <Check size={11} /> CONFIRM
            </button>
            <button
              style={btnStyle('var(--color-text-muted)')}
              onClick={() => setShowApproveConfirm(false)}
            >
              CANCEL
            </button>
          </div>
        )}

        {showDenyInput && (
          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            <input
              type="text"
              placeholder="Reason for denial..."
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              className="flex-1 min-w-[120px] py-1 px-1.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text)] font-[var(--font-mono)] text-[11px]"
            />
            <button
              style={btnStyle('var(--color-danger)')}
              onClick={() => denyMut.mutate()}
              disabled={denyMut.isPending || !denyReason.trim()}
            >
              <XCircle size={11} /> DENY
            </button>
            <button
              style={btnStyle('var(--color-text-muted)')}
              onClick={() => { setShowDenyInput(false); setDenyReason(''); }}
            >
              CANCEL
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ApprovalQueueProps {
  requisitions: Requisition[];
  onRefresh?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ApprovalQueue({ requisitions, onRefresh }: ApprovalQueueProps) {
  const pending = requisitions.filter((r) => r.status === 'SUBMITTED');

  if (pending.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardCheck size={32} />}
        title="NO PENDING APPROVALS"
        message="Requisitions pending approval will appear here"
      />
    );
  }

  return (
    <div
      className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(340px,1fr))]"
    >
      {pending.map((req) => (
        <ApprovalCard key={req.id} req={req} onRefresh={onRefresh} />
      ))}
    </div>
  );
}
