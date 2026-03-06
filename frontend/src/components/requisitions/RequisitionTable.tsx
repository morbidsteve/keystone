// =============================================================================
// RequisitionTable — Sortable table of requisitions with expandable detail rows
// =============================================================================

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ChevronRight, ClipboardList } from 'lucide-react';
import type { Requisition, RequisitionStatus, RequisitionPriority } from '@/lib/types';
import EmptyState from '@/components/ui/EmptyState';
import RequisitionDetail from './RequisitionDetail';

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

type SortField = 'requisition_number' | 'nomenclature' | 'quantity_requested' | 'quantity_approved' | 'priority' | 'status' | 'created_at';
type SortDir = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RequisitionTableProps {
  requisitions: Requisition[];
  onRefresh?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RequisitionTable({ requisitions, onRefresh }: RequisitionTableProps) {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    const copy = [...requisitions];
    copy.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [requisitions, sortField, sortDir]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc'
      ? <ChevronUp size={10} className="ml-0.5" />
      : <ChevronDown size={10} className="ml-0.5" />;
  };

  const headerStyle: React.CSSProperties = {
    padding: '8px 10px',
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: 'var(--color-text-muted)',
    borderBottom: '1px solid var(--color-border)',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    textAlign: 'left',
  };

  const cellStyle: React.CSSProperties = {
    padding: '8px 10px',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--color-text)',
    borderBottom: '1px solid var(--color-border)',
    whiteSpace: 'nowrap',
  };

  if (requisitions.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList size={32} />}
        title="NO REQUISITIONS"
        message="Requisitions will appear here"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th style={{ ...headerStyle, width: 24 }} />
            <th style={headerStyle} onClick={() => handleSort('requisition_number')}>
              <span className="inline-flex items-center">REQ # <SortIcon field="requisition_number" /></span>
            </th>
            <th style={headerStyle} onClick={() => handleSort('nomenclature')}>
              <span className="inline-flex items-center">NOMENCLATURE <SortIcon field="nomenclature" /></span>
            </th>
            <th style={headerStyle} onClick={() => handleSort('quantity_requested')}>
              <span className="inline-flex items-center">QTY REQ <SortIcon field="quantity_requested" /></span>
            </th>
            <th style={headerStyle} onClick={() => handleSort('quantity_approved')}>
              <span className="inline-flex items-center">QTY APPR <SortIcon field="quantity_approved" /></span>
            </th>
            <th style={headerStyle} onClick={() => handleSort('priority')}>
              <span className="inline-flex items-center">PRIORITY <SortIcon field="priority" /></span>
            </th>
            <th style={headerStyle} onClick={() => handleSort('status')}>
              <span className="inline-flex items-center">STATUS <SortIcon field="status" /></span>
            </th>
            <th style={headerStyle} onClick={() => handleSort('created_at')}>
              <span className="inline-flex items-center">CREATED <SortIcon field="created_at" /></span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((req) => {
            const isExpanded = expandedId === req.id;
            return (
              <tr key={req.id} className="cursor-pointer">
                <td colSpan={8} className="p-0 border-0">
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    className="grid items-center" style={{ gridTemplateColumns: '24px 130px 1fr 80px 80px 100px 110px 90px', backgroundColor: isExpanded ? 'var(--color-bg-hover)' : 'transparent', transition: 'background-color var(--transition)' }}
                  >
                    <div className="items-center justify-center">
                      <ChevronRight
                        size={12}
                        className="text-[var(--color-text-muted)]" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform var(--transition)' }}
                      />
                    </div>
                    <div className="font-semibold">
                      {req.requisition_number}
                    </div>
                    <div className="text-ellipsis">
                      {req.nomenclature}
                    </div>
                    <div style={{ ...cellStyle, textAlign: 'right' }}>
                      {req.quantity_requested.toLocaleString()}
                    </div>
                    <div style={{ ...cellStyle, textAlign: 'right' }}>
                      {req.quantity_approved != null ? req.quantity_approved.toLocaleString() : '--'}
                    </div>
                    <div style={cellStyle}>
                      <span
                        className="inline-block py-0.5 px-1.5 rounded-[2px] text-[9px] font-bold tracking-[0.5px]" style={{ color: priorityColor(req.priority), border: `1px solid ${priorityColor(req.priority)}`, backgroundColor: `color-mix(in srgb, ${priorityColor(req.priority)} 10%, transparent)` }}
                      >
                        {priorityLabel(req.priority)}
                      </span>
                    </div>
                    <div style={cellStyle}>
                      <span
                        className="inline-block py-0.5 px-1.5 rounded-[2px] text-[9px] font-bold tracking-[0.5px]" style={{ color: statusColor(req.status), border: `1px solid ${statusColor(req.status)}`, backgroundColor: `color-mix(in srgb, ${statusColor(req.status)} 10%, transparent)` }}
                      >
                        {req.status}
                      </span>
                    </div>
                    <div className="text-[var(--color-text-muted)]">
                      {new Date(req.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {isExpanded && (
                    <div
                      className="border-t border-t-[var(--color-border)] border-b border-b-[var(--color-border)] bg-[var(--color-bg)]"
                    >
                      <RequisitionDetail requisition={req} onRefresh={onRefresh} />
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
