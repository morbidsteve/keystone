import type { MapConvoy } from '@/api/map';
import { formatRelativeTime } from '@/lib/utils';

interface ConvoyPopupProps {
  convoy: MapConvoy;
}

function getConvoyStatusColor(status: string): string {
  switch (status) {
    case 'EN_ROUTE':
      return '#40c057';
    case 'DELAYED':
      return '#fab005';
    case 'PLANNED':
      return '#868e96';
    case 'COMPLETE':
      return '#4dabf7';
    case 'CANCELLED':
      return '#ff6b6b';
    default:
      return '#868e96';
  }
}

function getConvoyStatusLabel(status: string): string {
  switch (status) {
    case 'EN_ROUTE':
      return 'EN ROUTE';
    case 'DELAYED':
      return 'DELAYED';
    case 'PLANNED':
      return 'PLANNED';
    case 'COMPLETE':
      return 'COMPLETE';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return status;
  }
}

export default function ConvoyPopup({ convoy }: ConvoyPopupProps) {
  return (
    <div
      className="min-w-[240px] max-w-[280px] font-[var(--font-mono)] bg-[var(--color-bg-elevated)] text-[var(--color-text)] p-3 rounded-[var(--radius)]"
    >
      {/* Header */}
      <div
        className="flex justify-between items-center mb-2"
      >
        <div
          className="text-xs font-bold text-[var(--color-text-bright)] tracking-[0.5px]"
        >
          {convoy.name}
        </div>
        <span
          className="inline-block py-0.5 px-2 rounded-[10px] text-[9px] font-bold tracking-[1px] text-[#fff] uppercase" style={{ backgroundColor: getConvoyStatusColor(convoy.status) }}
        >
          {getConvoyStatusLabel(convoy.status)}
        </span>
      </div>

      {/* Route */}
      <div
        className="text-[10px] py-1.5 px-0 border-t border-t-[var(--color-border)] border-b border-b-[var(--color-border)] mb-2"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--color-success)] text-[10px]">{'\u25CF'}</span>
          <span className="text-[var(--color-text-muted)]">FROM:</span>
          <span className="text-[var(--color-text-bright)]">{convoy.origin.name}</span>
        </div>
        <div
          className="ml-1 h-[8px]" style={{ borderLeft: '1px dashed var(--color-border)' }}
        />
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--color-accent)] text-[10px]">{'\u25CF'}</span>
          <span className="text-[var(--color-text-muted)]">TO:</span>
          <span className="text-[var(--color-text-bright)]">{convoy.destination.name}</span>
        </div>
      </div>

      {/* Details grid */}
      <div
        className="grid text-[9px] mb-2" style={{ gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}
      >
        <div>
          <div className="text-[var(--color-text-muted)] mb-px">VEHICLES</div>
          <div className="text-[var(--color-text-bright)] font-semibold">
            {convoy.vehicle_count}
          </div>
        </div>
        <div>
          <div className="text-[var(--color-text-muted)] mb-px">CARGO</div>
          <div className="text-[var(--color-text-bright)] font-semibold">
            {convoy.cargo_summary}
          </div>
        </div>
        <div>
          <div className="text-[var(--color-text-muted)] mb-px">DEPARTED</div>
          <div className="text-[var(--color-text-bright)] font-semibold">
            {formatRelativeTime(convoy.departure_time)}
          </div>
        </div>
        <div>
          <div className="text-[var(--color-text-muted)] mb-px">ETA</div>
          <div className="text-[var(--color-text-bright)] font-semibold">
            {formatRelativeTime(convoy.eta)}
          </div>
        </div>
      </div>

      {/* Speed and heading */}
      {convoy.speed_kph > 0 && (
        <div
          className="text-[9px] py-1 px-0 border-t border-t-[var(--color-border)] flex gap-4 text-[var(--color-text-muted)]"
        >
          <span>
            SPEED:{' '}
            <span className="text-[var(--color-text-bright)] font-semibold">
              {convoy.speed_kph} KPH
            </span>
          </span>
          <span>
            HDG:{' '}
            <span className="text-[var(--color-text-bright)] font-semibold">
              {convoy.heading}{'\u00B0'}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
