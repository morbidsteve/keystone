import { useState } from 'react';

interface LayerState {
  units: boolean;
  supplyOverlay: boolean;
  convoys: boolean;
  convoyRoutes: boolean;
  convoyVehicles: boolean;
  supplyPoints: boolean;
  routes: boolean;
  alerts: boolean;
}

interface MapControlsProps {
  layers: LayerState;
  onToggleLayer: (layer: string) => void;
  baseMap: 'osm' | 'satellite' | 'topo';
  onChangeBaseMap: (base: 'osm' | 'satellite' | 'topo') => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const layerConfig: { key: keyof LayerState; label: string; icon: string }[] = [
  { key: 'units', label: 'UNITS', icon: '\u2316' },
  { key: 'supplyOverlay', label: 'SUPPLY STATUS', icon: '\u25A3' },
  { key: 'convoys', label: 'CONVOYS', icon: '\u25B6' },
  { key: 'convoyRoutes', label: 'CONVOY ROUTES', icon: '\u2500' },
  { key: 'convoyVehicles', label: 'VEHICLE ICONS', icon: '\u2618' },
  { key: 'supplyPoints', label: 'SUPPLY POINTS', icon: '\u25C6' },
  { key: 'routes', label: 'MSR / ASR', icon: '\u2550' },
  { key: 'alerts', label: 'ALERTS', icon: '\u26A0' },
];

const baseMapOptions: { value: 'osm' | 'satellite' | 'topo'; label: string }[] = [
  { value: 'osm', label: 'OSM' },
  { value: 'satellite', label: 'SATELLITE' },
  { value: 'topo', label: 'TOPO' },
];

export default function MapControls({
  layers,
  onToggleLayer,
  baseMap,
  onChangeBaseMap,
  collapsed,
  onToggleCollapsed,
}: MapControlsProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <div
      className="absolute top-2.5 left-2.5 z-[1000] bg-[rgba(17,17,17,0.92)] border border-[var(--color-border)] rounded-[var(--radius)] font-[var(--font-mono)]" style={{ minWidth: collapsed ? 40 : 200, backdropFilter: 'blur(8px)', boxShadow: '0 4px 16px rgba(0,0,0,0.5)', transition: 'min-width 0.2s ease' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer" style={{ padding: collapsed ? '8px' : '8px 12px', borderBottom: collapsed ? 'none' : '1px solid var(--color-border)' }}
        onClick={onToggleCollapsed}
      >
        {!collapsed && (
          <span
            className="text-[10px] font-bold tracking-[2px] text-[var(--color-text-bright)] uppercase"
          >
            LAYERS
          </span>
        )}
        <span
          className="text-sm text-[var(--color-text-muted)] flex items-center justify-center w-[20px] h-[20px]" style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s ease' }}
        >
          {collapsed ? '\u2630' : '\u00AB'}
        </span>
      </div>

      {!collapsed && (
        <>
          {/* Layer toggles */}
          <div className="py-1.5 px-0">
            {layerConfig.map((layer) => (
              <label
                key={layer.key}
                className="flex items-center gap-2 py-1.5 px-3 cursor-pointer text-[10px] tracking-[1px]" style={{ color: layers[layer.key]
                    ? 'var(--color-text-bright)'
                    : 'var(--color-text-muted)', backgroundColor: hoveredItem === layer.key
                      ? 'rgba(255,255,255,0.05)'
                      : 'transparent', transition: 'all 0.15s ease' }}
                onMouseEnter={() => setHoveredItem(layer.key)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <input
                  type="checkbox"
                  checked={layers[layer.key]}
                  onChange={() => onToggleLayer(layer.key)}
                  className="w-[14px] h-[14px] cursor-pointer m-0 accent-[var(--color-accent)]"
                />
                <span
                  className="text-xs w-[16px] text-center"
                >
                  {layer.icon}
                </span>
                <span>{layer.label}</span>
              </label>
            ))}
          </div>

          {/* Base map selector */}
          <div
            className="border-t border-t-[var(--color-border)] py-2 px-3"
          >
            <div
              className="text-[10px] font-bold tracking-[2px] text-[var(--color-text-bright)] mb-1.5 uppercase"
            >
              BASE MAP
            </div>
            <div className="flex flex-col gap-1">
              {baseMapOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer text-[10px] tracking-[1px] py-[3px] px-0" style={{ color: baseMap === option.value
                        ? 'var(--color-accent)'
                        : 'var(--color-text-muted)' }}
                >
                  <input
                    type="radio"
                    name="baseMap"
                    checked={baseMap === option.value}
                    onChange={() => onChangeBaseMap(option.value)}
                    className="cursor-pointer m-0 accent-[var(--color-accent)]"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
