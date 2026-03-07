// =============================================================================
// InventoryPanel — Shows inventory events for a unit
// =============================================================================

import { ClipboardCheck } from 'lucide-react';
import type { InventoryEvent } from '@/lib/types';
import EmptyState from '@/components/ui/EmptyState';

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
      <div className="p-10 text-center">
        <div
          className="skeleton w-[200px] h-[16px] mx-auto mb-3"
        />
        <div
          className="skeleton w-[300px] h-[12px] mx-auto"
          
        />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardCheck size={32} />}
        title="NO INVENTORY EVENTS"
        message="Inventory events will appear here"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Summary stats */}
      <div
        className="grid gap-2.5 mb-2 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]"
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
            className="py-2.5 px-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)]"
          >
            <div
              className="font-[var(--font-mono)] text-[8px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] uppercase mb-1"
            >
              {stat.label}
            </div>
            <div
              className="font-[var(--font-mono)] text-lg font-bold" style={{ color: stat.color }}
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
            className="py-3 px-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)]" style={{ borderLeft: `3px solid ${statusColor}` }}
          >
            <div
              className="flex items-center justify-between mb-1.5"
            >
              <div className="flex items-center gap-2">
                <span
                  className="font-[var(--font-mono)] text-[11px] font-bold text-[var(--color-text-bright)]"
                >
                  {event.inventory_type.replace(/_/g, ' ')} INVENTORY
                </span>
                <span
                  className="py-0.5 px-1.5 rounded-[3px] font-[var(--font-mono)] text-[8px] font-bold tracking-[0.5px]" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                >
                  {event.status.replace(/_/g, ' ')}
                </span>
              </div>
              <span
                className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
              >
                {new Date(event.started_at).toLocaleString()}
              </span>
            </div>

            <div
              className="flex gap-4 font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]" style={{ marginBottom: event.notes ? 6 : 0 }}
            >
              <span>
                Conducted by: <strong className="text-[var(--color-text)]">{event.conducted_by_name ?? 'Unknown'}</strong>
              </span>
              <span>
                Verified: <strong className="text-[var(--color-text)]">{event.total_items_verified}/{event.total_items_expected}</strong>
              </span>
              {event.discrepancies > 0 && (
                <span className="text-[#ef4444]">
                  Discrepancies: <strong>{event.discrepancies}</strong>
                </span>
              )}
            </div>

            {event.notes && (
              <div
                className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] pt-1 border-t border-t-[var(--color-border)] italic"
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
