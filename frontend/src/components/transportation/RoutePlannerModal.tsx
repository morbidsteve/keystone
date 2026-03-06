import { useState, useCallback, useMemo, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  SupplyClass,
  MovementStatus,
  type Movement,
  type CargoItem,
  type VehicleAllocation,
  type MovementManifest,
  type EquipmentRecord,
  type SupplyRecord,
  type ConvoyManifest,
} from '@/lib/types';
import { getMapData, type MapData } from '@/api/map';
import { mockApi } from '@/api/mockClient';

import type { Waypoint } from './route-planner/types';
import {
  haversineDistance,
  autoGenerateRoute,
  MAP_TO_SUPPLY_UNIT,
  inputStyle,
} from './route-planner/types';

import RouteMap from './route-planner/RouteMap';
import RouteForm from './route-planner/RouteForm';
import CargoManager from './route-planner/CargoManager';
import { VehicleSection, DetailsSection } from './route-planner/RouteReview';
import PersonnelAssignment from './route-planner/PersonnelAssignment';
import { usePersonnel } from './route-planner/usePersonnel';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RoutePlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRoute: (movement: Partial<Movement>) => void;
}

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

  // Personnel (via hook)
  const personnel = usePersonnel(vehicleAllocations);

  // Details
  const [priority, setPriority] = useState('ROUTINE');
  const [avgSpeed, setAvgSpeed] = useState(40);
  const [departureTime, setDepartureTime] = useState('');
  const [notes, setNotes] = useState('');

  // Origin unit data
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
    return totalDistance / avgSpeed;
  }, [totalDistance, avgSpeed]);

  // ---------------------------------------------------------------------------
  // Section toggle
  // ---------------------------------------------------------------------------

  const toggleSection = useCallback((key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ---------------------------------------------------------------------------
  // Map / route handlers
  // ---------------------------------------------------------------------------

  const handleMapClick = useCallback(
    (lat: number, lon: number) => {
      if (selectionMode === 'waypoint') {
        setWaypoints(prev => [...prev, { lat, lon }]);
      }
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
    personnel.resetPersonnel();
    setPriority('ROUTINE');
    setAvgSpeed(40);
    setDepartureTime('');
    setNotes('');
    setOriginEquipment([]);
    setOriginSupply([]);
    setSelectionMode('waypoint');
  }, [personnel]);

  const handleSave = useCallback(() => {
    const totalVehicles = vehicleAllocations.reduce((sum, v) => sum + v.quantity, 0);
    const totalPersonnel =
      personnel.personnelMode === 'detailed'
        ? personnel.totalDetailedPersonnel
        : personnel.personnelRoles.reduce((sum, p) => sum + p.count, 0);

    const convoyManifestData: ConvoyManifest | undefined =
      personnel.personnelMode === 'detailed'
        ? {
            movementId: '',
            vehicles: personnel.convoyVehicles,
            unassignedPersonnel: personnel.unassignedPersonnel,
            totalVehicles,
            totalPersonnel,
          }
        : undefined;

    const manifest: MovementManifest = {
      cargo: cargoItems.filter(c => c.quantity > 0),
      vehicles: vehicleAllocations.filter(v => v.quantity > 0),
      personnelByRole: personnel.personnelRoles.filter(p => p.count > 0),
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
    personnel,
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
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      className="fixed z-[3000] flex bg-[rgba(0,0,0,0.85)] inset-0"
    >
      {/* LEFT: Map (65%) */}
      <RouteMap
        mapData={mapData}
        waypoints={waypoints}
        origin={origin}
        destination={destination}
        originCoords={originCoords}
        destinationCoords={destinationCoords}
        autoRouteName={autoRouteName}
        selectionMode={selectionMode}
        onMapClick={handleMapClick}
        onUnitClick={selectOriginUnit}
        onDestinationUnitClick={selectDestinationUnit}
        onSupplyPointOrigin={(name, lat, lon) => {
          setOrigin(name);
          setOriginCoords({ lat, lon });
          setSelectionMode('waypoint');
        }}
        onSupplyPointDestination={(name, lat, lon) => {
          setDestination(name);
          setDestinationCoords({ lat, lon });
          setSelectionMode('waypoint');
        }}
      />

      {/* RIGHT: Form panel (35%) */}
      <div
        className="bg-[var(--color-bg-elevated)] border-l border-l-[var(--color-border)] flex flex-col overflow-hidden" style={{ flex: '0 0 35%' }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center py-3.5 px-4 border-b border-b-[var(--color-border)]"
        >
          <div className="flex-1">
            <input
              type="text"
              value={routeName}
              onChange={e => setRouteName(e.target.value)}
              placeholder="CONVOY NAME"
              className="font-bold tracking-[2px] text-[var(--color-text-bright)] bg-transparent border-0 p-0"
            />
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center bg-transparent border-0 text-[var(--color-text-muted)] cursor-pointer p-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable form body */}
        <div
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
        >
          <RouteForm
            expanded={expandedSections.route}
            onToggle={() => toggleSection('route')}
            waypoints={waypoints}
            origin={origin}
            destination={destination}
            originCoords={originCoords}
            destinationCoords={destinationCoords}
            autoRouteName={autoRouteName}
            selectionMode={selectionMode}
            mapData={mapData}
            segmentDistances={segmentDistances}
            totalDistance={totalDistance}
            estimatedTime={estimatedTime}
            onSetSelectionMode={setSelectionMode}
            onSelectOriginUnit={selectOriginUnit}
            onSelectDestinationUnit={selectDestinationUnit}
            onSetOriginFromDropdown={(name, lat, lon) => {
              setOrigin(name);
              setOriginCoords({ lat, lon });
            }}
            onSetDestinationFromDropdown={(name, lat, lon) => {
              setDestination(name);
              setDestinationCoords({ lat, lon });
            }}
            onAutoRoute={handleAutoRoute}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onDeleteWaypoint={handleDeleteWaypoint}
          />

          <CargoManager
            expanded={expandedSections.cargo}
            onToggle={() => toggleSection('cargo')}
            cargoItems={cargoItems}
            originSupply={originSupply}
            onSetCargoItems={setCargoItems}
          />

          <VehicleSection
            expanded={expandedSections.vehicles}
            onToggle={() => toggleSection('vehicles')}
            vehicleAllocations={vehicleAllocations}
            originEquipment={originEquipment}
            onSetVehicleAllocations={setVehicleAllocations}
          />

          <PersonnelAssignment
            expanded={expandedSections.personnel}
            onToggle={() => toggleSection('personnel')}
            personnelMode={personnel.personnelMode}
            onSetPersonnelMode={personnel.setPersonnelMode}
            personnelRoles={personnel.personnelRoles}
            onSetPersonnelRoles={personnel.setPersonnelRoles}
            convoyVehicles={personnel.convoyVehicles}
            unassignedPersonnel={personnel.unassignedPersonnel}
            totalDetailedPersonnel={personnel.totalDetailedPersonnel}
            personnelSearchQuery={personnel.personnelSearchQuery}
            personnelSearchResults={personnel.personnelSearchResults}
            personnelSearchLoading={personnel.personnelSearchLoading}
            assignTargetVehicleId={personnel.assignTargetVehicleId}
            showRoleSelector={personnel.showRoleSelector}
            onSetPersonnelSearchQuery={personnel.setPersonnelSearchQuery}
            onSetAssignTargetVehicleId={personnel.setAssignTargetVehicleId}
            onSetShowRoleSelector={personnel.setShowRoleSelector}
            onSetPersonnelSearchResults={personnel.setPersonnelSearchResults}
            onAssignPersonnel={personnel.handleAssignPersonnel}
            onRemoveAssignedPersonnel={personnel.handleRemoveAssignedPersonnel}
            onUpdateConvoyVehicle={personnel.handleUpdateConvoyVehicle}
          />

          <DetailsSection
            expanded={expandedSections.details}
            onToggle={() => toggleSection('details')}
            priority={priority}
            avgSpeed={avgSpeed}
            departureTime={departureTime}
            notes={notes}
            onSetPriority={setPriority}
            onSetAvgSpeed={setAvgSpeed}
            onSetDepartureTime={setDepartureTime}
            onSetNotes={setNotes}
          />
        </div>

        {/* Footer */}
        <div
          className="flex gap-2 py-3 px-4 border-t border-t-[var(--color-border)]"
        >
          <button
            onClick={handleClearAll}
            className="flex-1 py-2 px-3 font-[var(--font-mono)] text-[10px] font-bold tracking-[1px] text-[var(--color-text-muted)] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] cursor-pointer"
          >
            CLEAR ALL
          </button>
          <button
            onClick={handleSave}
            disabled={!routeName}
            className="flex-1 py-2 px-3 font-[var(--font-mono)] text-[10px] font-bold tracking-[1px] border border-[var(--color-border)] rounded-[var(--radius)]" style={{ color: !routeName ? 'var(--color-text-muted)' : '#fff', backgroundColor: !routeName ? 'var(--color-bg)' : 'var(--color-accent)', cursor: !routeName ? 'not-allowed' : 'pointer', opacity: !routeName ? 0.5 : 1 }}
          >
            SAVE MOVEMENT
          </button>
        </div>
      </div>
    </div>
  );
}
