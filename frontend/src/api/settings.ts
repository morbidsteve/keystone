import apiClient from './client';
import { isDemoMode } from './mockClient';

export interface ClassificationSetting {
  level: string;
  banner_text: string;
  color: string;
}

export async function getClassification(): Promise<ClassificationSetting> {
  if (isDemoMode) return { level: 'UNCLASSIFIED', banner_text: 'UNCLASSIFIED', color: 'green' };
  const { data } = await apiClient.get('/settings/classification');
  return data;
}

export async function updateClassification(setting: ClassificationSetting): Promise<ClassificationSetting> {
  if (isDemoMode) return setting;
  const { data } = await apiClient.put('/settings/classification', setting);
  return data;
}

// ---------------------------------------------------------------------------
// Tile Layer Settings
// ---------------------------------------------------------------------------

export interface TileLayerConfig {
  name: string;
  label: string;
  url_template: string;
  attribution: string;
  max_zoom: number;
  enabled: boolean;
  order: number;
}

const DEFAULT_TILE_LAYERS: TileLayerConfig[] = [
  { name: 'osm', label: 'OpenStreetMap', url_template: '/tiles/osm/{z}/{x}/{y}.png', attribution: 'OpenStreetMap', max_zoom: 19, enabled: true, order: 0 },
  { name: 'satellite', label: 'Satellite', url_template: '/tiles/satellite/{z}/{y}/{x}', attribution: 'Esri', max_zoom: 18, enabled: true, order: 1 },
  { name: 'topo', label: 'Topographic', url_template: '/tiles/topo/{z}/{x}/{y}.png', attribution: 'OpenTopoMap', max_zoom: 17, enabled: true, order: 2 },
];

export async function getTileLayers(): Promise<TileLayerConfig[]> {
  if (isDemoMode) return [...DEFAULT_TILE_LAYERS];
  try {
    const { data } = await apiClient.get('/settings/tile-layers');
    return data.layers || DEFAULT_TILE_LAYERS;
  } catch {
    return [...DEFAULT_TILE_LAYERS];
  }
}

export async function updateTileLayers(layers: TileLayerConfig[]): Promise<TileLayerConfig[]> {
  if (isDemoMode) return layers;
  const { data } = await apiClient.put('/settings/tile-layers', { layers });
  return data.layers;
}
