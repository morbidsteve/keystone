import { create } from 'zustand';

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

  // Cursor
  cursorPosition: null,
  setCursorPosition: (pos) => set({ cursorPosition: pos }),
}));
