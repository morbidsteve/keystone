// =============================================================================
// RequisitionDetail — Detail panel for a single requisition
// =============================================================================

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  Check,
  XCircle,
  PackageCheck,
  Ban,
  Clock,
} from 'lucide-react';
import type { Requisition, RequisitionStatus } from '@/lib/types';
import {
  submitRequisition,
  approveRequisition,
  denyRequisition,
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
  const canReceive = requisition.status === 'SHIPPED';
  const canCancel = ['DRAFT', 'SUBMITTED', 'APPROVED'].includes(requisition.status);

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--color-text-bright)',
            letterSpacing: '1px',
          }}
        >
          {requisition.requisition_number}
        </span>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 2,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.5px',
            color: statusColor(requisition.status),
            border: `1px solid ${statusColor(requisition.status)}`,
            backgroundColor: `color-mix(in srgb, ${statusColor(requisition.status)} 10%, transparent)`,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {requisition.status}
        </span>
      </div>

      {/* Info grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
        }}
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
            style={{
              ...valueStyle,
              padding: '8px 10px',
              backgroundColor: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              lineHeight: 1.5,
            }}
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
            style={{
              ...valueStyle,
              padding: '8px 10px',
              backgroundColor: 'rgba(255, 107, 107, 0.05)',
              border: '1px solid rgba(255, 107, 107, 0.2)',
              borderRadius: 'var(--radius)',
              color: 'var(--color-danger)',
              lineHeight: 1.5,
            }}
          >
            {requisition.denial_reason}
          </div>
        </div>
      )}

      {/* Quantities */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            minWidth: 100,
          }}
        >
          <div style={labelStyle}>REQUESTED</div>
          <div style={{ ...valueStyle, fontSize: 18, fontWeight: 700 }}>
            {requisition.quantity_requested.toLocaleString()}
          </div>
        </div>
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            minWidth: 100,
          }}
        >
          <div style={labelStyle}>APPROVED</div>
          <div style={{ ...valueStyle, fontSize: 18, fontWeight: 700 }}>
            {requisition.quantity_approved?.toLocaleString() ?? '--'}
          </div>
        </div>
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            minWidth: 100,
          }}
        >
          <div style={labelStyle}>ISSUED</div>
          <div style={{ ...valueStyle, fontSize: 18, fontWeight: 700 }}>
            {requisition.quantity_issued?.toLocaleString() ?? '--'}
          </div>
        </div>
      </div>

      {/* Timeline */}
      {requisition.status_history && requisition.status_history.length > 0 && (
        <div>
          <div style={{ ...labelStyle, marginBottom: 8 }}>STATUS HISTORY</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {requisition.status_history.map((entry, idx) => (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  position: 'relative',
                  paddingLeft: 20,
                  paddingBottom: idx < requisition.status_history!.length - 1 ? 12 : 0,
                }}
              >
                {/* Timeline connector */}
                <div
                  style={{
                    position: 'absolute',
                    left: 5,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    backgroundColor: idx < requisition.status_history!.length - 1
                      ? 'var(--color-border-strong)'
                      : 'transparent',
                  }}
                />
                {/* Dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: 1,
                    top: 4,
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    backgroundColor: statusColor(entry.new_status),
                    border: '2px solid var(--color-bg)',
                    zIndex: 1,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        fontWeight: 700,
                        color: statusColor(entry.new_status),
                      }}
                    >
                      {entry.new_status}
                    </span>
                    <Clock size={10} style={{ color: 'var(--color-text-muted)' }} />
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {new Date(entry.changed_at).toLocaleString()}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--color-text)',
                      marginTop: 2,
                    }}
                  >
                    {entry.changed_by_name ?? `User ${entry.changed_by_id}`}
                    {entry.notes && (
                      <span style={{ color: 'var(--color-text-muted)', marginLeft: 6 }}>
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
              style={{
                padding: '8px 10px',
                backgroundColor: 'var(--color-bg-elevated)',
                border: `1px solid ${a.action === 'APPROVE' ? 'rgba(64, 192, 87, 0.2)' : 'rgba(255, 107, 107, 0.2)'}`,
                borderRadius: 'var(--radius)',
                marginBottom: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    color: a.action === 'APPROVE' ? 'var(--color-success)' : 'var(--color-danger)',
                  }}
                >
                  {a.action}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-text)',
                  }}
                >
                  by {a.approver_name ?? `User ${a.approver_id}`}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--color-text-muted)',
                    marginLeft: 'auto',
                  }}
                >
                  {new Date(a.action_date).toLocaleString()}
                </span>
              </div>
              {a.comments && (
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-text-muted)',
                    marginTop: 4,
                  }}
                >
                  {a.comments}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
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
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              backgroundColor: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)' }}>QTY:</span>
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
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              backgroundColor: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
            }}
          >
            <input
              type="text"
              placeholder="Denial reason..."
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              style={{
                width: 200,
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
