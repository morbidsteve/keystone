import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useMemo } from 'react';
import type { MapSupplyPoint } from '@/api/map';
import { useMapStore } from '@/stores/mapStore';

interface SupplyPointLayerProps {
  supplyPoints: MapSupplyPoint[];
}

function getPointIcon(pointType: string): string {
  switch (pointType) {
    case 'LOG_BASE':
      return 'L';
    case 'SUPPLY_POINT':
      return 'S';
    case 'FARP':
      return 'F';
    case 'LZ':
      return 'H';
    case 'AMMO_SUPPLY_POINT':
      return 'A';
    case 'WATER_POINT':
      return 'W';
    case 'MAINTENANCE_COLLECTION_POINT':
      return 'M';
    case 'BEACH':
    case 'PORT':
      return 'P';
    default:
      return 'S';
  }
}

function getPointStatusColor(status: string): string {
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

function createSupplyPointIcon(pointType: string, status: string): L.DivIcon {
  const letter = getPointIcon(pointType);
  const color = getPointStatusColor(status);

  return L.divIcon({
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
    html: `<div style="
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: ${color};
      border: 2px solid rgba(255,255,255,0.8);
      border-radius: 4px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      font-family: monospace;
      font-size: 12px;
      font-weight: 700;
      color: #fff;
    ">${letter}</div>`,
  });
}

function SupplyPointMarker({ sp }: { sp: MapSupplyPoint }) {
  const selectEntity = useMapStore((s) => s.selectEntity);
  const icon = useMemo(
    () => createSupplyPointIcon(sp.point_type, sp.status),
    [sp.point_type, sp.status],
  );

  return (
    <Marker
      position={[sp.latitude, sp.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => selectEntity('supplyPoint', sp.id, sp),
      }}
    >
      <Tooltip direction="top" offset={[0, -12]} opacity={0.95}>
        <div
          className="font-[var(--font-mono)] text-[9px] font-bold tracking-[1px] text-[#111] py-0.5 px-1"
        >
          {sp.name}
        </div>
      </Tooltip>
    </Marker>
  );
}

export default function SupplyPointLayer({ supplyPoints }: SupplyPointLayerProps) {
  return (
    <>
      {supplyPoints.map((sp) => (
        <SupplyPointMarker key={sp.id} sp={sp} />
      ))}
    </>
  );
}
