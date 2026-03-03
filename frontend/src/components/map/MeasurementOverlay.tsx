import { useEffect, useCallback } from 'react';
import { useMapEvents, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import { useMapStore } from '@/stores/mapStore';

/**
 * Haversine formula to calculate distance between two lat/lon points.
 * Returns distance in kilometers.
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function MeasureClickHandler() {
  const measure = useMapStore((s) => s.measure);
  const setMeasureEnd = useMapStore((s) => s.setMeasureEnd);

  useMapEvents({
    click(e) {
      if (measure.active && measure.startPoint && !measure.endPoint) {
        setMeasureEnd(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return null;
}

export default function MeasurementOverlay() {
  const measure = useMapStore((s) => s.measure);
  const clearMeasure = useMapStore((s) => s.clearMeasure);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearMeasure();
      }
    },
    [clearMeasure],
  );

  useEffect(() => {
    if (measure.active) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [measure.active, handleEscape]);

  if (!measure.active || !measure.startPoint) {
    return null;
  }

  const startPos: [number, number] = measure.startPoint;

  if (!measure.endPoint) {
    return (
      <>
        <MeasureClickHandler />
        <CircleMarker
          center={startPos}
          radius={6}
          pathOptions={{
            color: '#60a5fa',
            fillColor: '#60a5fa',
            fillOpacity: 0.8,
            weight: 2,
          }}
        >
          <Tooltip direction="top" offset={[0, -10]} permanent>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                fontWeight: 700,
                color: '#111',
                padding: '2px 4px',
              }}
            >
              Click to set end point
            </div>
          </Tooltip>
        </CircleMarker>
      </>
    );
  }

  const endPos: [number, number] = measure.endPoint;
  const distanceKm = haversineDistance(startPos[0], startPos[1], endPos[0], endPos[1]);
  const distanceMi = distanceKm * 0.621371;
  const midpoint: [number, number] = [
    (startPos[0] + endPos[0]) / 2,
    (startPos[1] + endPos[1]) / 2,
  ];

  return (
    <>
      {/* Start marker */}
      <CircleMarker
        center={startPos}
        radius={6}
        pathOptions={{
          color: '#60a5fa',
          fillColor: '#60a5fa',
          fillOpacity: 0.8,
          weight: 2,
        }}
      />

      {/* End marker */}
      <CircleMarker
        center={endPos}
        radius={6}
        pathOptions={{
          color: '#f87171',
          fillColor: '#f87171',
          fillOpacity: 0.8,
          weight: 2,
        }}
      />

      {/* Measurement line */}
      <Polyline
        positions={[startPos, endPos]}
        pathOptions={{
          color: '#fbbf24',
          weight: 3,
          dashArray: '8 6',
          opacity: 0.9,
        }}
      >
        <Tooltip direction="top" offset={[0, -10]} permanent sticky={false}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: '#111',
              padding: '4px 6px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 700 }}>
              {distanceKm.toFixed(2)} km
            </div>
            <div style={{ fontSize: 9, color: '#555' }}>
              {distanceMi.toFixed(2)} mi
            </div>
            <div style={{ fontSize: 8, color: '#888', marginTop: 2 }}>
              Press Escape to exit
            </div>
          </div>
        </Tooltip>
      </Polyline>

      {/* Midpoint distance label (fallback if tooltip doesn't render well) */}
      <CircleMarker
        center={midpoint}
        radius={0}
        pathOptions={{ opacity: 0, fillOpacity: 0 }}
      />
    </>
  );
}
