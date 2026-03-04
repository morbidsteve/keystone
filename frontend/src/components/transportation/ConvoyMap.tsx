import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import { MovementStatus, type Movement } from '@/lib/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ConvoyMapProps {
  movements: Movement[];
  selectedConvoyId?: string | null;
  onSelectConvoy?: (id: string) => void;
  onOpenRoutePlanner?: () => void;
  onViewDetail?: (movement: Movement) => void;
  height?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CAMP_PENDLETON_CENTER: [number, number] = [33.3152, -117.3125];
const DEFAULT_ZOOM = 11;

const TILE_URL =
  import.meta.env.VITE_TILE_SERVER_URL ||
  '/tiles/osm/{z}/{x}/{y}.png';

const STATUS_COLORS: Record<string, string> = {
  [MovementStatus.EN_ROUTE]: '#4dabf7',
  [MovementStatus.DELAYED]: '#ff6b6b',
  [MovementStatus.PLANNED]: '#868e96',
  [MovementStatus.ARRIVED]: '#40c057',
  [MovementStatus.CANCELLED]: '#868e96',
};

// ---------------------------------------------------------------------------
// Geo helpers
// ---------------------------------------------------------------------------

function haversineDistance(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const R = 6371; // km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLon *
      sinLon;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function interpolatePosition(
  waypoints: Array<{ lat: number; lon: number }>,
  fraction: number,
): { lat: number; lon: number } {
  if (waypoints.length < 2 || fraction <= 0) return waypoints[0];
  if (fraction >= 1) return waypoints[waypoints.length - 1];

  // Calculate total distance
  let totalDist = 0;
  const segmentDists: number[] = [];
  for (let i = 1; i < waypoints.length; i++) {
    const d = haversineDistance(waypoints[i - 1], waypoints[i]);
    segmentDists.push(d);
    totalDist += d;
  }

  // Find the segment
  let targetDist = fraction * totalDist;
  for (let i = 0; i < segmentDists.length; i++) {
    if (targetDist <= segmentDists[i]) {
      const segFraction = segmentDists[i] > 0 ? targetDist / segmentDists[i] : 0;
      return {
        lat:
          waypoints[i].lat +
          (waypoints[i + 1].lat - waypoints[i].lat) * segFraction,
        lon:
          waypoints[i].lon +
          (waypoints[i + 1].lon - waypoints[i].lon) * segFraction,
      };
    }
    targetDist -= segmentDists[i];
  }
  return waypoints[waypoints.length - 1];
}

// ---------------------------------------------------------------------------
// Marker icon factory
// ---------------------------------------------------------------------------

function createConvoyIcon(color: string, isSelected: boolean): L.DivIcon {
  const size = isSelected ? 18 : 14;
  const glow = isSelected
    ? `box-shadow: 0 0 10px 3px ${color};`
    : '';
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:${color};
      border:2px solid rgba(255,255,255,0.8);
      ${glow}
    "></div>`,
  });
}

// ---------------------------------------------------------------------------
// Convoy position calculator
// ---------------------------------------------------------------------------

function getConvoyPosition(mov: Movement): { lat: number; lon: number } | null {
  if (!mov.routeWaypoints || mov.routeWaypoints.length === 0) return null;

  if (mov.status === MovementStatus.ARRIVED) {
    return mov.routeWaypoints[mov.routeWaypoints.length - 1];
  }

  if (mov.status === MovementStatus.EN_ROUTE && mov.departureTime && mov.eta) {
    const now = Date.now();
    const dep = new Date(mov.departureTime).getTime();
    const eta = new Date(mov.eta).getTime();
    if (eta > dep) {
      const fraction = Math.max(0, Math.min(1, (now - dep) / (eta - dep)));
      return interpolatePosition(mov.routeWaypoints, fraction);
    }
  }

  // PLANNED, CANCELLED, or missing times -> first waypoint
  return mov.routeWaypoints[0];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ConvoyMap({
  movements,
  selectedConvoyId,
  onSelectConvoy,
  onOpenRoutePlanner,
  onViewDetail,
  height = '50vh',
}: ConvoyMapProps) {
  const movementsWithRoutes = useMemo(
    () => movements.filter((m) => m.routeWaypoints && m.routeWaypoints.length >= 2),
    [movements],
  );

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
      }}
    >
      <MapContainer
        center={CAMP_PENDLETON_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url={TILE_URL}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />

        {/* Route polylines */}
        {movementsWithRoutes.map((mov) => {
          const color = STATUS_COLORS[mov.status] || '#868e96';
          const isSelected = mov.id === selectedConvoyId;
          const positions: [number, number][] = mov.routeWaypoints!.map((wp) => [
            wp.lat,
            wp.lon,
          ]);

          return (
            <Polyline
              key={`route-${mov.id}`}
              positions={positions}
              pathOptions={{
                color,
                weight: isSelected ? 4 : 2,
                opacity: isSelected ? 1 : 0.7,
                dashArray: isSelected ? '8 4' : undefined,
              }}
              eventHandlers={{
                click: () => onSelectConvoy?.(mov.id),
              }}
            />
          );
        })}

        {/* Convoy markers */}
        {movementsWithRoutes.map((mov) => {
          const color = STATUS_COLORS[mov.status] || '#868e96';
          const isSelected = mov.id === selectedConvoyId;
          const pos = getConvoyPosition(mov);
          if (!pos) return null;

          return (
            <Marker
              key={`convoy-${mov.id}`}
              position={[pos.lat, pos.lon]}
              icon={createConvoyIcon(color, isSelected)}
              eventHandlers={{
                click: () => onSelectConvoy?.(mov.id),
              }}
            >
              <Popup className="keystone-popup">
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    padding: 10,
                    minWidth: 180,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 12,
                      color: 'var(--color-text-bright)',
                      marginBottom: 6,
                    }}
                  >
                    {mov.name}
                  </div>
                  <div style={{ color, marginBottom: 4, fontSize: 10, letterSpacing: '1px' }}>
                    {mov.status.replace('_', ' ')}
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', marginBottom: 4 }}>
                    {mov.manifest ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {mov.manifest.cargo.map((c, i) => (
                          <div key={i} style={{ fontSize: 10 }}>
                            CL {c.supplyClass}: {c.quantity} {c.unit}
                          </div>
                        ))}
                      </div>
                    ) : (
                      mov.cargo
                    )}
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>
                    {mov.manifest ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <div>{mov.manifest.vehicles.map(v => `${v.quantity}x ${v.type}`).join(', ')}</div>
                        <div>{mov.manifest.totalVehicles} VEH / {mov.manifest.totalPersonnel} PAX</div>
                      </div>
                    ) : (
                      <>{mov.vehicles} VEH / {mov.personnel} PAX</>
                    )}
                  </div>
                  {mov.eta && (
                    <div
                      style={{
                        color: 'var(--color-text)',
                        marginTop: 4,
                        fontSize: 10,
                      }}
                    >
                      ETA: {new Date(mov.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {onViewDetail && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetail(mov);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        marginTop: 8,
                        padding: '4px 0',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '1px',
                        color: 'var(--color-accent)',
                        backgroundColor: 'rgba(77, 171, 247, 0.1)',
                        border: '1px solid rgba(77, 171, 247, 0.3)',
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      VIEW DETAILS
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* PLAN ROUTE button */}
      {onOpenRoutePlanner && (
        <button
          onClick={onOpenRoutePlanner}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '1px',
            color: 'var(--color-text-bright)',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            transition: 'var(--transition)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-accent)';
            e.currentTarget.style.color = 'var(--color-accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.color = 'var(--color-text-bright)';
          }}
        >
          <MapPin size={12} />
          PLAN ROUTE
        </button>
      )}

      {/* Popup styling */}
      <style>{`
        .keystone-popup .leaflet-popup-content-wrapper {
          background-color: var(--color-bg-elevated) !important;
          color: var(--color-text) !important;
          border: 1px solid var(--color-border) !important;
          border-radius: var(--radius) !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important;
          padding: 0 !important;
        }
        .keystone-popup .leaflet-popup-content {
          margin: 0 !important;
          font-family: var(--font-mono) !important;
        }
        .keystone-popup .leaflet-popup-tip {
          background-color: var(--color-bg-elevated) !important;
          border: 1px solid var(--color-border) !important;
        }
        .keystone-popup .leaflet-popup-close-button {
          color: var(--color-text-muted) !important;
        }
      `}</style>
    </div>
  );
}
