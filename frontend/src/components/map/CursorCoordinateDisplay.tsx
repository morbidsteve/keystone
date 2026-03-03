import { useMapEvents } from 'react-leaflet';
import { useMapStore } from '@/stores/mapStore';
import { latLonToMGRS, formatCoords } from '@/utils/coordinates';

function CursorTracker() {
  const setCursorPosition = useMapStore((s) => s.setCursorPosition);

  useMapEvents({
    mousemove(e) {
      setCursorPosition({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
    mouseout() {
      setCursorPosition(null);
    },
  });

  return null;
}

export default function CursorCoordinateDisplay() {
  const cursorPosition = useMapStore((s) => s.cursorPosition);

  if (!cursorPosition) {
    return <CursorTracker />;
  }

  let mgrsStr = '';
  try {
    mgrsStr = latLonToMGRS(cursorPosition.lat, cursorPosition.lon);
  } catch {
    // MGRS conversion may fail for extreme coordinates
  }

  return (
    <>
      <CursorTracker />
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 4,
          padding: '4px 8px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: '#e2e8f0',
          pointerEvents: 'none',
          userSelect: 'none',
          lineHeight: 1.5,
          backdropFilter: 'blur(4px)',
        }}
      >
        <div>{formatCoords(cursorPosition.lat, cursorPosition.lon)}</div>
        {mgrsStr && (
          <div style={{ color: '#60a5fa', fontSize: 10 }}>{mgrsStr}</div>
        )}
      </div>
    </>
  );
}
