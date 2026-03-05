// =============================================================================
// InventoryPanel — Shows inventory events for a unit
// =============================================================================

import { ClipboardCheck } from 'lucide-react';
import type { InventoryEvent } from '@/lib/types';

interface InventoryPanelProps {
  events: InventoryEvent[];
  loading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  PLANNED: '#6b7280',
  IN_PROGRESS: '#3b82f6',
  COMPLETED: '#22c55e',
  CANCELLED: '#f59e0b',
};

export default function InventoryPanel({ events, loading }: InventoryPanelProps) {
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div
          className="skeleton"
          style={{ width: 200, height: 16, margin: '0 auto 12px' }}
        />
        <div
          className="skeleton"
          style={{ width: 300, height: 12, margin: '0 auto' }}
        />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
        }}
      >
        <ClipboardCheck size={24} style={{ opacity: 0.4, marginBottom: 8 }} />
        <div>No inventory events found</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Summary stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 10,
          marginBottom: 8,
        }}
      >
        {[
          {
            label: 'TOTAL EVENTS',
            value: events.length.toString(),
            color: 'var(--color-text-bright)',
          },
          {
            label: 'ITEMS EXPECTED',
            value: events.length > 0 ? events[0].total_items_expected.toString() : '0',
            color: '#3b82f6',
          },
          {
            label: 'LAST VERIFIED',
            value: events.length > 0 ? events[0].total_items_verified.toString() : '0',
            color: '#22c55e',
          },
          {
            label: 'DISCREPANCIES',
            value: events.reduce((sum, e) => sum + e.discrepancies, 0).toString(),
            color: events.some((e) => e.discrepancies > 0) ? '#ef4444' : '#22c55e',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 8,
                fontWeight: 600,
                letterSpacing: '1.5px',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 18,
                fontWeight: 700,
                color: stat.color,
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Event list */}
      {events.map((event) => {
        const statusColor = STATUS_COLORS[event.status] ?? '#6b7280';

        return (
          <div
            key={event.id}
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              borderLeft: `3px solid ${statusColor}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--color-text-bright)',
                  }}
                >
                  {event.inventory_type} INVENTORY
                </span>
                <span
                  style={{
                    padding: '2px 6px',
                    borderRadius: 3,
                    backgroundColor: `${statusColor}20`,
                    color: statusColor,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                  }}
                >
                  {event.status.replace(/_/g, ' ')}
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                }}
              >
                {new Date(event.started_at).toLocaleString()}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 16,
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-text-muted)',
                marginBottom: event.notes ? 6 : 0,
              }}
            >
              <span>
                Conducted by: <strong style={{ color: 'var(--color-text)' }}>{event.conducted_by_name ?? 'Unknown'}</strong>
              </span>
              <span>
                Verified: <strong style={{ color: 'var(--color-text)' }}>{event.total_items_verified}/{event.total_items_expected}</strong>
              </span>
              {event.discrepancies > 0 && (
                <span style={{ color: '#ef4444' }}>
                  Discrepancies: <strong>{event.discrepancies}</strong>
                </span>
              )}
            </div>

            {event.notes && (
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  fontStyle: 'italic',
                  paddingTop: 4,
                  borderTop: '1px solid var(--color-border)',
                }}
              >
                {event.notes}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
