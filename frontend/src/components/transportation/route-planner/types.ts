import type { MapData, MapRoute } from '@/api/map';
import type {
  CargoItem,
  VehicleAllocation,
  EquipmentRecord,
  SupplyRecord,
  ConvoyVehicle,
  ConvoyPersonnelAssignment,
  PersonnelSummary,
} from '@/lib/types';
import { ConvoyRole } from '@/lib/types';

// ---------------------------------------------------------------------------
// Waypoint type
// ---------------------------------------------------------------------------

export interface Waypoint {
  lat: number;
  lon: number;
  label?: string;
}

// ---------------------------------------------------------------------------
// Shared style constants
// ---------------------------------------------------------------------------

export const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  marginBottom: 4,
};

export const inputStyle: React.CSSProperties = {
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

export const smallBtnStyle: React.CSSProperties = {
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

export const addBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 8px',
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '1px',
  color: 'var(--color-accent)',
  backgroundColor: 'var(--color-bg)',
  border: '1px dashed var(--color-border)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  width: '100%',
  justifyContent: 'center',
};

export const smallActionBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 8px',
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.5px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

// ---------------------------------------------------------------------------
// Geo helpers
// ---------------------------------------------------------------------------

export function haversineDistance(
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

export function formatCoord(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}${latDir} ${Math.abs(lon).toFixed(4)}${lonDir}`;
}

// ---------------------------------------------------------------------------
// Auto-route algorithm
// ---------------------------------------------------------------------------

export function autoGenerateRoute(
  origin: { lat: number; lon: number },
  destination: { lat: number; lon: number },
  routes: MapRoute[],
): { waypoints: Array<{ lat: number; lon: number; label?: string }>; routeName: string } | null {
  const openRoutes = routes.filter(r => r.status === 'OPEN');
  if (openRoutes.length === 0) return null;

  let bestRoute: MapRoute | null = null;
  let bestScore = Infinity;
  let bestOriginIdx = 0;
  let bestDestIdx = 0;

  for (const route of openRoutes) {
    let closestToOrigin = 0;
    let minOriginDist = Infinity;
    let closestToDest = 0;
    let minDestDist = Infinity;

    for (let i = 0; i < route.waypoints.length; i++) {
      const wp = route.waypoints[i];
      const dOrig = haversineDistance(origin, { lat: wp.lat, lon: wp.lon });
      const dDest = haversineDistance(destination, { lat: wp.lat, lon: wp.lon });
      if (dOrig < minOriginDist) { minOriginDist = dOrig; closestToOrigin = i; }
      if (dDest < minDestDist) { minDestDist = dDest; closestToDest = i; }
    }

    const score = minOriginDist + minDestDist;
    if (score < bestScore) {
      bestScore = score;
      bestRoute = route;
      bestOriginIdx = closestToOrigin;
      bestDestIdx = closestToDest;
    }
  }

  if (!bestRoute) return null;

  const start = Math.min(bestOriginIdx, bestDestIdx);
  const end = Math.max(bestOriginIdx, bestDestIdx);
  const segment = bestRoute.waypoints.slice(start, end + 1);

  const routeWps = bestOriginIdx <= bestDestIdx ? segment : [...segment].reverse();

  const result = [
    { lat: origin.lat, lon: origin.lon, label: 'ORIGIN' },
    ...routeWps.map(wp => ({ lat: wp.lat, lon: wp.lon, label: wp.label })),
    { lat: destination.lat, lon: destination.lon, label: 'DESTINATION' },
  ];

  return { waypoints: result, routeName: bestRoute.name };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CAMP_PENDLETON_CENTER: [number, number] = [33.3152, -117.3125];
export const DEFAULT_ZOOM = 11;

export const TILE_URL =
  import.meta.env.VITE_TILE_SERVER_URL ||
  '/tiles/osm/{z}/{x}/{y}.png';

export const MAP_TO_SUPPLY_UNIT: Record<string, string> = {
  '1-1': '4',
  '2-1': '5',
  '1mar': '3',
  '1mardiv': '2',
  '1mef': '1',
};

export const DEFAULT_ROLES = ['DRIVER', 'A-DRIVER', 'GUNNER', 'MEDIC', 'PAX'];

// Re-export types used by subcomponents
export type { MapData, MapRoute, CargoItem, VehicleAllocation, EquipmentRecord, SupplyRecord, ConvoyVehicle, ConvoyPersonnelAssignment, PersonnelSummary };
export { ConvoyRole };
