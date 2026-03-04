import { create } from 'zustand';
import type { NearbyResult } from '@/api/map';

export type EntityType = 'unit' | 'convoy' | 'supplyPoint' | 'route' | 'alert';

export type PlacementType = 'unit' | 'supply_point' | 'maintenance_site' | 'lz_farp';

interface SelectedEntity {
  type: EntityType;
  id: string;
  data: unknown;
}

interface ContextMenuState {
  visible: boolean;
  lat: number;
  lon: number;
  x: number;  // screen pixel position
  y: number;
}

interface MeasureState {
  active: boolean;
  startPoint: [number, number] | null;
  endPoint: [number, number] | null;
}

interface PlacementState {
  active: boolean;
  type: PlacementType | null;
  lat: number;
  lon: number;
}

interface RouteDrawingState {
  active: boolean;
  editingRouteId: string | null;
  waypoints: Array<{ lat: number; lon: number; label?: string }>;
  addingWaypoint: boolean;
  // Pre-populated metadata for editing
  editName?: string;
  editRouteType?: string;
  editStatus?: string;
  editDescription?: string;
}

interface MapState {
  // Detail panel
  selectedEntity: SelectedEntity | null;
  detailPanelOpen: boolean;
  selectEntity: (type: EntityType, id: string, data: unknown) => void;
  clearSelection: () => void;

  // Context menu
  contextMenu: ContextMenuState;
  showContextMenu: (lat: number, lon: number, x: number, y: number) => void;
  hideContextMenu: () => void;

  // Measurement mode
  measure: MeasureState;
  startMeasure: (lat: number, lon: number) => void;
  setMeasureEnd: (lat: number, lon: number) => void;
  clearMeasure: () => void;

  // Placement mode
  placement: PlacementState;
  startPlacement: (type: PlacementType, lat: number, lon: number) => void;
  clearPlacement: () => void;

  // Edit position mode
  editingPosition: boolean;
  setEditingPosition: (editing: boolean) => void;

  // Nearby results modal
  nearbyResult: { lat: number; lon: number; data: NearbyResult } | null;
  showNearby: (lat: number, lon: number, data: NearbyResult) => void;
  clearNearby: () => void;

  // Route drawing
  routeDrawing: RouteDrawingState;
  startRouteDrawing: (lat?: number, lon?: number) => void;
  editRoute: (routeId: string, waypoints: Array<{ lat: number; lon: number; label?: string }>, metadata?: { name?: string; routeType?: string; status?: string; description?: string }) => void;
  addRouteWaypoint: (lat: number, lon: number) => void;
  updateRouteWaypoint: (index: number, lat: number, lon: number) => void;
  removeRouteWaypoint: (index: number) => void;
  reorderRouteWaypoint: (fromIndex: number, toIndex: number) => void;
  setAddingWaypoint: (adding: boolean) => void;
  clearRouteDrawing: () => void;

  // Route import
  routeImportOpen: boolean;
  openRouteImport: () => void;
  closeRouteImport: () => void;

  // Cursor position (for coordinate display)
  cursorPosition: { lat: number; lon: number } | null;
  setCursorPosition: (pos: { lat: number; lon: number } | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  // Detail panel
  selectedEntity: null,
  detailPanelOpen: false,
  selectEntity: (type, id, data) => set({
    selectedEntity: { type, id, data },
    detailPanelOpen: true,
    contextMenu: { visible: false, lat: 0, lon: 0, x: 0, y: 0 },
  }),
  clearSelection: () => set({
    selectedEntity: null,
    detailPanelOpen: false,
    editingPosition: false,
  }),

  // Context menu
  contextMenu: { visible: false, lat: 0, lon: 0, x: 0, y: 0 },
  showContextMenu: (lat, lon, x, y) => set({
    contextMenu: { visible: true, lat, lon, x, y },
  }),
  hideContextMenu: () => set({
    contextMenu: { visible: false, lat: 0, lon: 0, x: 0, y: 0 },
  }),

  // Measurement
  measure: { active: false, startPoint: null, endPoint: null },
  startMeasure: (lat, lon) => set({
    measure: { active: true, startPoint: [lat, lon], endPoint: null },
    contextMenu: { visible: false, lat: 0, lon: 0, x: 0, y: 0 },
  }),
  setMeasureEnd: (lat, lon) => set((state) => ({
    measure: { ...state.measure, endPoint: [lat, lon] },
  })),
  clearMeasure: () => set({
    measure: { active: false, startPoint: null, endPoint: null },
  }),

  // Placement
  placement: { active: false, type: null, lat: 0, lon: 0 },
  startPlacement: (type, lat, lon) => set({
    placement: { active: true, type, lat, lon },
    contextMenu: { visible: false, lat: 0, lon: 0, x: 0, y: 0 },
  }),
  clearPlacement: () => set({
    placement: { active: false, type: null, lat: 0, lon: 0 },
  }),

  // Edit position
  editingPosition: false,
  setEditingPosition: (editing) => set({ editingPosition: editing }),

  // Nearby results
  nearbyResult: null,
  showNearby: (lat, lon, data) => set({ nearbyResult: { lat, lon, data } }),
  clearNearby: () => set({ nearbyResult: null }),

  // Route drawing
  routeDrawing: { active: false, editingRouteId: null, waypoints: [], addingWaypoint: false },
  startRouteDrawing: (lat, lon) => set({
    routeDrawing: {
      active: true,
      editingRouteId: null,
      waypoints: lat !== undefined && lon !== undefined ? [{ lat, lon }] : [],
      addingWaypoint: false,
      editName: undefined,
      editRouteType: undefined,
      editStatus: undefined,
      editDescription: undefined,
    },
    contextMenu: { visible: false, lat: 0, lon: 0, x: 0, y: 0 },
  }),
  editRoute: (routeId, waypoints, metadata) => set({
    routeDrawing: {
      active: true,
      editingRouteId: routeId,
      waypoints,
      addingWaypoint: false,
      editName: metadata?.name,
      editRouteType: metadata?.routeType,
      editStatus: metadata?.status,
      editDescription: metadata?.description,
    },
  }),
  addRouteWaypoint: (lat, lon) => set((state) => ({
    routeDrawing: {
      ...state.routeDrawing,
      waypoints: [...state.routeDrawing.waypoints, { lat, lon }],
      addingWaypoint: false,
    },
  })),
  updateRouteWaypoint: (index, lat, lon) => set((state) => {
    const wps = [...state.routeDrawing.waypoints];
    wps[index] = { ...wps[index], lat, lon };
    return { routeDrawing: { ...state.routeDrawing, waypoints: wps } };
  }),
  removeRouteWaypoint: (index) => set((state) => ({
    routeDrawing: {
      ...state.routeDrawing,
      waypoints: state.routeDrawing.waypoints.filter((_, i) => i !== index),
    },
  })),
  reorderRouteWaypoint: (fromIndex, toIndex) => set((state) => {
    const wps = [...state.routeDrawing.waypoints];
    const [moved] = wps.splice(fromIndex, 1);
    wps.splice(toIndex, 0, moved);
    return { routeDrawing: { ...state.routeDrawing, waypoints: wps } };
  }),
  setAddingWaypoint: (adding) => set((state) => ({
    routeDrawing: { ...state.routeDrawing, addingWaypoint: adding },
  })),
  clearRouteDrawing: () => set({
    routeDrawing: { active: false, editingRouteId: null, waypoints: [], addingWaypoint: false, editName: undefined, editRouteType: undefined, editStatus: undefined, editDescription: undefined },
  }),

  // Route import
  routeImportOpen: false,
  openRouteImport: () => set({ routeImportOpen: true, contextMenu: { visible: false, lat: 0, lon: 0, x: 0, y: 0 } }),
  closeRouteImport: () => set({ routeImportOpen: false }),

  // Cursor
  cursorPosition: null,
  setCursorPosition: (pos) => set({ cursorPosition: pos }),
}));
