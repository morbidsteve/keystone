import { useState, useCallback, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, ChevronUp, ChevronDown, Trash2, MapPin, Plus, Navigation, Package, Users, Truck, Search, UserPlus, Shield } from 'lucide-react';
import {
  SupplyClass,
  MovementStatus,
  ConvoyRole,
  type Movement,
  type CargoItem,
  type VehicleAllocation,
  type MovementManifest,
  type SupplyRecord,
  type EquipmentRecord,
  type PersonnelSummary,
  type ConvoyVehicle,
  type ConvoyPersonnelAssignment,
  type ConvoyManifest,
} from '@/lib/types';
import { getMapData, type MapData, type MapRoute } from '@/api/map';
import { mockApi } from '@/api/mockClient';
import { createMilSymbolIcon } from '@/components/map/symbols/MilSymbol';
import { getStatusColor } from '@/components/map/symbols/symbolConfig';

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
  '/tiles/osm/{z}/{x}/{y}.png';

const MAP_TO_SUPPLY_UNIT: Record<string, string> = {
  '1-1': '4',
  '2-1': '5',
  '1mar': '3',
  '1mardiv': '2',
  '1mef': '1',
};

const DEFAULT_ROLES = ['DRIVER', 'A-DRIVER', 'GUNNER', 'MEDIC', 'PAX'];

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
// Auto-route algorithm
// ---------------------------------------------------------------------------

function autoGenerateRoute(
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
// Collapsible section header
// ---------------------------------------------------------------------------

function SectionHeader({
  title,
  expanded,
  onToggle,
  count,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  count?: number;
}) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        cursor: 'pointer',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '1.5px',
          color: 'var(--color-text-muted)',
        }}
      >
        {title}
        {count !== undefined ? ` (${count})` : ''}
      </span>
      {expanded ? (
        <ChevronUp size={14} style={{ color: 'var(--color-text-muted)' }} />
      ) : (
        <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} />
      )}
    </div>
  );
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

const addBtnStyle: React.CSSProperties = {
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

const smallActionBtnStyle: React.CSSProperties = {
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
// Component
// ---------------------------------------------------------------------------

export default function RoutePlannerModal({
  isOpen,
  onClose,
  onSaveRoute,
}: RoutePlannerModalProps) {
  // Map data
  const [mapData, setMapData] = useState<MapData | null>(null);

  // Selection mode
  const [selectionMode, setSelectionMode] = useState<'origin' | 'destination' | 'waypoint'>('waypoint');

  // Route
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [routeName, setRouteName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originCoords, setOriginCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [autoRouteName, setAutoRouteName] = useState<string | null>(null);

  // Cargo manifest
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([]);

  // Vehicles
  const [vehicleAllocations, setVehicleAllocations] = useState<VehicleAllocation[]>([]);

  // Personnel
  const [personnelRoles, setPersonnelRoles] = useState<{ role: string; count: number }[]>([]);

  // Personnel detailed mode
  const [personnelMode, setPersonnelMode] = useState<'summary' | 'detailed'>('summary');
  const [convoyVehicles, setConvoyVehicles] = useState<ConvoyVehicle[]>([]);
  const [unassignedPersonnel, setUnassignedPersonnel] = useState<ConvoyPersonnelAssignment[]>([]);
  const [personnelSearchQuery, setPersonnelSearchQuery] = useState('');
  const [personnelSearchResults, setPersonnelSearchResults] = useState<PersonnelSummary[]>([]);
  const [personnelSearchLoading, setPersonnelSearchLoading] = useState(false);
  const [assignTargetVehicleId, setAssignTargetVehicleId] = useState<string | null>(null);
  const [showRoleSelector, setShowRoleSelector] = useState<string | null>(null); // personnelId being assigned

  // Details
  const [priority, setPriority] = useState('ROUTINE');
  const [avgSpeed, setAvgSpeed] = useState(40);
  const [departureTime, setDepartureTime] = useState('');
  const [notes, setNotes] = useState('');

  // Origin unit data (for reference)
  const [originEquipment, setOriginEquipment] = useState<EquipmentRecord[]>([]);
  const [originSupply, setOriginSupply] = useState<SupplyRecord[]>([]);

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    route: true,
    cargo: true,
    vehicles: true,
    personnel: true,
    details: false,
  });

  // ---------------------------------------------------------------------------
  // Load map data on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (isOpen) {
      getMapData().then(setMapData);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Section toggle
  // ---------------------------------------------------------------------------

  const toggleSection = useCallback((key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ---------------------------------------------------------------------------
  // Sync convoy vehicles from vehicleAllocations when switching to detailed
  // ---------------------------------------------------------------------------

  const expandedConvoyVehicles = useMemo<ConvoyVehicle[]>(() => {
    const result: ConvoyVehicle[] = [];
    for (const alloc of vehicleAllocations) {
      for (let i = 0; i < alloc.quantity; i++) {
        // Reuse existing convoy vehicle if it matches
        const existingIdx = result.length;
        const existing = convoyVehicles.find(
          cv => cv.vehicleType === alloc.type && cv.sequenceNumber === i + 1,
        );
        if (existing) {
          result.push(existing);
        } else {
          result.push({
            id: `cv-${alloc.type}-${i}`,
            movementId: '',
            vehicleType: alloc.type,
            tamcn: alloc.tamcn,
            bumperNumber: '',
            callSign: '',
            sequenceNumber: i + 1,
            assignedPersonnel: [],
          });
        }
      }
    }
    return result;
  }, [vehicleAllocations, convoyVehicles]);

  useEffect(() => {
    if (personnelMode === 'detailed') {
      setConvoyVehicles(prev => {
        // Merge: keep existing vehicle data (bumperNumber, callSign, assigned personnel)
        // but match against the expanded set from allocations
        const merged: ConvoyVehicle[] = [];
        for (const expanded of expandedConvoyVehicles) {
          const match = prev.find(
            p => p.vehicleType === expanded.vehicleType && p.sequenceNumber === expanded.sequenceNumber,
          );
          if (match) {
            merged.push(match);
          } else {
            merged.push(expanded);
          }
        }
        return merged;
      });
    }
  }, [personnelMode, expandedConvoyVehicles]);

  // ---------------------------------------------------------------------------
  // Personnel search (debounced)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (personnelSearchQuery.length < 2) {
      setPersonnelSearchResults([]);
      return;
    }
    setPersonnelSearchLoading(true);
    const timer = setTimeout(() => {
      mockApi.searchPersonnel(personnelSearchQuery).then(results => {
        setPersonnelSearchResults(results);
        setPersonnelSearchLoading(false);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [personnelSearchQuery]);

  // ---------------------------------------------------------------------------
  // Detailed mode personnel handlers
  // ---------------------------------------------------------------------------

  const handleAssignPersonnel = useCallback(
    (person: PersonnelSummary, vehicleId: string | null, role: ConvoyRole) => {
      const assignment: ConvoyPersonnelAssignment = {
        id: `cpa-${person.id}-${Date.now()}`,
        movementId: '',
        personnelId: person.id,
        convoyVehicleId: vehicleId || undefined,
        role,
        personnel: person,
      };

      if (vehicleId) {
        setConvoyVehicles(prev =>
          prev.map(cv =>
            cv.id === vehicleId
              ? { ...cv, assignedPersonnel: [...cv.assignedPersonnel, assignment] }
              : cv,
          ),
        );
      } else {
        setUnassignedPersonnel(prev => [...prev, assignment]);
      }

      // Clear search state
      setPersonnelSearchQuery('');
      setPersonnelSearchResults([]);
      setAssignTargetVehicleId(null);
      setShowRoleSelector(null);
    },
    [],
  );

  const handleRemoveAssignedPersonnel = useCallback(
    (assignmentId: string, vehicleId: string | null) => {
      if (vehicleId) {
        setConvoyVehicles(prev =>
          prev.map(cv =>
            cv.id === vehicleId
              ? { ...cv, assignedPersonnel: cv.assignedPersonnel.filter(a => a.id !== assignmentId) }
              : cv,
          ),
        );
      } else {
        setUnassignedPersonnel(prev => prev.filter(a => a.id !== assignmentId));
      }
    },
    [],
  );

  const handleUpdateConvoyVehicle = useCallback(
    (vehicleId: string, field: 'bumperNumber' | 'callSign', value: string) => {
      setConvoyVehicles(prev =>
        prev.map(cv => (cv.id === vehicleId ? { ...cv, [field]: value } : cv)),
      );
    },
    [],
  );

  const totalDetailedPersonnel = useMemo(() => {
    const vehicleAssigned = convoyVehicles.reduce(
      (sum, cv) => sum + cv.assignedPersonnel.length,
      0,
    );
    return vehicleAssigned + unassignedPersonnel.length;
  }, [convoyVehicles, unassignedPersonnel]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleMapClick = useCallback(
    (lat: number, lon: number) => {
      if (selectionMode === 'waypoint') {
        setWaypoints(prev => [...prev, { lat, lon }]);
      }
      // origin/destination handled by marker click events
    },
    [selectionMode],
  );

  const handleMoveUp = useCallback((idx: number) => {
    if (idx <= 0) return;
    setWaypoints(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

  const handleMoveDown = useCallback((idx: number) => {
    setWaypoints(prev => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  const handleDeleteWaypoint = useCallback((idx: number) => {
    setWaypoints(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleClearAll = useCallback(() => {
    setWaypoints([]);
    setRouteName('');
    setOrigin('');
    setDestination('');
    setOriginCoords(null);
    setDestinationCoords(null);
    setAutoRouteName(null);
    setCargoItems([]);
    setVehicleAllocations([]);
    setPersonnelRoles([]);
    setPersonnelMode('summary');
    setConvoyVehicles([]);
    setUnassignedPersonnel([]);
    setPersonnelSearchQuery('');
    setPersonnelSearchResults([]);
    setAssignTargetVehicleId(null);
    setShowRoleSelector(null);
    setPriority('ROUTINE');
    setAvgSpeed(40);
    setDepartureTime('');
    setNotes('');
    setOriginEquipment([]);
    setOriginSupply([]);
    setSelectionMode('waypoint');
  }, []);

  const handleSave = useCallback(() => {
    const totalVehicles = vehicleAllocations.reduce((sum, v) => sum + v.quantity, 0);
    const totalPersonnel =
      personnelMode === 'detailed'
        ? totalDetailedPersonnel
        : personnelRoles.reduce((sum, p) => sum + p.count, 0);

    // Build convoy manifest for detailed mode
    const convoyManifestData: ConvoyManifest | undefined =
      personnelMode === 'detailed'
        ? {
            movementId: '',
            vehicles: convoyVehicles,
            unassignedPersonnel,
            totalVehicles,
            totalPersonnel,
          }
        : undefined;

    const manifest: MovementManifest = {
      cargo: cargoItems.filter(c => c.quantity > 0),
      vehicles: vehicleAllocations.filter(v => v.quantity > 0),
      personnelByRole: personnelRoles.filter(p => p.count > 0),
      totalWeightTons: 0,
      totalVehicles,
      totalPersonnel,
      convoyManifest: convoyManifestData,
    };

    const cargoSummary = manifest.cargo
      .map(c => `CL ${c.supplyClass}: ${c.quantity} ${c.unit}`)
      .join(', ');

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
      cargo: cargoSummary,
      priority,
      departureTime: departureTime ? new Date(departureTime).toISOString() : undefined,
      eta,
      vehicles: totalVehicles,
      personnel: totalPersonnel,
      notes: notes || undefined,
      routeWaypoints: waypoints,
      manifest:
        manifest.cargo.length > 0 || manifest.vehicles.length > 0 || manifest.personnelByRole.length > 0
          ? manifest
          : undefined,
      originCoords: originCoords || undefined,
      destinationCoords: destinationCoords || undefined,
    });

    handleClearAll();
  }, [
    vehicleAllocations,
    personnelRoles,
    personnelMode,
    convoyVehicles,
    unassignedPersonnel,
    totalDetailedPersonnel,
    cargoItems,
    departureTime,
    totalDistance,
    avgSpeed,
    onSaveRoute,
    routeName,
    origin,
    destination,
    priority,
    notes,
    waypoints,
    originCoords,
    destinationCoords,
    handleClearAll,
  ]);

  // ---------------------------------------------------------------------------
  // Auto-route handler
  // ---------------------------------------------------------------------------

  const handleAutoRoute = useCallback(() => {
    if (!originCoords || !destinationCoords || !mapData) return;
    const result = autoGenerateRoute(originCoords, destinationCoords, mapData.routes);
    if (result) {
      setWaypoints(result.waypoints);
      setAutoRouteName(result.routeName);
    }
  }, [originCoords, destinationCoords, mapData]);

  // ---------------------------------------------------------------------------
  // Origin / destination selection helpers
  // ---------------------------------------------------------------------------

  const selectOriginUnit = useCallback(
    (unitId: string, abbreviation: string, lat: number, lon: number) => {
      setOrigin(abbreviation);
      setOriginCoords({ lat, lon });
      setSelectionMode('waypoint');
      const supplyUnitId = MAP_TO_SUPPLY_UNIT[unitId];
      if (supplyUnitId) {
        mockApi.getUnitEquipment(supplyUnitId).then(setOriginEquipment);
        mockApi.getUnitSupply(supplyUnitId).then(setOriginSupply);
      }
    },
    [],
  );

  const selectDestinationUnit = useCallback(
    (abbreviation: string, lat: number, lon: number) => {
      setDestination(abbreviation);
      setDestinationCoords({ lat, lon });
      setSelectionMode('waypoint');
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Guard
  // ---------------------------------------------------------------------------

  if (!isOpen) return null;

  // ---------------------------------------------------------------------------
  // Derived polyline positions
  // ---------------------------------------------------------------------------

  const polylinePositions: [number, number][] = waypoints.map(wp => [wp.lat, wp.lon]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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
      {/* ================================================================== */}
      {/* LEFT: Map (65%)                                                     */}
      {/* ================================================================== */}
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

          {/* ── Unit markers ─────────────────────────────────────────── */}
          {mapData?.units.map(unit => (
            <Marker
              key={unit.unit_id}
              position={[unit.latitude, unit.longitude]}
              icon={createMilSymbolIcon(unit.symbol_sidc, 35, getStatusColor(unit.supply_status))}
              eventHandlers={{
                click: () => {
                  if (selectionMode === 'origin') {
                    selectOriginUnit(unit.unit_id, unit.abbreviation, unit.latitude, unit.longitude);
                  } else if (selectionMode === 'destination') {
                    selectDestinationUnit(unit.abbreviation, unit.latitude, unit.longitude);
                  }
                },
              }}
            >
              <Tooltip permanent={false}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                  {unit.abbreviation} ({unit.supply_status})
                </span>
              </Tooltip>
            </Marker>
          ))}

          {/* ── Supply point markers ─────────────────────────────────── */}
          {mapData?.supplyPoints.map(sp => (
            <Marker
              key={sp.id}
              position={[sp.latitude, sp.longitude]}
              icon={createSupplyPointIcon(sp.point_type)}
              eventHandlers={{
                click: () => {
                  if (selectionMode === 'origin') {
                    setOrigin(sp.name);
                    setOriginCoords({ lat: sp.latitude, lon: sp.longitude });
                    setSelectionMode('waypoint');
                  } else if (selectionMode === 'destination') {
                    setDestination(sp.name);
                    setDestinationCoords({ lat: sp.latitude, lon: sp.longitude });
                    setSelectionMode('waypoint');
                  }
                },
              }}
            >
              <Tooltip permanent={false}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                  {sp.name} ({sp.point_type})
                </span>
              </Tooltip>
            </Marker>
          ))}

          {/* ── MSR/ASR route polylines ──────────────────────────────── */}
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
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                    {route.name} ({route.route_type}) — {route.status}
                  </span>
                </Tooltip>
              </Polyline>
            );
          })}

          {/* ── Origin pin ───────────────────────────────────────────── */}
          {originCoords && (
            <Marker position={[originCoords.lat, originCoords.lon]} icon={createPinIcon('#40c057')}>
              <Tooltip permanent>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>ORIGIN: {origin}</span>
              </Tooltip>
            </Marker>
          )}

          {/* ── Destination pin ──────────────────────────────────────── */}
          {destinationCoords && (
            <Marker position={[destinationCoords.lat, destinationCoords.lon]} icon={createPinIcon('#ff6b6b')}>
              <Tooltip permanent>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>DEST: {destination}</span>
              </Tooltip>
            </Marker>
          )}

          {/* ── Auto-route highlight polyline ────────────────────────── */}
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

          {/* ── Planned route polyline ───────────────────────────────── */}
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

          {/* ── Waypoint markers ─────────────────────────────────────── */}
          {waypoints.map((wp, idx) => (
            <Marker key={`wp-${idx}`} position={[wp.lat, wp.lon]} icon={createNumberedIcon(idx + 1)} />
          ))}
        </MapContainer>

        {/* ── Legend overlay (top-left) ─────────────────────────────── */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <div style={{ width: 14, height: 2, backgroundColor: '#40c057' }} />
            OPEN
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <div style={{ width: 14, height: 2, backgroundColor: '#fab005' }} />
            RESTRICTED
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 14, height: 2, backgroundColor: '#868e96' }} />
            CLOSED
          </div>
        </div>

        {/* ── Mode indicator overlay (bottom-left) ─────────────────── */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            zIndex: 1000,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color:
              selectionMode === 'origin'
                ? '#40c057'
                : selectionMode === 'destination'
                  ? '#ff6b6b'
                  : 'var(--color-text-muted)',
            backgroundColor: 'var(--color-bg-elevated)',
            padding: '4px 10px',
            borderRadius: 'var(--radius)',
            border: `1px solid ${
              selectionMode === 'origin'
                ? '#40c057'
                : selectionMode === 'destination'
                  ? '#ff6b6b'
                  : 'var(--color-border)'
            }`,
          }}
        >
          {selectionMode === 'origin'
            ? 'CLICK UNIT/POINT TO SET ORIGIN'
            : selectionMode === 'destination'
              ? 'CLICK UNIT/POINT TO SET DESTINATION'
              : 'CLICK MAP TO ADD WAYPOINTS'}
        </div>
      </div>

      {/* ================================================================== */}
      {/* RIGHT: Form panel (35%)                                             */}
      {/* ================================================================== */}
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
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 16px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={routeName}
              onChange={e => setRouteName(e.target.value)}
              placeholder="CONVOY NAME"
              style={{
                ...inputStyle,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '2px',
                color: 'var(--color-text-bright)',
                backgroundColor: 'transparent',
                border: 'none',
                padding: 0,
              }}
            />
          </div>
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

        {/* ── Scrollable form body ───────────────────────────────────── */}
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
          {/* ============================================================ */}
          {/* ROUTE Section                                                 */}
          {/* ============================================================ */}
          <div>
            <SectionHeader
              title="ROUTE"
              expanded={expandedSections.route}
              onToggle={() => toggleSection('route')}
              count={waypoints.length}
            />
            {expandedSections.route && (
              <div style={{ paddingTop: 8 }}>
                {/* ── Origin row ──────────────────────────────────────── */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={labelStyle}>ORIGIN</div>
                    <div
                      style={{
                        ...inputStyle,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        minHeight: 32,
                      }}
                    >
                      <span style={{ flex: 1 }}>{origin || '—'}</span>
                      {originCoords && (
                        <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>
                          {formatCoord(originCoords.lat, originCoords.lon)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectionMode('origin')}
                    style={{
                      ...smallActionBtnStyle,
                      backgroundColor:
                        selectionMode === 'origin' ? 'var(--color-accent)' : 'var(--color-bg)',
                      color: selectionMode === 'origin' ? '#fff' : 'var(--color-text-muted)',
                      marginTop: 16,
                    }}
                  >
                    <MapPin size={12} /> SELECT
                  </button>
                </div>
                {/* Origin quick select */}
                <select
                  value=""
                  onChange={e => {
                    const val = e.target.value;
                    if (!val || !mapData) return;
                    const unit = mapData.units.find(u => u.unit_id === val);
                    if (unit) {
                      selectOriginUnit(unit.unit_id, unit.abbreviation, unit.latitude, unit.longitude);
                      return;
                    }
                    const sp = mapData.supplyPoints.find(s => s.id === val);
                    if (sp) {
                      setOrigin(sp.name);
                      setOriginCoords({ lat: sp.latitude, lon: sp.longitude });
                    }
                  }}
                  style={{ ...inputStyle, marginBottom: 8 }}
                >
                  <option value="">-- Quick select origin --</option>
                  <optgroup label="UNITS">
                    {mapData?.units.map(u => (
                      <option key={u.unit_id} value={u.unit_id}>
                        {u.abbreviation}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="SUPPLY POINTS">
                    {mapData?.supplyPoints.map(sp => (
                      <option key={sp.id} value={sp.id}>
                        {sp.name}
                      </option>
                    ))}
                  </optgroup>
                </select>

                {/* ── Destination row ─────────────────────────────────── */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={labelStyle}>DESTINATION</div>
                    <div
                      style={{
                        ...inputStyle,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        minHeight: 32,
                      }}
                    >
                      <span style={{ flex: 1 }}>{destination || '—'}</span>
                      {destinationCoords && (
                        <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>
                          {formatCoord(destinationCoords.lat, destinationCoords.lon)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectionMode('destination')}
                    style={{
                      ...smallActionBtnStyle,
                      backgroundColor:
                        selectionMode === 'destination' ? 'var(--color-accent)' : 'var(--color-bg)',
                      color: selectionMode === 'destination' ? '#fff' : 'var(--color-text-muted)',
                      marginTop: 16,
                    }}
                  >
                    <MapPin size={12} /> SELECT
                  </button>
                </div>
                {/* Destination quick select */}
                <select
                  value=""
                  onChange={e => {
                    const val = e.target.value;
                    if (!val || !mapData) return;
                    const unit = mapData.units.find(u => u.unit_id === val);
                    if (unit) {
                      selectDestinationUnit(unit.abbreviation, unit.latitude, unit.longitude);
                      return;
                    }
                    const sp = mapData.supplyPoints.find(s => s.id === val);
                    if (sp) {
                      setDestination(sp.name);
                      setDestinationCoords({ lat: sp.latitude, lon: sp.longitude });
                    }
                  }}
                  style={{ ...inputStyle, marginBottom: 8 }}
                >
                  <option value="">-- Quick select destination --</option>
                  <optgroup label="UNITS">
                    {mapData?.units.map(u => (
                      <option key={u.unit_id} value={u.unit_id}>
                        {u.abbreviation}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="SUPPLY POINTS">
                    {mapData?.supplyPoints.map(sp => (
                      <option key={sp.id} value={sp.id}>
                        {sp.name}
                      </option>
                    ))}
                  </optgroup>
                </select>

                {/* ── Auto-route button ────────────────────────────────── */}
                <button
                  onClick={handleAutoRoute}
                  disabled={!originCoords || !destinationCoords}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '1px',
                    color:
                      originCoords && destinationCoords
                        ? 'var(--color-accent)'
                        : 'var(--color-text-muted)',
                    backgroundColor: 'var(--color-bg)',
                    border: `1px solid ${
                      originCoords && destinationCoords
                        ? 'var(--color-accent)'
                        : 'var(--color-border)'
                    }`,
                    borderRadius: 'var(--radius)',
                    cursor: originCoords && destinationCoords ? 'pointer' : 'not-allowed',
                    opacity: originCoords && destinationCoords ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  <Navigation size={12} /> AUTO-ROUTE VIA MSR/ASR
                </button>
                {autoRouteName && (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: 'var(--color-accent)',
                      marginBottom: 8,
                    }}
                  >
                    Route via: {autoRouteName}
                  </div>
                )}

                {/* ── Waypoint list ───────────────────────────────────── */}
                <div style={{ ...labelStyle, marginBottom: 6 }}>WAYPOINTS ({waypoints.length})</div>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
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
                      <span
                        style={{
                          fontWeight: 700,
                          color: 'var(--color-accent)',
                          minWidth: 16,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span style={{ flex: 1, color: 'var(--color-text-muted)' }}>
                        {wp.label || formatCoord(wp.lat, wp.lon)}
                      </span>
                      {idx < segmentDistances.length && (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 9 }}>
                          {segmentDistances[idx].toFixed(1)}km
                        </span>
                      )}
                      <button
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        style={{ ...smallBtnStyle, opacity: idx === 0 ? 0.3 : 1 }}
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

                {/* ── Route summary ───────────────────────────────────── */}
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
            )}
          </div>

          {/* ============================================================ */}
          {/* CARGO MANIFEST Section                                        */}
          {/* ============================================================ */}
          <div>
            <SectionHeader
              title="CARGO MANIFEST"
              expanded={expandedSections.cargo}
              onToggle={() => toggleSection('cargo')}
              count={cargoItems.length}
            />
            {expandedSections.cargo && (
              <div style={{ paddingTop: 8 }}>
                {cargoItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '100px 1fr 60px 60px 24px',
                      gap: 4,
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <select
                      value={item.supplyClass}
                      onChange={e => {
                        const next = [...cargoItems];
                        next[idx] = { ...next[idx], supplyClass: e.target.value as SupplyClass };
                        setCargoItems(next);
                      }}
                      style={{ ...inputStyle, padding: '4px 6px', fontSize: 10 }}
                    >
                      {Object.values(SupplyClass).map(sc => (
                        <option key={sc} value={sc}>
                          CL {sc}
                        </option>
                      ))}
                    </select>
                    <input
                      value={item.description}
                      onChange={e => {
                        const next = [...cargoItems];
                        next[idx] = { ...next[idx], description: e.target.value };
                        setCargoItems(next);
                      }}
                      placeholder="Description"
                      style={{ ...inputStyle, padding: '4px 6px', fontSize: 10 }}
                    />
                    <input
                      type="number"
                      min={0}
                      value={item.quantity}
                      onChange={e => {
                        const next = [...cargoItems];
                        next[idx] = { ...next[idx], quantity: parseInt(e.target.value) || 0 };
                        setCargoItems(next);
                      }}
                      style={{ ...inputStyle, padding: '4px 6px', fontSize: 10 }}
                    />
                    <select
                      value={item.unit}
                      onChange={e => {
                        const next = [...cargoItems];
                        next[idx] = { ...next[idx], unit: e.target.value };
                        setCargoItems(next);
                      }}
                      style={{ ...inputStyle, padding: '4px 6px', fontSize: 10 }}
                    >
                      <option value="T">T</option>
                      <option value="GAL">GAL</option>
                      <option value="EA">EA</option>
                      <option value="CASES">CASES</option>
                    </select>
                    <button
                      onClick={() => setCargoItems(prev => prev.filter((_, i) => i !== idx))}
                      style={{ ...smallBtnStyle, color: 'var(--color-danger)' }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setCargoItems(prev => [
                      ...prev,
                      { supplyClass: SupplyClass.I, description: '', quantity: 0, unit: 'EA' },
                    ])
                  }
                  style={{ ...addBtnStyle, marginBottom: 8 }}
                >
                  <Plus size={11} /> ADD CARGO
                </button>

                {/* ── Available at Origin ─────────────────────────────── */}
                {originSupply.length > 0 && (
                  <div
                    style={{
                      marginTop: 4,
                      padding: 8,
                      backgroundColor: 'rgba(77,171,247,0.05)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    <div style={{ ...labelStyle, fontSize: 8, marginBottom: 4 }}>
                      <Package size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      AVAILABLE AT ORIGIN
                    </div>
                    {Object.values(SupplyClass).map(sc => {
                      const items = originSupply.filter(s => s.supplyClass === sc);
                      if (items.length === 0) return null;
                      return items.map(s => (
                        <div
                          key={s.id}
                          onClick={() =>
                            setCargoItems(prev => [
                              ...prev,
                              { supplyClass: sc, description: s.item, quantity: 0, unit: 'EA' },
                            ])
                          }
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '2px 4px',
                            fontSize: 9,
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            borderRadius: 2,
                          }}
                          onMouseEnter={e =>
                            (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                          }
                          onMouseLeave={e =>
                            (e.currentTarget.style.backgroundColor = 'transparent')
                          }
                        >
                          <span>
                            CL {sc}: {s.item}
                          </span>
                          <span>
                            {s.onHand} OH / {s.dos.toFixed(1)} DOS
                          </span>
                        </div>
                      ));
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* VEHICLES Section                                              */}
          {/* ============================================================ */}
          <div>
            <SectionHeader
              title="VEHICLES"
              expanded={expandedSections.vehicles}
              onToggle={() => toggleSection('vehicles')}
              count={vehicleAllocations.reduce((sum, v) => sum + v.quantity, 0)}
            />
            {expandedSections.vehicles && (
              <div style={{ paddingTop: 8 }}>
                {vehicleAllocations.map((v, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 60px 80px 24px',
                      gap: 4,
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <select
                      value={v.type}
                      onChange={e => {
                        const eq = originEquipment.find(eq => eq.type === e.target.value);
                        const next = [...vehicleAllocations];
                        next[idx] = {
                          ...next[idx],
                          type: e.target.value,
                          tamcn: eq?.tamcn || v.tamcn,
                          available: eq?.missionCapable || 0,
                        };
                        setVehicleAllocations(next);
                      }}
                      style={{ ...inputStyle, padding: '4px 6px', fontSize: 10 }}
                    >
                      <option value="">-- Select --</option>
                      {originEquipment
                        .filter(
                          eq =>
                            eq.type.includes('HMMWV') ||
                            eq.type.includes('MTVR') ||
                            eq.type.includes('JLTV') ||
                            eq.type.includes('Growler') ||
                            eq.type.includes('LAV'),
                        )
                        .map(eq => (
                          <option key={eq.id} value={eq.type}>
                            {eq.type} ({eq.missionCapable} MC / {eq.onHand} OH)
                          </option>
                        ))}
                      {v.type && !originEquipment.find(eq => eq.type === v.type) && (
                        <option value={v.type}>{v.type}</option>
                      )}
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={v.quantity}
                      onChange={e => {
                        const next = [...vehicleAllocations];
                        next[idx] = { ...next[idx], quantity: parseInt(e.target.value) || 0 };
                        setVehicleAllocations(next);
                      }}
                      placeholder="Qty"
                      style={{ ...inputStyle, padding: '4px 6px', fontSize: 10 }}
                    />
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {v.available} MC AVAIL
                    </span>
                    <button
                      onClick={() =>
                        setVehicleAllocations(prev => prev.filter((_, i) => i !== idx))
                      }
                      style={{ ...smallBtnStyle, color: 'var(--color-danger)' }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setVehicleAllocations(prev => [
                      ...prev,
                      { type: '', tamcn: '', quantity: 0, available: 0 },
                    ])
                  }
                  style={addBtnStyle}
                >
                  <Plus size={11} /> ADD VEHICLE
                </button>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--color-text-muted)',
                    marginTop: 4,
                  }}
                >
                  <Truck size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  TOTAL: {vehicleAllocations.reduce((sum, v) => sum + v.quantity, 0)} VEHICLES
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* PERSONNEL Section                                             */}
          {/* ============================================================ */}
          <div>
            <SectionHeader
              title="PERSONNEL"
              expanded={expandedSections.personnel}
              onToggle={() => toggleSection('personnel')}
              count={
                personnelMode === 'detailed'
                  ? totalDetailedPersonnel
                  : personnelRoles.reduce((sum, p) => sum + p.count, 0)
              }
            />
            {expandedSections.personnel && (
              <div style={{ paddingTop: 8 }}>
                {/* ── Mode toggle (segmented control) ──────────────────── */}
                <div
                  style={{
                    display: 'flex',
                    marginBottom: 8,
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => setPersonnelMode('summary')}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor:
                        personnelMode === 'summary' ? 'var(--color-accent)' : 'var(--color-bg)',
                      color: personnelMode === 'summary' ? '#fff' : 'var(--color-text-muted)',
                    }}
                  >
                    SUMMARY
                  </button>
                  <button
                    onClick={() => setPersonnelMode('detailed')}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      border: 'none',
                      borderLeft: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      backgroundColor:
                        personnelMode === 'detailed' ? 'var(--color-accent)' : 'var(--color-bg)',
                      color: personnelMode === 'detailed' ? '#fff' : 'var(--color-text-muted)',
                    }}
                  >
                    DETAILED
                  </button>
                </div>

                {/* ── SUMMARY MODE (existing behavior) ─────────────────── */}
                {personnelMode === 'summary' && (
                  <>
                    {personnelRoles.map((p, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 60px 24px',
                          gap: 4,
                          alignItems: 'center',
                          marginBottom: 4,
                        }}
                      >
                        <input
                          value={p.role}
                          onChange={e => {
                            const next = [...personnelRoles];
                            next[idx] = { ...next[idx], role: e.target.value };
                            setPersonnelRoles(next);
                          }}
                          placeholder="Role"
                          style={{ ...inputStyle, padding: '4px 6px', fontSize: 10 }}
                        />
                        <input
                          type="number"
                          min={0}
                          value={p.count}
                          onChange={e => {
                            const next = [...personnelRoles];
                            next[idx] = { ...next[idx], count: parseInt(e.target.value) || 0 };
                            setPersonnelRoles(next);
                          }}
                          style={{ ...inputStyle, padding: '4px 6px', fontSize: 10 }}
                        />
                        <button
                          onClick={() => setPersonnelRoles(prev => prev.filter((_, i) => i !== idx))}
                          style={{ ...smallBtnStyle, color: 'var(--color-danger)' }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                      {DEFAULT_ROLES.filter(role => !personnelRoles.find(p => p.role === role)).map(
                        role => (
                          <button
                            key={role}
                            onClick={() => setPersonnelRoles(prev => [...prev, { role, count: 0 }])}
                            style={{
                              padding: '2px 6px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 8,
                              backgroundColor: 'var(--color-bg)',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius)',
                              color: 'var(--color-text-muted)',
                              cursor: 'pointer',
                            }}
                          >
                            + {role}
                          </button>
                        ),
                      )}
                    </div>
                    <button
                      onClick={() => setPersonnelRoles(prev => [...prev, { role: '', count: 0 }])}
                      style={addBtnStyle}
                    >
                      <Plus size={11} /> ADD ROLE
                    </button>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        color: 'var(--color-text-muted)',
                        marginTop: 4,
                      }}
                    >
                      <Users size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      TOTAL: {personnelRoles.reduce((sum, p) => sum + p.count, 0)} PERSONNEL
                    </div>
                  </>
                )}

                {/* ── DETAILED MODE ────────────────────────────────────── */}
                {personnelMode === 'detailed' && (
                  <>
                    {/* ── Convoy Vehicles ───────────────────────────────── */}
                    <div style={{ ...labelStyle, marginBottom: 6 }}>
                      <Truck size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      CONVOY VEHICLES ({convoyVehicles.length})
                    </div>

                    {convoyVehicles.length === 0 && (
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: 'var(--color-text-muted)',
                          padding: '8px 0',
                        }}
                      >
                        Add vehicles in the Vehicles section above to assign personnel.
                      </div>
                    )}

                    {convoyVehicles.map(cv => (
                      <div
                        key={cv.id}
                        style={{
                          marginBottom: 8,
                          padding: 8,
                          backgroundColor: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius)',
                        }}
                      >
                        {/* Vehicle header */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 6,
                          }}
                        >
                          <Truck size={12} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 10,
                              fontWeight: 700,
                              color: 'var(--color-text-bright)',
                            }}
                          >
                            {cv.vehicleType || 'VEHICLE'} #{cv.sequenceNumber}
                          </span>
                        </div>

                        {/* Bumper number + call sign */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 4,
                            marginBottom: 6,
                          }}
                        >
                          <div>
                            <div style={{ ...labelStyle, fontSize: 8 }}>BUMPER #</div>
                            <input
                              value={cv.bumperNumber || ''}
                              onChange={e =>
                                handleUpdateConvoyVehicle(cv.id, 'bumperNumber', e.target.value)
                              }
                              placeholder="e.g. HQ-01"
                              style={{ ...inputStyle, padding: '3px 6px', fontSize: 9 }}
                            />
                          </div>
                          <div>
                            <div style={{ ...labelStyle, fontSize: 8 }}>CALL SIGN</div>
                            <input
                              value={cv.callSign || ''}
                              onChange={e =>
                                handleUpdateConvoyVehicle(cv.id, 'callSign', e.target.value)
                              }
                              placeholder="e.g. RAIDER-1"
                              style={{ ...inputStyle, padding: '3px 6px', fontSize: 9 }}
                            />
                          </div>
                        </div>

                        {/* Assigned personnel list */}
                        {cv.assignedPersonnel.length > 0 && (
                          <div style={{ marginBottom: 4 }}>
                            {cv.assignedPersonnel.map(ap => (
                              <div
                                key={ap.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '3px 4px',
                                  marginBottom: 2,
                                  backgroundColor: 'var(--color-bg-elevated)',
                                  borderRadius: 'var(--radius)',
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 9,
                                }}
                              >
                                <span
                                  style={{
                                    padding: '1px 4px',
                                    borderRadius: 'var(--radius)',
                                    backgroundColor: 'var(--color-accent)',
                                    color: '#fff',
                                    fontSize: 8,
                                    fontWeight: 700,
                                    flexShrink: 0,
                                  }}
                                >
                                  {ap.role.replace('_', '-')}
                                </span>
                                <span style={{ flex: 1, color: 'var(--color-text)' }}>
                                  {ap.personnel.rank ? `${ap.personnel.rank} ` : ''}
                                  {ap.personnel.lastName}, {ap.personnel.firstName}
                                </span>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: 8 }}>
                                  {ap.personnel.mos || ''}
                                </span>
                                <button
                                  onClick={() => handleRemoveAssignedPersonnel(ap.id, cv.id)}
                                  style={{
                                    ...smallBtnStyle,
                                    width: 18,
                                    height: 18,
                                    color: 'var(--color-danger)',
                                  }}
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Assign personnel button + search */}
                        {assignTargetVehicleId === cv.id ? (
                          <div>
                            {/* Search input */}
                            <div style={{ position: 'relative', marginBottom: 4 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  ...inputStyle,
                                  padding: '3px 6px',
                                  fontSize: 9,
                                }}
                              >
                                <Search size={10} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                                <input
                                  value={personnelSearchQuery}
                                  onChange={e => setPersonnelSearchQuery(e.target.value)}
                                  placeholder="Search by name, EDIPI..."
                                  autoFocus
                                  style={{
                                    flex: 1,
                                    border: 'none',
                                    outline: 'none',
                                    backgroundColor: 'transparent',
                                    color: 'var(--color-text)',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 9,
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    setAssignTargetVehicleId(null);
                                    setPersonnelSearchQuery('');
                                    setPersonnelSearchResults([]);
                                    setShowRoleSelector(null);
                                  }}
                                  style={{ ...smallBtnStyle, width: 16, height: 16 }}
                                >
                                  <X size={9} />
                                </button>
                              </div>

                              {/* Search results dropdown */}
                              {personnelSearchResults.length > 0 && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    zIndex: 10,
                                    maxHeight: 160,
                                    overflowY: 'auto',
                                    backgroundColor: 'var(--color-bg-elevated)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius)',
                                    marginTop: 2,
                                  }}
                                >
                                  {personnelSearchResults.map(person => (
                                    <div key={person.id}>
                                      <div
                                        onClick={() => {
                                          if (showRoleSelector === person.id) {
                                            setShowRoleSelector(null);
                                          } else {
                                            setShowRoleSelector(person.id);

                                          }
                                        }}
                                        style={{
                                          padding: '4px 8px',
                                          fontFamily: 'var(--font-mono)',
                                          fontSize: 9,
                                          color: 'var(--color-text)',
                                          cursor: 'pointer',
                                          borderBottom: '1px solid var(--color-border)',
                                          backgroundColor:
                                            showRoleSelector === person.id
                                              ? 'rgba(77,171,247,0.1)'
                                              : 'transparent',
                                        }}
                                        onMouseEnter={e => {
                                          if (showRoleSelector !== person.id)
                                            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                                        }}
                                        onMouseLeave={e => {
                                          if (showRoleSelector !== person.id)
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                      >
                                        <span style={{ fontWeight: 600 }}>
                                          {person.rank ? `${person.rank} ` : ''}
                                          {person.lastName}, {person.firstName}
                                        </span>
                                        <span style={{ color: 'var(--color-text-muted)', marginLeft: 6 }}>
                                          ({person.edipi})
                                        </span>
                                        {person.mos && (
                                          <span style={{ color: 'var(--color-text-muted)', marginLeft: 4 }}>
                                            — {person.mos}
                                          </span>
                                        )}
                                      </div>
                                      {/* Role selector inline */}
                                      {showRoleSelector === person.id && (
                                        <div
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            padding: '4px 8px',
                                            backgroundColor: 'rgba(77,171,247,0.05)',
                                            borderBottom: '1px solid var(--color-border)',
                                            flexWrap: 'wrap',
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontFamily: 'var(--font-mono)',
                                              fontSize: 8,
                                              color: 'var(--color-text-muted)',
                                              marginRight: 2,
                                            }}
                                          >
                                            ROLE:
                                          </span>
                                          {Object.values(ConvoyRole).map(role => (
                                            <button
                                              key={role}
                                              onClick={() => {
                                                handleAssignPersonnel(person, cv.id, role);
                                              }}
                                              style={{
                                                padding: '2px 6px',
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: 8,
                                                fontWeight: 600,
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--radius)',
                                                cursor: 'pointer',
                                                backgroundColor: 'var(--color-bg)',
                                                color: 'var(--color-text)',
                                              }}
                                              onMouseEnter={e => {
                                                e.currentTarget.style.backgroundColor = 'var(--color-accent)';
                                                e.currentTarget.style.color = '#fff';
                                              }}
                                              onMouseLeave={e => {
                                                e.currentTarget.style.backgroundColor = 'var(--color-bg)';
                                                e.currentTarget.style.color = 'var(--color-text)';
                                              }}
                                            >
                                              {role.replace('_', '-')}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Loading indicator */}
                              {personnelSearchLoading && personnelSearchQuery.length >= 2 && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    padding: '6px 8px',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 9,
                                    color: 'var(--color-text-muted)',
                                    backgroundColor: 'var(--color-bg-elevated)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius)',
                                    marginTop: 2,
                                  }}
                                >
                                  Searching...
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setAssignTargetVehicleId(cv.id);
                              setPersonnelSearchQuery('');
                              setPersonnelSearchResults([]);
                              setShowRoleSelector(null);
                            }}
                            style={{
                              ...addBtnStyle,
                              fontSize: 8,
                              padding: '3px 6px',
                            }}
                          >
                            <UserPlus size={10} /> ASSIGN PERSONNEL
                          </button>
                        )}
                      </div>
                    ))}

                    {/* ── Unassigned Personnel ─────────────────────────── */}
                    <div style={{ ...labelStyle, marginTop: 8, marginBottom: 6 }}>
                      <Shield size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      UNASSIGNED PERSONNEL ({unassignedPersonnel.length})
                    </div>

                    {unassignedPersonnel.map(ap => (
                      <div
                        key={ap.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 6px',
                          marginBottom: 2,
                          backgroundColor: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                        }}
                      >
                        <span
                          style={{
                            padding: '1px 4px',
                            borderRadius: 'var(--radius)',
                            backgroundColor: 'var(--color-text-muted)',
                            color: '#fff',
                            fontSize: 8,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {ap.role.replace('_', '-')}
                        </span>
                        <span style={{ flex: 1, color: 'var(--color-text)' }}>
                          {ap.personnel.rank ? `${ap.personnel.rank} ` : ''}
                          {ap.personnel.lastName}, {ap.personnel.firstName}
                        </span>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 8 }}>
                          {ap.personnel.mos || ''}
                        </span>
                        <button
                          onClick={() => handleRemoveAssignedPersonnel(ap.id, null)}
                          style={{
                            ...smallBtnStyle,
                            width: 18,
                            height: 18,
                            color: 'var(--color-danger)',
                          }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}

                    {/* Add unassigned personnel */}
                    {assignTargetVehicleId === '__unassigned__' ? (
                      <div style={{ position: 'relative', marginTop: 4 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            ...inputStyle,
                            padding: '3px 6px',
                            fontSize: 9,
                          }}
                        >
                          <Search size={10} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                          <input
                            value={personnelSearchQuery}
                            onChange={e => setPersonnelSearchQuery(e.target.value)}
                            placeholder="Search by name, EDIPI..."
                            autoFocus
                            style={{
                              flex: 1,
                              border: 'none',
                              outline: 'none',
                              backgroundColor: 'transparent',
                              color: 'var(--color-text)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 9,
                            }}
                          />
                          <button
                            onClick={() => {
                              setAssignTargetVehicleId(null);
                              setPersonnelSearchQuery('');
                              setPersonnelSearchResults([]);
                              setShowRoleSelector(null);
                            }}
                            style={{ ...smallBtnStyle, width: 16, height: 16 }}
                          >
                            <X size={9} />
                          </button>
                        </div>

                        {/* Search results dropdown */}
                        {personnelSearchResults.length > 0 && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              zIndex: 10,
                              maxHeight: 160,
                              overflowY: 'auto',
                              backgroundColor: 'var(--color-bg-elevated)',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius)',
                              marginTop: 2,
                            }}
                          >
                            {personnelSearchResults.map(person => (
                              <div key={person.id}>
                                <div
                                  onClick={() => {
                                    if (showRoleSelector === person.id) {
                                      setShowRoleSelector(null);
                                    } else {
                                      setShowRoleSelector(person.id);
                                    }
                                  }}
                                  style={{
                                    padding: '4px 8px',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 9,
                                    color: 'var(--color-text)',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid var(--color-border)',
                                    backgroundColor:
                                      showRoleSelector === person.id
                                        ? 'rgba(77,171,247,0.1)'
                                        : 'transparent',
                                  }}
                                  onMouseEnter={e => {
                                    if (showRoleSelector !== person.id)
                                      e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                                  }}
                                  onMouseLeave={e => {
                                    if (showRoleSelector !== person.id)
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <span style={{ fontWeight: 600 }}>
                                    {person.rank ? `${person.rank} ` : ''}
                                    {person.lastName}, {person.firstName}
                                  </span>
                                  <span style={{ color: 'var(--color-text-muted)', marginLeft: 6 }}>
                                    ({person.edipi})
                                  </span>
                                  {person.mos && (
                                    <span style={{ color: 'var(--color-text-muted)', marginLeft: 4 }}>
                                      — {person.mos}
                                    </span>
                                  )}
                                </div>
                                {/* Role selector inline */}
                                {showRoleSelector === person.id && (
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      padding: '4px 8px',
                                      backgroundColor: 'rgba(77,171,247,0.05)',
                                      borderBottom: '1px solid var(--color-border)',
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: 8,
                                        color: 'var(--color-text-muted)',
                                        marginRight: 2,
                                      }}
                                    >
                                      ROLE:
                                    </span>
                                    {Object.values(ConvoyRole).map(role => (
                                      <button
                                        key={role}
                                        onClick={() => {
                                          handleAssignPersonnel(person, null, role);
                                        }}
                                        style={{
                                          padding: '2px 6px',
                                          fontFamily: 'var(--font-mono)',
                                          fontSize: 8,
                                          fontWeight: 600,
                                          border: '1px solid var(--color-border)',
                                          borderRadius: 'var(--radius)',
                                          cursor: 'pointer',
                                          backgroundColor:
                                            role === ConvoyRole.PAX ? 'var(--color-accent)' : 'var(--color-bg)',
                                          color: role === ConvoyRole.PAX ? '#fff' : 'var(--color-text)',
                                        }}
                                        onMouseEnter={e => {
                                          e.currentTarget.style.backgroundColor = 'var(--color-accent)';
                                          e.currentTarget.style.color = '#fff';
                                        }}
                                        onMouseLeave={e => {
                                          if (role !== ConvoyRole.PAX) {
                                            e.currentTarget.style.backgroundColor = 'var(--color-bg)';
                                            e.currentTarget.style.color = 'var(--color-text)';
                                          } else {
                                            e.currentTarget.style.backgroundColor = 'var(--color-accent)';
                                            e.currentTarget.style.color = '#fff';
                                          }
                                        }}
                                      >
                                        {role.replace('_', '-')}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Loading indicator */}
                        {personnelSearchLoading && personnelSearchQuery.length >= 2 && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              padding: '6px 8px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 9,
                              color: 'var(--color-text-muted)',
                              backgroundColor: 'var(--color-bg-elevated)',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius)',
                              marginTop: 2,
                            }}
                          >
                            Searching...
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAssignTargetVehicleId('__unassigned__');
                          setPersonnelSearchQuery('');
                          setPersonnelSearchResults([]);
                          setShowRoleSelector(null);
                        }}
                        style={{ ...addBtnStyle, marginTop: 4 }}
                      >
                        <UserPlus size={10} /> ADD UNASSIGNED PERSONNEL
                      </button>
                    )}

                    {/* Total count */}
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        color: 'var(--color-text-muted)',
                        marginTop: 8,
                      }}
                    >
                      <Users size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      TOTAL: {totalDetailedPersonnel} PERSONNEL
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* DETAILS Section                                               */}
          {/* ============================================================ */}
          <div>
            <SectionHeader
              title="DETAILS"
              expanded={expandedSections.details}
              onToggle={() => toggleSection('details')}
            />
            {expandedSections.details && (
              <div style={{ paddingTop: 8 }}>
                {/* Priority */}
                <div style={{ marginBottom: 8 }}>
                  <div style={labelStyle}>PRIORITY</div>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="ROUTINE">ROUTINE</option>
                    <option value="PRIORITY">PRIORITY</option>
                    <option value="URGENT">URGENT</option>
                    <option value="IMMEDIATE">IMMEDIATE</option>
                  </select>
                </div>

                {/* Avg Speed & Departure */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={labelStyle}>AVG SPEED (KPH)</div>
                    <input
                      type="number"
                      min={1}
                      value={avgSpeed}
                      onChange={e => setAvgSpeed(parseInt(e.target.value) || 40)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <div style={labelStyle}>DEPARTURE TIME</div>
                    <input
                      type="datetime-local"
                      value={departureTime}
                      onChange={e => setDepartureTime(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <div style={labelStyle}>NOTES</div>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Additional movement notes..."
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '12px 16px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <button
            onClick={handleClearAll}
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
            CLEAR ALL
          </button>
          <button
            onClick={handleSave}
            disabled={!routeName}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '1px',
              color: !routeName ? 'var(--color-text-muted)' : '#fff',
              backgroundColor: !routeName ? 'var(--color-bg)' : 'var(--color-accent)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              cursor: !routeName ? 'not-allowed' : 'pointer',
              opacity: !routeName ? 0.5 : 1,
            }}
          >
            SAVE MOVEMENT
          </button>
        </div>
      </div>
    </div>
  );
}
