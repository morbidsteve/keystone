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
        className="absolute bottom-2 left-2 z-[1000] bg-[rgba(0,0,0,0.75)] rounded-[4px] py-1 px-2 text-[11px] text-[#e2e8f0] leading-normal" style={{ border: '1px solid rgba(255, 255, 255, 0.1)', fontFamily: "'JetBrains Mono', monospace", pointerEvents: 'none', userSelect: 'none', backdropFilter: 'blur(4px)' }}
      >
        <div>{formatCoords(cursorPosition.lat, cursorPosition.lon)}</div>
        {mgrsStr && (
          <div className="text-[#60a5fa] text-[10px]">{mgrsStr}</div>
        )}
      </div>
    </>
  );
}
