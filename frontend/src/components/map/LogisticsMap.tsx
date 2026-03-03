import { useState, useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapData } from '@/api/map';
import MapControls from './MapControls';
import MapLegend from './MapLegend';
import UnitLayer from './layers/UnitLayer';
import ConvoyLayer from './layers/ConvoyLayer';
import SupplyPointLayer from './layers/SupplyPointLayer';
import RouteLayer from './layers/RouteLayer';
import AlertLayer from './layers/AlertLayer';

interface LayerState {
  units: boolean;
  supplyOverlay: boolean;
  convoys: boolean;
  convoyRoutes: boolean;
  supplyPoints: boolean;
  routes: boolean;
  alerts: boolean;
}

interface LogisticsMapProps {
  data: MapData;
  height?: string;
}

const CAMP_PENDLETON_CENTER: [number, number] = [33.3152, -117.3125];
const DEFAULT_ZOOM = 11;

// DEPLOYMENT NOTE: These tile URLs are DEVELOPMENT DEFAULTS pointing to public third-party servers.
// For classified or air-gapped deployments, these MUST be replaced with on-premise tile servers.
// Set the following environment variables to override:
//   VITE_TILE_SERVER_URL      — OpenStreetMap-style base map tiles
//   VITE_TILE_SERVER_SAT_URL  — Satellite imagery tiles
//   VITE_TILE_SERVER_TOPO_URL — Topographic map tiles
const TILE_URLS: Record<string, string> = {
  osm: import.meta.env.VITE_TILE_SERVER_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite:
    import.meta.env.VITE_TILE_SERVER_SAT_URL ||
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  topo:
    import.meta.env.VITE_TILE_SERVER_TOPO_URL ||
    'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
};

const TILE_ATTRIBUTIONS: Record<string, string> = {
  osm: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  satellite: '&copy; <a href="https://www.esri.com/">Esri</a>',
  topo: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
};

export default function LogisticsMap({ data, height = '100%' }: LogisticsMapProps) {
  const [layers, setLayers] = useState<LayerState>({
    units: true,
    supplyOverlay: true,
    convoys: true,
    convoyRoutes: true,
    supplyPoints: true,
    routes: true,
    alerts: true,
  });

  const [baseMap, setBaseMap] = useState<'osm' | 'satellite' | 'topo'>('osm');
  const [controlsCollapsed, setControlsCollapsed] = useState(false);

  const tileUrl = useMemo(() => TILE_URLS[baseMap], [baseMap]);
  const tileAttribution = useMemo(() => TILE_ATTRIBUTIONS[baseMap], [baseMap]);

  const handleToggleLayer = (layer: string) => {
    setLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer as keyof LayerState],
    }));
  };

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      {/* Map */}
      <MapContainer
        center={CAMP_PENDLETON_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          key={baseMap}
          url={tileUrl}
          attribution={tileAttribution}
          maxZoom={19}
        />

        {layers.routes && <RouteLayer routes={data.routes} />}

        {layers.convoys && (
          <ConvoyLayer convoys={data.convoys} showRoutes={layers.convoyRoutes} />
        )}

        {layers.supplyPoints && (
          <SupplyPointLayer supplyPoints={data.supplyPoints} />
        )}

        {layers.units && (
          <UnitLayer units={data.units} showSupplyOverlay={layers.supplyOverlay} />
        )}

        {layers.alerts && <AlertLayer alerts={data.alerts} />}
      </MapContainer>

      {/* Controls overlay */}
      <MapControls
        layers={layers}
        onToggleLayer={handleToggleLayer}
        baseMap={baseMap}
        onChangeBaseMap={setBaseMap}
        collapsed={controlsCollapsed}
        onToggleCollapsed={() => setControlsCollapsed(!controlsCollapsed)}
      />

      {/* Legend overlay */}
      <MapLegend layers={layers} />

      {/* Alert pulse animation + popup styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .alert-pulse {
          animation: alert-pulse-ring 2s ease-in-out infinite;
        }
        @keyframes alert-pulse-ring {
          0% { stroke-opacity: 1; fill-opacity: 0.4; }
          50% { stroke-opacity: 0.4; fill-opacity: 0.15; }
          100% { stroke-opacity: 1; fill-opacity: 0.4; }
        }
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
          font-size: 16px !important;
          padding: 4px 8px !important;
        }
        .keystone-popup .leaflet-popup-close-button:hover {
          color: var(--color-text-bright) !important;
        }
      `}</style>
    </div>
  );
}
