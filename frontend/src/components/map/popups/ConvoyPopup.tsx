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
      style={{
        minWidth: 240,
        maxWidth: 280,
        fontFamily: 'var(--font-mono)',
        backgroundColor: 'var(--color-bg-elevated)',
        color: 'var(--color-text)',
        padding: 12,
        borderRadius: 'var(--radius)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--color-text-bright)',
            letterSpacing: '0.5px',
          }}
        >
          {convoy.name}
        </div>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 10,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '1px',
            color: '#fff',
            backgroundColor: getConvoyStatusColor(convoy.status),
            textTransform: 'uppercase',
          }}
        >
          {getConvoyStatusLabel(convoy.status)}
        </span>
      </div>

      {/* Route */}
      <div
        style={{
          fontSize: 10,
          padding: '6px 0',
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--color-success)', fontSize: 10 }}>{'\u25CF'}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>FROM:</span>
          <span style={{ color: 'var(--color-text-bright)' }}>{convoy.origin.name}</span>
        </div>
        <div
          style={{
            borderLeft: '1px dashed var(--color-border)',
            marginLeft: 4,
            height: 8,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--color-accent)', fontSize: 10 }}>{'\u25CF'}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>TO:</span>
          <span style={{ color: 'var(--color-text-bright)' }}>{convoy.destination.name}</span>
        </div>
      </div>

      {/* Details grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px 12px',
          fontSize: 9,
          marginBottom: 8,
        }}
      >
        <div>
          <div style={{ color: 'var(--color-text-muted)', marginBottom: 1 }}>VEHICLES</div>
          <div style={{ color: 'var(--color-text-bright)', fontWeight: 600 }}>
            {convoy.vehicle_count}
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--color-text-muted)', marginBottom: 1 }}>CARGO</div>
          <div style={{ color: 'var(--color-text-bright)', fontWeight: 600 }}>
            {convoy.cargo_summary}
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--color-text-muted)', marginBottom: 1 }}>DEPARTED</div>
          <div style={{ color: 'var(--color-text-bright)', fontWeight: 600 }}>
            {formatRelativeTime(convoy.departure_time)}
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--color-text-muted)', marginBottom: 1 }}>ETA</div>
          <div style={{ color: 'var(--color-text-bright)', fontWeight: 600 }}>
            {formatRelativeTime(convoy.eta)}
          </div>
        </div>
      </div>

      {/* Speed and heading */}
      {convoy.speed_kph > 0 && (
        <div
          style={{
            fontSize: 9,
            padding: '4px 0',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            gap: 16,
            color: 'var(--color-text-muted)',
          }}
        >
          <span>
            SPEED:{' '}
            <span style={{ color: 'var(--color-text-bright)', fontWeight: 600 }}>
              {convoy.speed_kph} KPH
            </span>
          </span>
          <span>
            HDG:{' '}
            <span style={{ color: 'var(--color-text-bright)', fontWeight: 600 }}>
              {convoy.heading}{'\u00B0'}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
