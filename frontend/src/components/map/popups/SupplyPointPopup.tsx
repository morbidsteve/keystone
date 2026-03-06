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
      className="min-w-[200px] max-w-[260px] font-[var(--font-mono)] bg-[var(--color-bg-elevated)] text-[var(--color-text)] p-3 rounded-[var(--radius)]"
    >
      {/* Header */}
      <div
        className="flex justify-between items-start mb-2"
      >
        <div>
          <div
            className="text-xs font-bold text-[var(--color-text-bright)] tracking-[0.5px]"
          >
            {supplyPoint.name}
          </div>
          <div
            className="text-[9px] text-[var(--color-text-muted)] mt-0.5 tracking-[1px]"
          >
            {getPointTypeLabel(supplyPoint.point_type)}
          </div>
        </div>
        <span
          className="inline-block py-0.5 px-2 rounded-[10px] text-[9px] font-bold tracking-[1px] text-[#fff] uppercase" style={{ backgroundColor: getSpStatusColor(supplyPoint.status) }}
        >
          {supplyPoint.status}
        </span>
      </div>

      {/* Details */}
      <div
        className="text-[9px] border-t border-t-[var(--color-border)] pt-1.5"
      >
        <div className="mb-1">
          <span className="text-[var(--color-text-muted)]">OPERATING UNIT: </span>
          <span className="text-[var(--color-text-bright)] font-semibold">
            {supplyPoint.parent_unit_name}
          </span>
        </div>
        <div className="mb-1">
          <span className="text-[var(--color-text-muted)]">POSITION: </span>
          <span className="text-[var(--color-text-bright)]">
            {Math.abs(supplyPoint.latitude).toFixed(2)}{supplyPoint.latitude >= 0 ? 'N' : 'S'}, {Math.abs(supplyPoint.longitude).toFixed(2)}{supplyPoint.longitude >= 0 ? 'E' : 'W'}
          </span>
        </div>
        {supplyPoint.capacity_notes && (
          <div
            className="mt-1.5 py-1 px-1.5 bg-[rgba(255,255,255,0.03)] rounded-[var(--radius)] text-[var(--color-text-muted)] leading-[1.4]"
          >
            {supplyPoint.capacity_notes}
          </div>
        )}
      </div>
    </div>
  );
}
