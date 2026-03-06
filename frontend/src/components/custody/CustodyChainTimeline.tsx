// =============================================================================
// CustodyChainTimeline — Vertical timeline of custody transfers
// =============================================================================

import { ArrowRight, GitBranch, User } from 'lucide-react';
import type { CustodyTransfer } from '@/lib/types';
import EmptyState from '@/components/ui/EmptyState';

interface CustodyChainTimelineProps {
  transfers: CustodyTransfer[];
  currentHolderName: string | null;
}

const TRANSFER_TYPE_COLORS: Record<string, string> = {
  ISSUE: '#22c55e',
  TURN_IN: '#6b7280',
  LATERAL_TRANSFER: '#8b5cf6',
  TEMPORARY_LOAN: '#f59e0b',
  MAINTENANCE_TURN_IN: '#6366f1',
  MAINTENANCE_RETURN: '#14b8a6',
  INVENTORY_ADJUSTMENT: '#ef4444',
};

export default function CustodyChainTimeline({
  transfers,
  currentHolderName,
}: CustodyChainTimelineProps) {
  return (
    <div className="flex flex-col gap-0">
      {/* Current holder banner */}
      {currentHolderName && (
        <div
          className="flex items-center gap-2.5 py-3 px-4 mb-4 bg-[rgba(34,197,94,0.08)] rounded-[var(--radius)]" style={{ border: '1px solid rgba(34, 197, 94, 0.25)' }}
        >
          <User size={14} className="text-[#22c55e]" />
          <div>
            <div
              className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] uppercase mb-0.5"
            >
              CURRENT HOLDER
            </div>
            <div
              className="font-[var(--font-mono)] text-xs font-bold text-[#22c55e]"
            >
              {currentHolderName}
            </div>
          </div>
        </div>
      )}

      {/* Timeline entries */}
      {transfers.length === 0 ? (
        <EmptyState
          icon={<GitBranch size={32} />}
          title="NO TRANSFER HISTORY"
          message="Custody transfer records will appear here"
        />
      ) : (
        transfers.map((transfer, idx) => {
          const color = TRANSFER_TYPE_COLORS[transfer.transfer_type] ?? '#6b7280';
          const isLast = idx === transfers.length - 1;

          return (
            <div
              key={transfer.id}
              className="flex gap-3 relative" style={{ paddingBottom: isLast ? 0 : 20 }}
            >
              {/* Timeline dot + line */}
              <div
                className="flex flex-col items-center w-[20px] shrink-0"
              >
                <div
                  className="w-[10px] h-[10px] shrink-0" style={{ borderRadius: '50%', backgroundColor: color, border: `2px solid ${color}` }}
                />
                {!isLast && (
                  <div
                    className="w-[2px] flex-1 bg-[var(--color-border)] mt-1"
                  />
                )}
              </div>

              {/* Content */}
              <div
                className="flex-1" style={{ padding: '0 0 4px' }}
              >
                <div
                  className="flex items-center gap-2 mb-1"
                >
                  <span
                    className="font-[var(--font-mono)] text-[10px] font-semibold text-[var(--color-text-muted)]"
                  >
                    {new Date(transfer.transfer_date).toLocaleString()}
                  </span>
                  <span
                    className="py-px px-1.5 rounded-[3px] font-[var(--font-mono)] text-[8px] font-bold tracking-[0.5px]" style={{ backgroundColor: `${color}20`, color: color }}
                  >
                    {transfer.transfer_type.replace(/_/g, ' ')}
                  </span>
                </div>

                <div
                  className="flex items-center gap-1.5 font-[var(--font-mono)] text-[11px] text-[var(--color-text)] mb-1"
                >
                  <span>{transfer.from_personnel_name ?? 'N/A'}</span>
                  <ArrowRight size={12} className="text-[var(--color-text-muted)] shrink-0" />
                  <span className="font-semibold">{transfer.to_personnel_name ?? 'N/A'}</span>
                </div>

                {transfer.document_number && (
                  <div
                    className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mb-0.5"
                  >
                    DOC: {transfer.document_number}
                  </div>
                )}

                {transfer.reason && (
                  <div
                    className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] italic"
                  >
                    {transfer.reason}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
