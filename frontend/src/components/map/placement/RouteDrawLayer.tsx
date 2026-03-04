import { useCallback, useMemo } from 'react';
import { useMapEvents, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useMapStore } from '@/stores/mapStore';

function createWaypointIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    html: `<div style="
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background-color: ${color};
      border: 2px solid #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.5);
    "></div>`,
  });
}

const greenIcon = createWaypointIcon('#4ade80');
const redIcon = createWaypointIcon('#f87171');
const blueIcon = createWaypointIcon('#60a5fa');

function getWaypointIcon(index: number, total: number): L.DivIcon {
  if (index === 0) return greenIcon;
  if (index === total - 1 && total > 1) return redIcon;
  return blueIcon;
}

function RouteDrawClickHandler() {
  const addingWaypoint = useMapStore((s) => s.routeDrawing.addingWaypoint);
  const addRouteWaypoint = useMapStore((s) => s.addRouteWaypoint);

  useMapEvents({
    click(e) {
      if (addingWaypoint) {
        addRouteWaypoint(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return null;
}

export default function RouteDrawLayer() {
  const routeDrawing = useMapStore((s) => s.routeDrawing);
  const updateRouteWaypoint = useMapStore((s) => s.updateRouteWaypoint);

  const handleDragEnd = useCallback(
    (index: number, e: L.DragEndEvent) => {
      const marker = e.target as L.Marker;
      const pos = marker.getLatLng();
      updateRouteWaypoint(index, pos.lat, pos.lng);
    },
    [updateRouteWaypoint],
  );

  const polylinePositions = useMemo(
    () =>
      routeDrawing.waypoints.map(
        (wp) => [wp.lat, wp.lon] as [number, number],
      ),
    [routeDrawing.waypoints],
  );

  if (!routeDrawing.active) return null;

  return (
    <>
      <RouteDrawClickHandler />

      {/* Polyline connecting waypoints */}
      {routeDrawing.waypoints.length >= 2 && (
        <Polyline
          positions={polylinePositions}
          pathOptions={{
            color: '#60a5fa',
            weight: 3,
            dashArray: '10 6',
            opacity: 0.8,
          }}
        />
      )}

      {/* Waypoint markers */}
      {routeDrawing.waypoints.map((wp, idx) => (
        <Marker
          key={`route-wp-${idx}`}
          position={[wp.lat, wp.lon]}
          icon={getWaypointIcon(idx, routeDrawing.waypoints.length)}
          draggable
          eventHandlers={{
            dragend: (e) => handleDragEnd(idx, e),
          }}
        />
      ))}
    </>
  );
}
