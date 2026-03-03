import { Marker, Tooltip } from 'react-leaflet';
import type { MapUnit } from '@/api/map';
import { useMilSymbolIcon } from '../symbols/MilSymbol';
import { getStatusColor } from '../symbols/symbolConfig';
import { useMapStore } from '@/stores/mapStore';

interface UnitLayerProps {
  units: MapUnit[];
  showSupplyOverlay: boolean;
}

function UnitMarker({
  unit,
  showSupplyOverlay,
}: {
  unit: MapUnit;
  showSupplyOverlay: boolean;
}) {
  const selectEntity = useMapStore((s) => s.selectEntity);
  const statusColor = showSupplyOverlay
    ? getStatusColor(unit.supply_status)
    : undefined;
  const icon = useMilSymbolIcon(unit.symbol_sidc, 35, statusColor);

  return (
    <Marker
      position={[unit.latitude, unit.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => selectEntity('unit', unit.unit_id, unit),
      }}
    >
      <Tooltip
        direction="top"
        offset={[0, -20]}
        opacity={0.95}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '1px',
            color: '#111',
            padding: '2px 4px',
          }}
        >
          {unit.abbreviation}
        </div>
      </Tooltip>
    </Marker>
  );
}

export default function UnitLayer({ units, showSupplyOverlay }: UnitLayerProps) {
  return (
    <>
      {units.map((unit) => (
        <UnitMarker
          key={unit.unit_id}
          unit={unit}
          showSupplyOverlay={showSupplyOverlay}
        />
      ))}
    </>
  );
}
