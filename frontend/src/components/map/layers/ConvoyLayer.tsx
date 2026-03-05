import { Marker, Polyline, Tooltip, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { useMemo } from 'react';
import type { MapConvoy, ConvoyMovementDetail } from '@/api/map';
import { useMapStore } from '@/stores/mapStore';
import ConvoyVehicleMarker from '../markers/ConvoyVehicleMarker';

interface ConvoyLayerProps {
  convoys: MapConvoy[];
  convoyMovements: ConvoyMovementDetail[];
  showRoutes: boolean;
  showVehicles: boolean;
}

function getConvoyRouteStyle(status: string): {
  color: string;
  weight: number;
  dashArray?: string;
  opacity: number;
} {
  switch (status) {
    case 'EN_ROUTE':
      return { color: '#40c057', weight: 3, opacity: 0.8 };
    case 'DELAYED':
      return { color: '#fab005', weight: 3, opacity: 0.8 };
    case 'PLANNED':
      return { color: '#868e96', weight: 2, dashArray: '8 6', opacity: 0.6 };
    case 'COMPLETE':
      return { color: '#40c057', weight: 2, opacity: 0.5 };
    default:
      return { color: '#868e96', weight: 2, opacity: 0.5 };
  }
}

function createTruckIcon(status: string): L.DivIcon {
  const color =
    status === 'EN_ROUTE'
      ? '#40c057'
      : status === 'DELAYED'
        ? '#fab005'
        : '#868e96';

  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
    html: `<div style="
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: ${color};
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      font-size: 14px;
      color: #fff;
    ">\u25B6</div>`,
  });
}

function ConvoyMarker({ convoy }: { convoy: MapConvoy }) {
  const selectEntity = useMapStore((s) => s.selectEntity);
  const truckIcon = useMemo(
    () => createTruckIcon(convoy.status),
    [convoy.status],
  );

  if (!convoy.current_position) return null;

  return (
    <Marker
      position={[convoy.current_position.lat, convoy.current_position.lon]}
      icon={truckIcon}
      eventHandlers={{
        click: () => selectEntity('convoy', convoy.convoy_id, convoy),
      }}
    >
      <Tooltip direction="top" offset={[0, -14]} opacity={0.95}>
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
          {convoy.name}
        </div>
      </Tooltip>
    </Marker>
  );
}

function ConvoyRoute({ convoy, progressPercent }: { convoy: MapConvoy; progressPercent?: number }) {
  const routeStyle = getConvoyRouteStyle(convoy.status);
  const positions = convoy.route_geometry.map(
    (point) => [point[0], point[1]] as [number, number],
  );

  if (positions.length < 2) return null;

  const origin = positions[0];
  const destination = positions[positions.length - 1];

  // Split route into completed and remaining based on progress
  const progress = progressPercent ?? (convoy.status === 'EN_ROUTE' ? 50 : 0);
  const splitIdx = Math.max(1, Math.floor((progress / 100) * (positions.length - 1)));
  const completedPositions = positions.slice(0, splitIdx + 1);
  const remainingPositions = positions.slice(splitIdx);

  return (
    <>
      {/* Completed portion (solid) */}
      {completedPositions.length >= 2 && (convoy.status === 'EN_ROUTE' || convoy.status === 'DELAYED') && (
        <Polyline
          positions={completedPositions}
          pathOptions={{
            color: routeStyle.color,
            weight: routeStyle.weight,
            opacity: routeStyle.opacity,
          }}
          interactive={false}
        />
      )}

      {/* Remaining or full route */}
      <Polyline
        positions={convoy.status === 'EN_ROUTE' || convoy.status === 'DELAYED' ? remainingPositions : positions}
        pathOptions={{
          color: routeStyle.color,
          weight: routeStyle.weight,
          dashArray: (convoy.status === 'EN_ROUTE' || convoy.status === 'DELAYED') ? '8 6' : routeStyle.dashArray,
          opacity: (convoy.status === 'EN_ROUTE' || convoy.status === 'DELAYED') ? 0.5 : routeStyle.opacity,
        }}
      >
        <Tooltip sticky opacity={0.9}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: '#111',
              padding: '2px 4px',
            }}
          >
            {convoy.name} | {convoy.status.replace('_', ' ')}
          </div>
        </Tooltip>
      </Polyline>

      {/* Origin marker */}
      <CircleMarker
        center={origin}
        radius={5}
        pathOptions={{
          color: '#fff',
          fillColor: routeStyle.color,
          fillOpacity: 1,
          weight: 2,
        }}
      >
        <Tooltip direction="bottom" offset={[0, 6]} opacity={0.9}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#111' }}>
            ORIGIN: {convoy.origin.name}
          </div>
        </Tooltip>
      </CircleMarker>

      {/* Destination marker */}
      <CircleMarker
        center={destination}
        radius={5}
        pathOptions={{
          color: '#fff',
          fillColor: '#4dabf7',
          fillOpacity: 1,
          weight: 2,
        }}
      >
        <Tooltip direction="bottom" offset={[0, 6]} opacity={0.9}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#111' }}>
            DEST: {convoy.destination.name}
          </div>
        </Tooltip>
      </CircleMarker>
    </>
  );
}

export default function ConvoyLayer({ convoys, convoyMovements, showRoutes, showVehicles }: ConvoyLayerProps) {
  // Build a set of convoy IDs that have vehicle detail data
  const movementMap = useMemo(() => {
    const map = new Map<string, ConvoyMovementDetail>();
    for (const m of convoyMovements) {
      map.set(m.convoy_id, m);
    }
    return map;
  }, [convoyMovements]);

  return (
    <>
      {convoys.map((convoy) => {
        const movement = movementMap.get(convoy.convoy_id);
        const hasVehicles = showVehicles && movement && movement.vehicles.length > 0;

        return (
          <span key={convoy.convoy_id}>
            {/* Show individual vehicle markers if we have detail data */}
            {hasVehicles
              ? movement.vehicles.map((vehicle, idx) => (
                  <ConvoyVehicleMarker
                    key={vehicle.vehicle_id}
                    vehicle={vehicle}
                    convoyId={convoy.convoy_id}
                    convoyName={convoy.name}
                    isLeadVehicle={idx === 0}
                  />
                ))
              : <ConvoyMarker convoy={convoy} />
            }
          </span>
        );
      })}

      {showRoutes &&
        convoys.map((convoy) => {
          const movement = movementMap.get(convoy.convoy_id);
          return (
            <ConvoyRoute
              key={`route-${convoy.convoy_id}`}
              convoy={convoy}
              progressPercent={movement?.progress_percent}
            />
          );
        })}
    </>
  );
}
