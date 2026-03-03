import type { MapSupplyPoint } from '@/api/map';

interface SupplyPointPopupProps {
  supplyPoint: MapSupplyPoint;
}

function getPointTypeLabel(type: string): string {
  switch (type) {
    case 'LOG_BASE':
      return 'LOGISTICS BASE';
    case 'SUPPLY_POINT':
      return 'SUPPLY POINT';
    case 'FARP':
      return 'FARP';
    case 'LZ':
      return 'LANDING ZONE';
    case 'AMMO_SUPPLY_POINT':
      return 'AMMO SUPPLY POINT';
    case 'WATER_POINT':
      return 'WATER POINT';
    case 'MAINTENANCE_COLLECTION_POINT':
      return 'MAINTENANCE CP';
    case 'BEACH':
      return 'BEACH';
    case 'PORT':
      return 'PORT';
    default:
      return type;
  }
}

function getSpStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return '#40c057';
    case 'PLANNED':
      return '#fab005';
    case 'INACTIVE':
      return '#ff6b6b';
    default:
      return '#868e96';
  }
}

export default function SupplyPointPopup({ supplyPoint }: SupplyPointPopupProps) {
  return (
    <div
      style={{
        minWidth: 200,
        maxWidth: 260,
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
          alignItems: 'flex-start',
          marginBottom: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--color-text-bright)',
              letterSpacing: '0.5px',
            }}
          >
            {supplyPoint.name}
          </div>
          <div
            style={{
              fontSize: 9,
              color: 'var(--color-text-muted)',
              marginTop: 2,
              letterSpacing: '1px',
            }}
          >
            {getPointTypeLabel(supplyPoint.point_type)}
          </div>
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
            backgroundColor: getSpStatusColor(supplyPoint.status),
            textTransform: 'uppercase',
          }}
        >
          {supplyPoint.status}
        </span>
      </div>

      {/* Details */}
      <div
        style={{
          fontSize: 9,
          borderTop: '1px solid var(--color-border)',
          paddingTop: 6,
        }}
      >
        <div style={{ marginBottom: 4 }}>
          <span style={{ color: 'var(--color-text-muted)' }}>OPERATING UNIT: </span>
          <span style={{ color: 'var(--color-text-bright)', fontWeight: 600 }}>
            {supplyPoint.parent_unit_name}
          </span>
        </div>
        <div style={{ marginBottom: 4 }}>
          <span style={{ color: 'var(--color-text-muted)' }}>POSITION: </span>
          <span style={{ color: 'var(--color-text-bright)' }}>
            {Math.abs(supplyPoint.latitude).toFixed(2)}{supplyPoint.latitude >= 0 ? 'N' : 'S'}, {Math.abs(supplyPoint.longitude).toFixed(2)}{supplyPoint.longitude >= 0 ? 'E' : 'W'}
          </span>
        </div>
        {supplyPoint.capacity_notes && (
          <div
            style={{
              marginTop: 6,
              padding: '4px 6px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: 'var(--radius)',
              color: 'var(--color-text-muted)',
              lineHeight: 1.4,
            }}
          >
            {supplyPoint.capacity_notes}
          </div>
        )}
      </div>
    </div>
  );
}
