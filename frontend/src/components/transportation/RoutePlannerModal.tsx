import { useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { X, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { MovementStatus, type Movement } from '@/lib/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RoutePlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRoute: (movement: Partial<Movement>) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CAMP_PENDLETON_CENTER: [number, number] = [33.3152, -117.3125];
const DEFAULT_ZOOM = 11;

const TILE_URL =
  import.meta.env.VITE_TILE_SERVER_URL ||
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const REFERENCE_ROUTES = [
  {
    name: 'MSR TAMPA',
    color: 'rgba(64, 192, 87, 0.3)',
    points: [
      [33.36, -117.25],
      [33.34, -117.28],
      [33.32, -117.3],
      [33.3, -117.33],
      [33.28, -117.35],
    ] as [number, number][],
  },
  {
    name: 'ASR DIAMOND',
    color: 'rgba(77, 171, 247, 0.3)',
    points: [
      [33.38, -117.3],
      [33.35, -117.32],
      [33.32, -117.33],
      [33.29, -117.35],
    ] as [number, number][],
  },
];

// ---------------------------------------------------------------------------
// Waypoint type
// ---------------------------------------------------------------------------

interface Waypoint {
  lat: number;
  lon: number;
  label?: string;
}

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

function formatCoord(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}${latDir} ${Math.abs(lon).toFixed(4)}${lonDir}`;
}

// ---------------------------------------------------------------------------
// Numbered waypoint marker
// ---------------------------------------------------------------------------

function createNumberedIcon(num: number): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    html: `<div style="
      width:24px;height:24px;
      border-radius:50%;
      background:var(--color-accent);
      border:2px solid rgba(255,255,255,0.9);
      display:flex;align-items:center;justify-content:center;
      font-family:var(--font-mono);font-size:11px;font-weight:700;
      color:#fff;
    ">${num}</div>`,
  });
}

// ---------------------------------------------------------------------------
// Click handler component (must be inside MapContainer)
// ---------------------------------------------------------------------------

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  outline: 'none',
  boxSizing: 'border-box',
};

const smallBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 22,
  height: 22,
  padding: 0,
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  fontSize: 10,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RoutePlannerModal({
  isOpen,
  onClose,
  onSaveRoute,
}: RoutePlannerModalProps) {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [routeName, setRouteName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicles, setVehicles] = useState(4);
  const [personnel, setPersonnel] = useState(8);
  const [cargo, setCargo] = useState('');
  const [priority, setPriority] = useState('ROUTINE');
  const [avgSpeed, setAvgSpeed] = useState(40);
  const [departureTime, setDepartureTime] = useState('');

  // Segment distances
  const segmentDistances = useMemo(() => {
    const dists: number[] = [];
    for (let i = 1; i < waypoints.length; i++) {
      dists.push(haversineDistance(waypoints[i - 1], waypoints[i]));
    }
    return dists;
  }, [waypoints]);

  const totalDistance = useMemo(
    () => segmentDistances.reduce((sum, d) => sum + d, 0),
    [segmentDistances],
  );

  const estimatedTime = useMemo(() => {
    if (avgSpeed <= 0) return 0;
    return totalDistance / avgSpeed; // hours
  }, [totalDistance, avgSpeed]);

  // Handlers
  const handleMapClick = useCallback((lat: number, lon: number) => {
    setWaypoints((prev) => [...prev, { lat, lon }]);
  }, []);

  const handleMoveUp = useCallback((idx: number) => {
    if (idx <= 0) return;
    setWaypoints((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

  const handleMoveDown = useCallback((idx: number) => {
    setWaypoints((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  const handleDeleteWaypoint = useCallback((idx: number) => {
    setWaypoints((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleClearRoute = useCallback(() => {
    setWaypoints([]);
  }, []);

  const handleSave = useCallback(() => {
    // Calculate ETA from departure time, total distance, and avg speed
    let eta: string | undefined;
    if (departureTime && totalDistance > 0 && avgSpeed > 0) {
      const dep = new Date(departureTime);
      const travelMs = (totalDistance / avgSpeed) * 3600 * 1000;
      eta = new Date(dep.getTime() + travelMs).toISOString();
    }

    onSaveRoute({
      name: routeName || 'NEW CONVOY',
      originUnit: origin || 'TBD',
      destinationUnit: destination || 'TBD',
      status: MovementStatus.PLANNED,
      cargo,
      priority,
      departureTime: departureTime ? new Date(departureTime).toISOString() : undefined,
      eta,
      vehicles,
      personnel,
      routeWaypoints: waypoints,
    });

    // Reset form
    setWaypoints([]);
    setRouteName('');
    setOrigin('');
    setDestination('');
    setVehicles(4);
    setPersonnel(8);
    setCargo('');
    setPriority('ROUTINE');
    setAvgSpeed(40);
    setDepartureTime('');
  }, [
    waypoints,
    routeName,
    origin,
    destination,
    vehicles,
    personnel,
    cargo,
    priority,
    avgSpeed,
    departureTime,
    totalDistance,
    onSaveRoute,
  ]);

  if (!isOpen) return null;

  const polylinePositions: [number, number][] = waypoints.map((wp) => [wp.lat, wp.lon]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        display: 'flex',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
      }}
    >
      {/* Left: Map */}
      <div style={{ flex: '0 0 65%', position: 'relative' }}>
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

          <ClickHandler onMapClick={handleMapClick} />

          {/* Reference routes (MSR/ASR) */}
          {REFERENCE_ROUTES.map((route) => (
            <Polyline
              key={route.name}
              positions={route.points}
              pathOptions={{
                color: route.color,
                weight: 3,
                dashArray: '6 4',
              }}
            />
          ))}

          {/* Planned route polyline */}
          {waypoints.length >= 2 && (
            <Polyline
              positions={polylinePositions}
              pathOptions={{
                color: '#4dabf7',
                weight: 3,
                opacity: 0.9,
              }}
            />
          )}

          {/* Waypoint markers */}
          {waypoints.map((wp, idx) => (
            <Marker
              key={`wp-${idx}`}
              position={[wp.lat, wp.lon]}
              icon={createNumberedIcon(idx + 1)}
            />
          ))}
        </MapContainer>

        {/* Click hint */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            zIndex: 1000,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--color-text-muted)',
            backgroundColor: 'var(--color-bg-elevated)',
            padding: '4px 10px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--color-border)',
          }}
        >
          CLICK MAP TO ADD WAYPOINTS
        </div>

        {/* Reference route legend */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 1000,
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--color-text-muted)',
            backgroundColor: 'var(--color-bg-elevated)',
            padding: '6px 10px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--color-border)',
          }}
        >
          {REFERENCE_ROUTES.map((r) => (
            <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <div style={{ width: 14, height: 2, backgroundColor: r.color }} />
              {r.name}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Form panel */}
      <div
        style={{
          flex: '0 0 35%',
          backgroundColor: 'var(--color-bg-elevated)',
          borderLeft: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 16px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--color-text-bright)',
              letterSpacing: '2px',
            }}
          >
            ROUTE PLANNER
          </span>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable form body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Route Name */}
          <div>
            <div style={labelStyle}>ROUTE NAME</div>
            <input
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="CONVOY DELTA"
              style={inputStyle}
            />
          </div>

          {/* Origin / Destination */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={labelStyle}>ORIGIN</div>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="CLB-1"
                style={inputStyle}
              />
            </div>
            <div>
              <div style={labelStyle}>DESTINATION</div>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="1/1 BN"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Convoy details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={labelStyle}>VEHICLES</div>
              <input
                type="number"
                min={0}
                value={vehicles}
                onChange={(e) => setVehicles(parseInt(e.target.value) || 0)}
                style={inputStyle}
              />
            </div>
            <div>
              <div style={labelStyle}>PERSONNEL</div>
              <input
                type="number"
                min={0}
                value={personnel}
                onChange={(e) => setPersonnel(parseInt(e.target.value) || 0)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Cargo */}
          <div>
            <div style={labelStyle}>CARGO</div>
            <textarea
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="CL III (8,000 gal JP-8)"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Priority */}
          <div>
            <div style={labelStyle}>PRIORITY</div>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={inputStyle}
            >
              <option value="ROUTINE">ROUTINE</option>
              <option value="PRIORITY">PRIORITY</option>
              <option value="URGENT">URGENT</option>
              <option value="IMMEDIATE">IMMEDIATE</option>
            </select>
          </div>

          {/* Avg Speed & Departure */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={labelStyle}>AVG SPEED (KPH)</div>
              <input
                type="number"
                min={1}
                value={avgSpeed}
                onChange={(e) => setAvgSpeed(parseInt(e.target.value) || 40)}
                style={inputStyle}
              />
            </div>
            <div>
              <div style={labelStyle}>DEPARTURE TIME</div>
              <input
                type="datetime-local"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Waypoint list */}
          <div>
            <div style={{ ...labelStyle, marginBottom: 6 }}>
              WAYPOINTS ({waypoints.length})
            </div>
            {waypoints.length === 0 && (
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--color-text-muted)',
                  padding: '8px 0',
                }}
              >
                Click the map to place waypoints.
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {waypoints.map((wp, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 6px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-text)',
                  }}
                >
                  {/* Number */}
                  <span
                    style={{
                      fontWeight: 700,
                      color: 'var(--color-accent)',
                      minWidth: 16,
                    }}
                  >
                    {idx + 1}
                  </span>

                  {/* Coords */}
                  <span style={{ flex: 1, color: 'var(--color-text-muted)' }}>
                    {formatCoord(wp.lat, wp.lon)}
                  </span>

                  {/* Distance to next */}
                  {idx < segmentDistances.length && (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 9 }}>
                      {segmentDistances[idx].toFixed(1)}km
                    </span>
                  )}

                  {/* Actions */}
                  <button
                    onClick={() => handleMoveUp(idx)}
                    disabled={idx === 0}
                    style={{
                      ...smallBtnStyle,
                      opacity: idx === 0 ? 0.3 : 1,
                    }}
                    title="Move up"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={() => handleMoveDown(idx)}
                    disabled={idx === waypoints.length - 1}
                    style={{
                      ...smallBtnStyle,
                      opacity: idx === waypoints.length - 1 ? 0.3 : 1,
                    }}
                    title="Move down"
                  >
                    <ChevronDown size={12} />
                  </button>
                  <button
                    onClick={() => handleDeleteWaypoint(idx)}
                    style={{ ...smallBtnStyle, color: 'var(--color-danger)' }}
                    title="Delete waypoint"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          {waypoints.length >= 2 && (
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
              }}
            >
              <div style={{ ...labelStyle, marginBottom: 6 }}>ROUTE SUMMARY</div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-text)',
                  marginBottom: 4,
                }}
              >
                <span>TOTAL DISTANCE</span>
                <span style={{ color: 'var(--color-text-bright)', fontWeight: 700 }}>
                  {totalDistance.toFixed(1)} km
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-text)',
                }}
              >
                <span>EST. TRAVEL TIME</span>
                <span style={{ color: 'var(--color-text-bright)', fontWeight: 700 }}>
                  {estimatedTime < 1
                    ? `${Math.round(estimatedTime * 60)} min`
                    : `${Math.floor(estimatedTime)}h ${Math.round((estimatedTime % 1) * 60)}m`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '12px 16px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <button
            onClick={handleClearRoute}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '1px',
              color: 'var(--color-text-muted)',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
          >
            CLEAR ROUTE
          </button>
          <button
            onClick={handleSave}
            disabled={waypoints.length < 2 || !routeName}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '1px',
              color:
                waypoints.length < 2 || !routeName
                  ? 'var(--color-text-muted)'
                  : '#fff',
              backgroundColor:
                waypoints.length < 2 || !routeName
                  ? 'var(--color-bg)'
                  : 'var(--color-accent)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              cursor: waypoints.length < 2 || !routeName ? 'not-allowed' : 'pointer',
              opacity: waypoints.length < 2 || !routeName ? 0.5 : 1,
            }}
          >
            SAVE ROUTE
          </button>
        </div>
      </div>
    </div>
  );
}
