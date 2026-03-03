import { Marker, Polyline, Popup, Tooltip, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { useMemo } from 'react';
import type { MapConvoy } from '@/api/map';
import ConvoyPopup from '../popups/ConvoyPopup';

interface ConvoyLayerProps {
  convoys: MapConvoy[];
  showRoutes: boolean;
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
  const truckIcon = useMemo(
    () => createTruckIcon(convoy.status),
    [convoy.status],
  );

  if (!convoy.current_position) return null;

  return (
    <Marker
      position={[convoy.current_position.lat, convoy.current_position.lon]}
      icon={truckIcon}
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
      <Popup maxWidth={300} minWidth={240} closeButton={true} className="keystone-popup">
        <ConvoyPopup convoy={convoy} />
      </Popup>
    </Marker>
  );
}

function ConvoyRoute({ convoy }: { convoy: MapConvoy }) {
  const routeStyle = getConvoyRouteStyle(convoy.status);
  const positions = convoy.route_geometry.map(
    (point) => [point[0], point[1]] as [number, number],
  );

  if (positions.length < 2) return null;

  const origin = positions[0];
  const destination = positions[positions.length - 1];

  return (
    <>
      <Polyline
        positions={positions}
        pathOptions={{
          color: routeStyle.color,
          weight: routeStyle.weight,
          dashArray: routeStyle.dashArray,
          opacity: routeStyle.opacity,
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
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: '#111',
            }}
          >
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
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: '#111',
            }}
          >
            DEST: {convoy.destination.name}
          </div>
        </Tooltip>
      </CircleMarker>
    </>
  );
}

export default function ConvoyLayer({ convoys, showRoutes }: ConvoyLayerProps) {
  return (
    <>
      {convoys.map((convoy) => (
        <ConvoyMarker key={convoy.convoy_id} convoy={convoy} />
      ))}
      {showRoutes &&
        convoys.map((convoy) => (
          <ConvoyRoute key={`route-${convoy.convoy_id}`} convoy={convoy} />
        ))}
    </>
  );
}
