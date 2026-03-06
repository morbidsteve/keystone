import { useMapData } from '@/hooks/useMapData';
import LogisticsMap from '@/components/map/LogisticsMap';

export default function MapPage() {
  const { units, convoys, convoyMovements, supplyPoints, routes, alerts, isLoading, isError, refetch } =
    useMapData();

  if (isLoading) {
    return (
      <div
        className="h-[calc(100vh - 48px)] flex items-center justify-center bg-[var(--color-bg)]"
      >
        <div
          className="flex flex-col items-center gap-3"
        >
          <div
            className="w-[32px] h-[32px]" style={{ border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}
          />
          <span
            className="font-[var(--font-mono)] text-[11px] tracking-[2px] text-[var(--color-text-muted)] uppercase"
          >
            LOADING MAP DATA...
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="h-[calc(100vh - 48px)] flex items-center justify-center bg-[var(--color-bg)]"
      >
        <div
          className="flex flex-col items-center gap-3 font-[var(--font-mono)] text-center"
        >
          <span className="text-2xl text-[var(--color-danger)]">{'\u26A0'}</span>
          <span
            className="text-xs text-[var(--color-danger)] tracking-[1px]"
          >
            FAILED TO LOAD MAP DATA
          </span>
          <span
            className="text-[10px] text-[var(--color-text-muted)]"
          >
            Check connection and try again
          </span>
          <button
            onClick={() => refetch()}
            className="mt-1 py-1.5 px-4 font-[var(--font-mono)] text-[10px] tracking-[1px] text-[var(--color-accent)] bg-transparent border border-[var(--color-accent)] rounded-[var(--radius)] cursor-pointer"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="map-full-viewport">
      <LogisticsMap
        data={{ units, convoys, supplyPoints, routes, alerts }}
        convoyMovements={convoyMovements}
        height="100%"
      />
    </div>
  );
}
