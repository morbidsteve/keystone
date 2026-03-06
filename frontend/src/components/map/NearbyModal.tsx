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
      className="fixed z-[3000] flex items-center justify-center bg-[rgba(0,0,0,0.5)] inset-0 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) clearNearby();
      }}
    >
      <div
        className="w-[440px] max-h-[80vh] overflow-y-auto bg-[#1a1f2e] rounded-[8px]" style={{ border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)', fontFamily: "'JetBrains Mono', monospace" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between py-3 px-4 border-b border-b-[rgba(255,255,255,0.1)]"
        >
          <div>
            <div
              className="text-[11px] font-bold tracking-[2px] text-[#e2e8f0] uppercase"
            >
              NEARBY (5 KM)
            </div>
            <div className="text-[10px] text-[#94a3b8] mt-0.5">
              {formatCoords(lat, lon)}
              {mgrsStr && (
                <span className="text-[#60a5fa] ml-2">{mgrsStr}</span>
              )}
            </div>
          </div>
          <button
            onClick={clearNearby}
            className="flex items-center justify-center w-[28px] h-[28px] border-0 rounded-[4px] bg-transparent text-[#94a3b8] cursor-pointer"
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
        <div className="p-4">
          {totalCount === 0 ? (
            <div
              className="text-center py-6 px-0 text-[#64748b] text-[11px]"
            >
              No entities found within 5 km.
            </div>
          ) : (
            <>
              {/* Units */}
              {data.units.length > 0 && (
                <div className="mb-4">
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
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[#e2e8f0] text-[11px] font-semibold">
                            {u.abbreviation}
                          </span>
                          <span className="text-[#64748b] text-[10px] ml-2">
                            {u.name}
                          </span>
                        </div>
                        <span
                          className="text-[9px] font-bold" style={{ color: statusColor[u.supply_status] ?? '#94a3b8' }}
                        >
                          {u.supply_status}
                        </span>
                      </div>
                      <div className="text-[9px] text-[#64748b] mt-0.5">
                        {u.mgrs ?? formatCoords(u.latitude, u.longitude)}
                        <span className="ml-2">
                          Readiness: {u.readiness_pct}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Supply Points */}
              {data.supplyPoints.length > 0 && (
                <div className="mb-4">
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
                      <div className="flex justify-between items-center">
                        <span className="text-[#e2e8f0] text-[11px] font-semibold">
                          {sp.name}
                        </span>
                        <span className="text-[9px] text-[#94a3b8]">
                          {sp.point_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-[9px] text-[#64748b] mt-0.5">
                        {sp.mgrs ?? formatCoords(sp.latitude, sp.longitude)}
                        <span className="ml-2">
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
                      <div className="flex justify-between items-center">
                        <span className="text-[#e2e8f0] text-[11px] font-semibold">
                          {a.unit_name}
                        </span>
                        <span
                          className="text-[9px] font-bold" style={{ color: severityColor[a.severity] ?? '#94a3b8' }}
                        >
                          {a.severity}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#94a3b8] mt-0.5">
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
          className="text-right" style={{ padding: '8px 16px 12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
        >
          <button
            onClick={clearNearby}
            className="py-1.5 px-4 rounded-[4px] bg-transparent text-[#94a3b8] text-[10px] font-semibold tracking-[1px] cursor-pointer" style={{ border: '1px solid rgba(255, 255, 255, 0.1)', fontFamily: "'JetBrains Mono', monospace" }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
