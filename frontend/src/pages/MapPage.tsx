import { useMapData } from '@/hooks/useMapData';
import LogisticsMap from '@/components/map/LogisticsMap';

export default function MapPage() {
  const { units, convoys, supplyPoints, routes, alerts, isLoading, isError, refetch } =
    useMapData();

  if (isLoading) {
    return (
      <div
        style={{
          height: 'calc(100vh - 48px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-bg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-accent)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '2px',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
            }}
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
        style={{
          height: 'calc(100vh - 48px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-bg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            fontFamily: 'var(--font-mono)',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 24, color: 'var(--color-danger)' }}>{'\u26A0'}</span>
          <span
            style={{
              fontSize: 12,
              color: 'var(--color-danger)',
              letterSpacing: '1px',
            }}
          >
            FAILED TO LOAD MAP DATA
          </span>
          <span
            style={{
              fontSize: 10,
              color: 'var(--color-text-muted)',
            }}
          >
            Check connection and try again
          </span>
          <button
            onClick={() => refetch()}
            style={{
              marginTop: 4,
              padding: '6px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '1px',
              color: 'var(--color-accent)',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-accent)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="map-full-viewport"
      style={{
        height: 'calc(100vh - 48px)',
        margin: '-20px',
        overflow: 'hidden',
      }}
    >
      <LogisticsMap
        data={{ units, convoys, supplyPoints, routes, alerts }}
        height="100%"
      />
    </div>
  );
}
