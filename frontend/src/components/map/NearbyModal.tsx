import { useEffect, useCallback } from 'react';
import { X, MapPin, Package, AlertTriangle } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';
import { latLonToMGRS, formatCoords } from '@/utils/coordinates';

export default function NearbyModal() {
  const nearbyResult = useMapStore((s) => s.nearbyResult);
  const clearNearby = useMapStore((s) => s.clearNearby);
  const selectEntity = useMapStore((s) => s.selectEntity);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearNearby();
    },
    [clearNearby],
  );

  useEffect(() => {
    if (nearbyResult) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [nearbyResult, handleEscape]);

  if (!nearbyResult) return null;

  const { lat, lon, data } = nearbyResult;
  const totalCount = data.units.length + data.supplyPoints.length + data.alerts.length;

  let mgrsStr = '';
  try {
    mgrsStr = latLonToMGRS(lat, lon);
  } catch {
    // MGRS conversion may fail
  }

  const severityColor: Record<string, string> = {
    CRITICAL: '#ef4444',
    WARNING: '#f59e0b',
    INFO: '#60a5fa',
  };

  const statusColor: Record<string, string> = {
    GREEN: '#22c55e',
    AMBER: '#f59e0b',
    RED: '#ef4444',
    BLACK: '#94a3b8',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginBottom: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: "'JetBrains Mono', monospace",
  };

  const rowStyle: React.CSSProperties = {
    padding: '6px 8px',
    borderRadius: 4,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) clearNearby();
      }}
    >
      <div
        style={{
          width: 440,
          maxHeight: '80vh',
          overflowY: 'auto',
          backgroundColor: '#1a1f2e',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 8,
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '2px',
                color: '#e2e8f0',
                textTransform: 'uppercase',
              }}
            >
              NEARBY (5 KM)
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
              {formatCoords(lat, lon)}
              {mgrsStr && (
                <span style={{ color: '#60a5fa', marginLeft: 8 }}>{mgrsStr}</span>
              )}
            </div>
          </div>
          <button
            onClick={clearNearby}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              border: 'none',
              borderRadius: 4,
              backgroundColor: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 16 }}>
          {totalCount === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 0',
                color: '#64748b',
                fontSize: 11,
              }}
            >
              No entities found within 5 km.
            </div>
          ) : (
            <>
              {/* Units */}
              {data.units.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ ...labelStyle, color: '#60a5fa' }}>
                    <MapPin size={12} />
                    UNITS ({data.units.length})
                  </div>
                  {data.units.map((u) => (
                    <div
                      key={u.unit_id}
                      style={rowStyle}
                      onClick={() => {
                        clearNearby();
                        selectEntity('unit', u.unit_id, u);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 600 }}>
                            {u.abbreviation}
                          </span>
                          <span style={{ color: '#64748b', fontSize: 10, marginLeft: 8 }}>
                            {u.name}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: statusColor[u.supply_status] ?? '#94a3b8',
                          }}
                        >
                          {u.supply_status}
                        </span>
                      </div>
                      <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>
                        {u.mgrs ?? formatCoords(u.latitude, u.longitude)}
                        <span style={{ marginLeft: 8 }}>
                          Readiness: {u.readiness_pct}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Supply Points */}
              {data.supplyPoints.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ ...labelStyle, color: '#22c55e' }}>
                    <Package size={12} />
                    SUPPLY POINTS ({data.supplyPoints.length})
                  </div>
                  {data.supplyPoints.map((sp) => (
                    <div
                      key={sp.id}
                      style={rowStyle}
                      onClick={() => {
                        clearNearby();
                        selectEntity('supplyPoint', sp.id, sp);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 600 }}>
                          {sp.name}
                        </span>
                        <span style={{ fontSize: 9, color: '#94a3b8' }}>
                          {sp.point_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>
                        {sp.mgrs ?? formatCoords(sp.latitude, sp.longitude)}
                        <span style={{ marginLeft: 8 }}>
                          Status: {sp.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Alerts */}
              {data.alerts.length > 0 && (
                <div>
                  <div style={{ ...labelStyle, color: '#f59e0b' }}>
                    <AlertTriangle size={12} />
                    ALERTS ({data.alerts.length})
                  </div>
                  {data.alerts.map((a) => (
                    <div
                      key={a.id}
                      style={rowStyle}
                      onClick={() => {
                        clearNearby();
                        selectEntity('alert', a.id, a);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 600 }}>
                          {a.unit_name}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: severityColor[a.severity] ?? '#94a3b8',
                          }}
                        >
                          {a.severity}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                        {a.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '8px 16px 12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'right',
          }}
        >
          <button
            onClick={clearNearby}
            style={{
              padding: '6px 16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 4,
              backgroundColor: 'transparent',
              color: '#94a3b8',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '1px',
              cursor: 'pointer',
            }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
