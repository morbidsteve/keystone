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
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        border: priorityBorder(req.priority),
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--color-accent)',
          }}
        >
          {req.requisition_number}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 6px',
            borderRadius: 2,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.5px',
            color: priorityColor(req.priority),
            border: `1px solid ${priorityColor(req.priority)}`,
            backgroundColor: `color-mix(in srgb, ${priorityColor(req.priority)} 10%, transparent)`,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {req.priority === '03' && <AlertTriangle size={9} />}
          {priorityLabel(req.priority)}
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--color-text-bright)',
          }}
        >
          {req.nomenclature}
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={labelStyle}>QTY</div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--color-text)',
              }}
            >
              {req.quantity_requested.toLocaleString()} {req.unit_of_issue}
            </div>
          </div>
          <div>
            <div style={labelStyle}>REQUESTED BY</div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-text)',
              }}
            >
              {req.requested_by_name ?? `ID ${req.requested_by_id}`}
            </div>
          </div>
          <div>
            <div style={labelStyle}>SUBMITTED</div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-text)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Clock size={10} style={{ color: 'var(--color-text-muted)' }} />
              {req.submitted_at ? new Date(req.submitted_at).toLocaleDateString() : '--'}
            </div>
          </div>
        </div>

        {req.justification && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-text-muted)',
              padding: '6px 8px',
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius)',
              lineHeight: 1.5,
            }}
          >
            {req.justification}
          </div>
        )}
      </div>

      {/* Action footer */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '10px 14px',
          borderTop: '1px solid var(--color-border)',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ ...labelStyle, marginBottom: 0 }}>QTY:</span>
            <input
              type="number"
              value={approveQty}
              onChange={(e) => setApproveQty(Number(e.target.value))}
              style={{
                width: 70,
                padding: '4px 6px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                color: 'var(--color-text)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
              }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
            <input
              type="text"
              placeholder="Reason for denial..."
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              style={{
                flex: 1,
                minWidth: 120,
                padding: '4px 6px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                color: 'var(--color-text)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
              }}
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
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 12,
      }}
    >
      {pending.map((req) => (
        <ApprovalCard key={req.id} req={req} onRefresh={onRefresh} />
      ))}
    </div>
  );
}
