// =============================================================================
// CustodyChainTimeline — Vertical timeline of custody transfers
// =============================================================================

import { ArrowRight, User } from 'lucide-react';
import type { CustodyTransfer } from '@/lib/types';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Current holder banner */}
      {currentHolderName && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            marginBottom: 16,
            backgroundColor: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            borderRadius: 'var(--radius)',
          }}
        >
          <User size={14} style={{ color: '#22c55e' }} />
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '1.5px',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                marginBottom: 2,
              }}
            >
              CURRENT HOLDER
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
                color: '#22c55e',
              }}
            >
              {currentHolderName}
            </div>
          </div>
        </div>
      )}

      {/* Timeline entries */}
      {transfers.length === 0 ? (
        <div
          style={{
            padding: 24,
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
          }}
        >
          No transfer history
        </div>
      ) : (
        transfers.map((transfer, idx) => {
          const color = TRANSFER_TYPE_COLORS[transfer.transfer_type] ?? '#6b7280';
          const isLast = idx === transfers.length - 1;

          return (
            <div
              key={transfer.id}
              style={{
                display: 'flex',
                gap: 12,
                position: 'relative',
                paddingBottom: isLast ? 0 : 20,
              }}
            >
              {/* Timeline dot + line */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 20,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: `2px solid ${color}`,
                    flexShrink: 0,
                  }}
                />
                {!isLast && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      backgroundColor: 'var(--color-border)',
                      marginTop: 4,
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div
                style={{
                  flex: 1,
                  padding: '0 0 4px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {new Date(transfer.transfer_date).toLocaleString()}
                  </span>
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: 3,
                      backgroundColor: `${color}20`,
                      color: color,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                    }}
                  >
                    {transfer.transfer_type.replace(/_/g, ' ')}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--color-text)',
                    marginBottom: 4,
                  }}
                >
                  <span>{transfer.from_personnel_name ?? 'N/A'}</span>
                  <ArrowRight size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                  <span style={{ fontWeight: 600 }}>{transfer.to_personnel_name ?? 'N/A'}</span>
                </div>

                {transfer.document_number && (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: 'var(--color-text-muted)',
                      marginBottom: 2,
                    }}
                  >
                    DOC: {transfer.document_number}
                  </div>
                )}

                {transfer.reason && (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: 'var(--color-text-muted)',
                      fontStyle: 'italic',
                    }}
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
