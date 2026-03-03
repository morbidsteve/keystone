import { useRef, useMemo, useCallback } from 'react';
import { Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';

interface DraggableMarkerProps {
  position: [number, number];
  onPositionChange: (lat: number, lon: number) => void;
  showGhostLine?: boolean;
  originalPosition?: [number, number];
}

function createDragIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    html: `<div style="
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #60a5fa;
      border: 2px solid #fff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    ">
      <div style="
        width: 8px;
        height: 8px;
        background: #fff;
        border-radius: 50%;
      "></div>
    </div>`,
  });
}

export default function DraggableMarker({
  position,
  onPositionChange,
  showGhostLine = false,
  originalPosition,
}: DraggableMarkerProps) {
  const markerRef = useRef<L.Marker>(null);
  const icon = useMemo(() => createDragIcon(), []);

  const handleDragEnd = useCallback(() => {
    const marker = markerRef.current;
    if (marker) {
      const latlng = marker.getLatLng();
      onPositionChange(latlng.lat, latlng.lng);
    }
  }, [onPositionChange]);

  return (
    <>
      {showGhostLine && originalPosition && (
        <Polyline
          positions={[originalPosition, position]}
          pathOptions={{
            color: '#60a5fa',
            weight: 2,
            dashArray: '6 4',
            opacity: 0.6,
          }}
        />
      )}
      <Marker
        ref={markerRef}
        position={position}
        icon={icon}
        draggable={true}
        eventHandlers={{
          dragend: handleDragEnd,
        }}
      />
    </>
  );
}
