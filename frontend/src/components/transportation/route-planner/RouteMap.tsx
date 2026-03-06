import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createMilSymbolIcon } from '@/components/map/symbols/MilSymbol';
import { getStatusColor } from '@/components/map/symbols/symbolConfig';
import type { MapData } from '@/api/map';
import type { Waypoint } from './types';
import { CAMP_PENDLETON_CENTER, DEFAULT_ZOOM, TILE_URL } from './types';

// ---------------------------------------------------------------------------
// Marker icon helpers
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

function createPinIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    html: `<div style="display:flex;flex-direction:column;align-items:center;"><div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div><div style="width:2px;height:12px;background:${color};"></div></div>`,
  });
}

function createSupplyPointIcon(pointType: string): L.DivIcon {
  const letters: Record<string, string> = {
    LOG_BASE: 'L',
    AMMO_SUPPLY_POINT: 'A',
    FARP: 'F',
    LZ: 'H',
    WATER_POINT: 'W',
    MAINTENANCE_COLLECTION_POINT: 'M',
  };
  const letter = letters[pointType] || 'S';
  return L.divIcon({
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<div style="width:22px;height:22px;border-radius:50%;background:var(--color-bg-elevated);border:2px solid var(--color-accent);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--color-accent);">${letter}</div>`,
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
// Props
// ---------------------------------------------------------------------------

interface RouteMapProps {
  mapData: MapData | null;
  waypoints: Waypoint[];
  origin: string;
  destination: string;
  originCoords: { lat: number; lon: number } | null;
  destinationCoords: { lat: number; lon: number } | null;
  autoRouteName: string | null;
  selectionMode: 'origin' | 'destination' | 'waypoint';
  onMapClick: (lat: number, lon: number) => void;
  onUnitClick: (unitId: string, abbreviation: string, lat: number, lon: number) => void;
  onDestinationUnitClick: (abbreviation: string, lat: number, lon: number) => void;
  onSupplyPointOrigin: (name: string, lat: number, lon: number) => void;
  onSupplyPointDestination: (name: string, lat: number, lon: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RouteMap({
  mapData,
  waypoints,
  origin,
  destination,
  originCoords,
  destinationCoords,
  autoRouteName,
  selectionMode,
  onMapClick,
  onUnitClick,
  onDestinationUnitClick,
  onSupplyPointOrigin,
  onSupplyPointDestination,
}: RouteMapProps) {
  const polylinePositions: [number, number][] = waypoints.map(wp => [wp.lat, wp.lon]);

  return (
    <div className="relative" style={{ flex: '0 0 65%' }}>
      <MapContainer
        center={CAMP_PENDLETON_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          url={TILE_URL}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />

        <ClickHandler onMapClick={onMapClick} />

        {/* Unit markers */}
        {mapData?.units.map(unit => (
          <Marker
            key={unit.unit_id}
            position={[unit.latitude, unit.longitude]}
            icon={createMilSymbolIcon(unit.symbol_sidc, 35, getStatusColor(unit.supply_status))}
            eventHandlers={{
              click: () => {
                if (selectionMode === 'origin') {
                  onUnitClick(unit.unit_id, unit.abbreviation, unit.latitude, unit.longitude);
                } else if (selectionMode === 'destination') {
                  onDestinationUnitClick(unit.abbreviation, unit.latitude, unit.longitude);
                }
              },
            }}
          >
            <Tooltip permanent={false}>
              <span className="font-[var(--font-mono)] text-[10px]">
                {unit.abbreviation} ({unit.supply_status})
              </span>
            </Tooltip>
          </Marker>
        ))}

        {/* Supply point markers */}
        {mapData?.supplyPoints.map(sp => (
          <Marker
            key={sp.id}
            position={[sp.latitude, sp.longitude]}
            icon={createSupplyPointIcon(sp.point_type)}
            eventHandlers={{
              click: () => {
                if (selectionMode === 'origin') {
                  onSupplyPointOrigin(sp.name, sp.latitude, sp.longitude);
                } else if (selectionMode === 'destination') {
                  onSupplyPointDestination(sp.name, sp.latitude, sp.longitude);
                }
              },
            }}
          >
            <Tooltip permanent={false}>
              <span className="font-[var(--font-mono)] text-[10px]">
                {sp.name} ({sp.point_type})
              </span>
            </Tooltip>
          </Marker>
        ))}

        {/* MSR/ASR route polylines */}
        {mapData?.routes.map(route => {
          const positions: [number, number][] = route.waypoints.map(wp => [wp.lat, wp.lon]);
          const color =
            route.status === 'OPEN'
              ? '#40c057'
              : route.status === 'RESTRICTED'
                ? '#fab005'
                : '#868e96';
          return (
            <Polyline
              key={route.id}
              positions={positions}
              pathOptions={{
                color,
                weight: 3,
                opacity: 0.6,
                dashArray: route.status === 'CLOSED' ? '8 8' : undefined,
              }}
            >
              <Tooltip sticky>
                <span className="font-[var(--font-mono)] text-[10px]">
                  {route.name} ({route.route_type}) — {route.status}
                </span>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* Origin pin */}
        {originCoords && (
          <Marker position={[originCoords.lat, originCoords.lon]} icon={createPinIcon('#40c057')}>
            <Tooltip permanent>
              <span className="font-[var(--font-mono)] text-[10px]">ORIGIN: {origin}</span>
            </Tooltip>
          </Marker>
        )}

        {/* Destination pin */}
        {destinationCoords && (
          <Marker position={[destinationCoords.lat, destinationCoords.lon]} icon={createPinIcon('#ff6b6b')}>
            <Tooltip permanent>
              <span className="font-[var(--font-mono)] text-[10px]">DEST: {destination}</span>
            </Tooltip>
          </Marker>
        )}

        {/* Auto-route highlight polyline */}
        {autoRouteName && waypoints.length >= 2 && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: 'var(--color-accent)',
              weight: 5,
              opacity: 0.7,
              dashArray: '10 6',
            }}
          />
        )}

        {/* Planned route polyline */}
        {waypoints.length >= 2 && !autoRouteName && (
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
          <Marker key={`wp-${idx}`} position={[wp.lat, wp.lon]} icon={createNumberedIcon(idx + 1)} />
        ))}
      </MapContainer>

      {/* Legend overlay (top-left) */}
      <div
        className="absolute top-3 left-3 z-[1000] font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] py-1.5 px-2.5 rounded-[var(--radius)] border border-[var(--color-border)]"
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className="w-[14px] h-[2px] bg-[#40c057]" />
          OPEN
        </div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className="w-[14px] h-[2px] bg-[#fab005]" />
          RESTRICTED
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-[14px] h-[2px] bg-[#868e96]" />
          CLOSED
        </div>
      </div>

      {/* Mode indicator overlay (bottom-left) */}
      <div
        className="absolute bottom-3 left-3 z-[1000] font-[var(--font-mono)] text-[10px] bg-[var(--color-bg-elevated)] py-1 px-2.5 rounded-[var(--radius)]" style={{ color: selectionMode === 'origin'
              ? '#40c057'
              : selectionMode === 'destination'
                ? '#ff6b6b'
                : 'var(--color-text-muted)', border: `1px solid ${
            selectionMode === 'origin'
              ? '#40c057'
              : selectionMode === 'destination'
                ? '#ff6b6b'
                : 'var(--color-border)'
          }` }}
      >
        {selectionMode === 'origin'
          ? 'CLICK UNIT/POINT TO SET ORIGIN'
          : selectionMode === 'destination'
            ? 'CLICK UNIT/POINT TO SET DESTINATION'
            : 'CLICK MAP TO ADD WAYPOINTS'}
      </div>
    </div>
  );
}
