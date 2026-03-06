// =============================================================================
// RequisitionDetail — Detail panel for a single requisition
// =============================================================================

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  Check,
  XCircle,
  PackageCheck,
  Package,
  Truck,
  Ban,
  Clock,
} from 'lucide-react';
import type { Requisition, RequisitionStatus } from '@/lib/types';
import {
  submitRequisition,
  approveRequisition,
  denyRequisition,
  processRequisition,
  shipRequisition,
  receiveRequisition,
  cancelRequisition,
} from '@/api/requisitions';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusColor(s: RequisitionStatus): string {
  switch (s) {
    case 'DRAFT': return 'var(--color-text-muted)';
    case 'SUBMITTED': return 'var(--color-accent)';
    case 'APPROVED': return 'var(--color-success)';
    case 'DENIED': return 'var(--color-danger)';
    case 'SOURCING': return 'var(--color-warning)';
    case 'BACKORDERED': return '#c084fc';
    case 'SHIPPED': return '#a78bfa';
    case 'RECEIVED': return 'var(--color-success)';
    case 'CANCELED': return 'var(--color-text-muted)';
    default: return 'var(--color-text-muted)';
  }
}

function priorityLabel(p: string): string {
  if (p === '01') return 'ROUTINE';
  if (p === '02') return 'URGENT';
  if (p === '03') return 'EMERGENCY';
  return `PRI ${p}`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RequisitionDetailProps {
  requisition: Requisition;
  onRefresh?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RequisitionDetail({ requisition, onRefresh }: RequisitionDetailProps) {
  const queryClient = useQueryClient();
  const [denyReason, setDenyReason] = useState('');
  const [showDenyInput, setShowDenyInput] = useState(false);
  const [approveQty, setApproveQty] = useState<number>(requisition.quantity_requested);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['requisitions'] });
    onRefresh?.();
  };

  const submitMut = useMutation({ mutationFn: () => submitRequisition(requisition.id), onSuccess: invalidateAll });
  const approveMut = useMutation({
    mutationFn: () => approveRequisition(requisition.id, { quantity_approved: approveQty }),
    onSuccess: () => { setShowApproveConfirm(false); invalidateAll(); },
  });
  const denyMut = useMutation({
    mutationFn: () => denyRequisition(requisition.id, { reason: denyReason }),
    onSuccess: () => { setShowDenyInput(false); invalidateAll(); },
  });

  const processMut = useMutation({ mutationFn: () => processRequisition(requisition.id), onSuccess: invalidateAll });
  const shipMut = useMutation({ mutationFn: () => shipRequisition(requisition.id), onSuccess: invalidateAll });
  const receiveMut = useMutation({ mutationFn: () => receiveRequisition(requisition.id, {}), onSuccess: invalidateAll });
  const cancelMut = useMutation({ mutationFn: () => cancelRequisition(requisition.id), onSuccess: invalidateAll });

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: 'var(--color-text-muted)',
    marginBottom: 2,
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--color-text-bright)',
  };

  const btnStyle = (color: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
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

  const canSubmit = requisition.status === 'DRAFT';
  const canApprove = requisition.status === 'SUBMITTED';
  const canDeny = requisition.status === 'SUBMITTED';
  const canProcess = requisition.status === 'APPROVED';
  const canShip = requisition.status === 'SOURCING';
  const canReceive = requisition.status === 'SHIPPED';
  const canCancel = ['DRAFT', 'SUBMITTED', 'APPROVED'].includes(requisition.status);

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span
          className="font-[var(--font-mono)] text-[13px] font-bold text-[var(--color-text-bright)] tracking-[1px]"
        >
          {requisition.requisition_number}
        </span>
        <span
          className="inline-block py-0.5 px-2 rounded-[2px] text-[10px] font-bold tracking-[0.5px] font-[var(--font-mono)]" style={{ color: statusColor(requisition.status), border: `1px solid ${statusColor(requisition.status)}`, backgroundColor: `color-mix(in srgb, ${statusColor(requisition.status)} 10%, transparent)` }}
        >
          {requisition.status}
        </span>
      </div>

      {/* Status Stepper */}
      {requisition.status !== 'DENIED' && requisition.status !== 'CANCELED' ? (
        <div className="flex items-center gap-0 py-1 px-0">
          {(['SUBMITTED', 'APPROVED', 'SOURCING', 'SHIPPED', 'RECEIVED'] as const).map((step, idx) => {
            const STATUS_ORDER: Record<string, number> = {
              DRAFT: 0, SUBMITTED: 1, APPROVED: 2, SOURCING: 3, BACKORDERED: 3, SHIPPED: 4, RECEIVED: 5, DENIED: -1, CANCELED: -1,
            };
            const currentIdx = STATUS_ORDER[requisition.status] ?? 0;
            const stepIdx = STATUS_ORDER[step];
            const isCompleted = currentIdx > stepIdx;
            const isCurrent = currentIdx === stepIdx;
            return (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center min-w-[70px]">
                  <div
                    className="w-[24px] h-[24px] flex items-center justify-center font-[var(--font-mono)] text-[10px] font-bold" style={{ borderRadius: '50%', backgroundColor: isCompleted ? 'var(--color-success)' : isCurrent ? 'var(--color-accent)' : 'var(--color-bg-elevated)', color: isCompleted || isCurrent ? '#fff' : 'var(--color-text-muted)', border: isCurrent ? '2px solid rgba(77, 171, 247, 0.5)' : '1px solid var(--color-border)', transition: 'all var(--transition)' }}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <span className="font-[var(--font-mono)] text-[8px] font-semibold tracking-[0.5px] mt-1" style={{ color: isCompleted || isCurrent ? 'var(--color-text-bright)' : 'var(--color-text-muted)' }}>
                    {step}
                  </span>
                </div>
                {idx < 4 && (
                  <div className="flex-1 h-[2px] min-w-[20px] mb-4" style={{ backgroundColor: isCompleted ? 'var(--color-success)' : 'var(--color-border)', transition: 'background-color var(--transition)' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        <div className="py-1.5 px-3 rounded-[var(--radius)] font-[var(--font-mono)] text-[11px] font-bold" style={{ backgroundColor: requisition.status === 'DENIED' ? 'rgba(255, 107, 107, 0.1)' : 'rgba(148, 163, 184, 0.1)', border: `1px solid ${requisition.status === 'DENIED' ? 'rgba(255, 107, 107, 0.2)' : 'rgba(148, 163, 184, 0.2)'}`, color: requisition.status === 'DENIED' ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
          {requisition.status === 'DENIED' ? '✗ DENIED' : '⊗ CANCELED'}
        </div>
      )}

      {/* Info grid */}
      <div
        className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
      >
        <div>
          <div style={labelStyle}>NOMENCLATURE</div>
          <div style={valueStyle}>{requisition.nomenclature}</div>
        </div>
        {requisition.nsn && (
          <div>
            <div style={labelStyle}>NSN</div>
            <div style={valueStyle}>{requisition.nsn}</div>
          </div>
        )}
        {requisition.dodic && (
          <div>
            <div style={labelStyle}>DODIC</div>
            <div style={valueStyle}>{requisition.dodic}</div>
          </div>
        )}
        <div>
          <div style={labelStyle}>UNIT</div>
          <div style={valueStyle}>Unit {requisition.unit_id}</div>
        </div>
        <div>
          <div style={labelStyle}>REQUESTED BY</div>
          <div style={valueStyle}>{requisition.requested_by_name ?? `ID ${requisition.requested_by_id}`}</div>
        </div>
        <div>
          <div style={labelStyle}>PRIORITY</div>
          <div style={valueStyle}>{priorityLabel(requisition.priority)}</div>
        </div>
        <div>
          <div style={labelStyle}>UNIT OF ISSUE</div>
          <div style={valueStyle}>{requisition.unit_of_issue}</div>
        </div>
        {requisition.document_number && (
          <div>
            <div style={labelStyle}>DOCUMENT NUMBER</div>
            <div style={valueStyle}>{requisition.document_number}</div>
          </div>
        )}
      </div>

      {/* Justification */}
      {requisition.justification && (
        <div>
          <div style={labelStyle}>JUSTIFICATION</div>
          <div
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] leading-normal"
          >
            {requisition.justification}
          </div>
        </div>
      )}

      {/* Denial reason */}
      {requisition.denial_reason && (
        <div>
          <div style={{ ...labelStyle, color: 'var(--color-danger)' }}>DENIAL REASON</div>
          <div
            className="bg-[rgba(255,107,107,0.05)] rounded-[var(--radius)] text-[var(--color-danger)] leading-normal border border-[rgba(255,107,107,0.2)]"
          >
            {requisition.denial_reason}
          </div>
        </div>
      )}

      {/* Quantities */}
      <div
        className="flex gap-4 flex-wrap"
      >
        <div
          className="py-2.5 px-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] text-center min-w-[100px]"
        >
          <div style={labelStyle}>REQUESTED</div>
          <div className="font-bold">
            {requisition.quantity_requested.toLocaleString()}
          </div>
        </div>
        <div
          className="py-2.5 px-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] text-center min-w-[100px]"
        >
          <div style={labelStyle}>APPROVED</div>
          <div className="font-bold">
            {requisition.quantity_approved?.toLocaleString() ?? '--'}
          </div>
        </div>
        <div
          className="py-2.5 px-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] text-center min-w-[100px]"
        >
          <div style={labelStyle}>ISSUED</div>
          <div className="font-bold">
            {requisition.quantity_issued?.toLocaleString() ?? '--'}
          </div>
        </div>
      </div>

      {/* Timeline */}
      {requisition.status_history && requisition.status_history.length > 0 && (
        <div>
          <div style={{ ...labelStyle, marginBottom: 8 }}>STATUS HISTORY</div>
          <div className="flex flex-col gap-0">
            {requisition.status_history.map((entry, idx) => (
              <div
                key={entry.id}
                className="flex items-start gap-2.5 relative pl-5" style={{ paddingBottom: idx < requisition.status_history!.length - 1 ? 12 : 0 }}
              >
                {/* Timeline connector */}
                <div
                  className="absolute left-1.5 top-0 bottom-0 w-[1px]" style={{ backgroundColor: idx < requisition.status_history!.length - 1
                      ? 'var(--color-border-strong)'
                      : 'transparent' }}
                />
                {/* Dot */}
                <div
                  className="absolute left-px top-1 w-[9px] h-[9px] z-[1]" style={{ borderRadius: '50%', backgroundColor: statusColor(entry.new_status), border: '2px solid var(--color-bg)' }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-[var(--font-mono)] text-[10px] font-bold" style={{ color: statusColor(entry.new_status) }}
                    >
                      {entry.new_status}
                    </span>
                    <Clock size={10} className="text-[var(--color-text-muted)]" />
                    <span
                      className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
                    >
                      {new Date(entry.changed_at).toLocaleString()}
                    </span>
                  </div>
                  <div
                    className="font-[var(--font-mono)] text-[10px] text-[var(--color-text)] mt-0.5"
                  >
                    {entry.changed_by_name ?? `User ${entry.changed_by_id}`}
                    {entry.notes && (
                      <span className="text-[var(--color-text-muted)] ml-1.5">
                        — {entry.notes}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approvals */}
      {requisition.approvals && requisition.approvals.length > 0 && (
        <div>
          <div style={{ ...labelStyle, marginBottom: 8 }}>APPROVAL RECORDS</div>
          {requisition.approvals.map((a) => (
            <div
              key={a.id}
              className="py-2 px-2.5 bg-[var(--color-bg-elevated)] rounded-[var(--radius)] mb-1.5" style={{ border: `1px solid ${a.action === 'APPROVE' ? 'rgba(64, 192, 87, 0.2)' : 'rgba(255, 107, 107, 0.2)'}` }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="font-[var(--font-mono)] text-[10px] font-bold" style={{ color: a.action === 'APPROVE' ? 'var(--color-success)' : 'var(--color-danger)' }}
                >
                  {a.action}
                </span>
                <span
                  className="font-[var(--font-mono)] text-[10px] text-[var(--color-text)]"
                >
                  by {a.approver_name ?? `User ${a.approver_id}`}
                </span>
                <span
                  className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] ml-auto"
                >
                  {new Date(a.action_date).toLocaleString()}
                </span>
              </div>
              {a.comments && (
                <div
                  className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mt-1"
                >
                  {a.comments}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap items-start">
        {canSubmit && (
          <button
            style={btnStyle('var(--color-accent)')}
            onClick={() => submitMut.mutate()}
            disabled={submitMut.isPending}
          >
            <Send size={12} /> SUBMIT
          </button>
        )}
        {canApprove && !showApproveConfirm && (
          <button
            style={btnStyle('var(--color-success)')}
            onClick={() => setShowApproveConfirm(true)}
          >
            <Check size={12} /> APPROVE
          </button>
        )}
        {showApproveConfirm && (
          <div
            className="flex items-center gap-1.5 py-1 px-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)]"
          >
            <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]">QTY:</span>
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
              <Check size={12} /> CONFIRM
            </button>
            <button
              style={btnStyle('var(--color-text-muted)')}
              onClick={() => setShowApproveConfirm(false)}
            >
              CANCEL
            </button>
          </div>
        )}
        {canDeny && !showDenyInput && (
          <button
            style={btnStyle('var(--color-danger)')}
            onClick={() => setShowDenyInput(true)}
          >
            <XCircle size={12} /> DENY
          </button>
        )}
        {showDenyInput && (
          <div
            className="flex items-center gap-1.5 py-1 px-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)]"
          >
            <input
              type="text"
              placeholder="Denial reason..."
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              className="w-[200px] py-1 px-1.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text)] font-[var(--font-mono)] text-[11px]"
            />
            <button
              style={btnStyle('var(--color-danger)')}
              onClick={() => denyMut.mutate()}
              disabled={denyMut.isPending || !denyReason.trim()}
            >
              <XCircle size={12} /> DENY
            </button>
            <button
              style={btnStyle('var(--color-text-muted)')}
              onClick={() => { setShowDenyInput(false); setDenyReason(''); }}
            >
              CANCEL
            </button>
          </div>
        )}
        {canProcess && (
          <button
            style={btnStyle('var(--color-warning)')}
            onClick={() => processMut.mutate()}
            disabled={processMut.isPending}
          >
            <Package size={12} /> PROCESS
          </button>
        )}
        {canShip && (
          <button
            style={btnStyle('#a78bfa')}
            onClick={() => shipMut.mutate()}
            disabled={shipMut.isPending}
          >
            <Truck size={12} /> SHIP
          </button>
        )}
        {canReceive && (
          <button
            style={btnStyle('var(--color-success)')}
            onClick={() => receiveMut.mutate()}
            disabled={receiveMut.isPending}
          >
            <PackageCheck size={12} /> RECEIVE
          </button>
        )}
        {canCancel && (
          <button
            style={btnStyle('var(--color-text-muted)')}
            onClick={() => cancelMut.mutate()}
            disabled={cancelMut.isPending}
          >
            <Ban size={12} /> CANCEL
          </button>
        )}
      </div>
    </div>
  );
}
