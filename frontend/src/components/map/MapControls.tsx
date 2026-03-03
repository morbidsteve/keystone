import { useState } from 'react';

interface LayerState {
  units: boolean;
  supplyOverlay: boolean;
  convoys: boolean;
  convoyRoutes: boolean;
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
      style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 1000,
        backgroundColor: 'rgba(17, 17, 17, 0.92)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        fontFamily: 'var(--font-mono)',
        minWidth: collapsed ? 40 : 200,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        transition: 'min-width 0.2s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: collapsed ? '8px' : '8px 12px',
          borderBottom: collapsed ? 'none' : '1px solid var(--color-border)',
          cursor: 'pointer',
        }}
        onClick={onToggleCollapsed}
      >
        {!collapsed && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '2px',
              color: 'var(--color-text-bright)',
              textTransform: 'uppercase',
            }}
          >
            LAYERS
          </span>
        )}
        <span
          style={{
            fontSize: 14,
            color: 'var(--color-text-muted)',
            transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 20,
            height: 20,
          }}
        >
          {collapsed ? '\u2630' : '\u00AB'}
        </span>
      </div>

      {!collapsed && (
        <>
          {/* Layer toggles */}
          <div style={{ padding: '6px 0' }}>
            {layerConfig.map((layer) => (
              <label
                key={layer.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: 10,
                  letterSpacing: '1px',
                  color: layers[layer.key]
                    ? 'var(--color-text-bright)'
                    : 'var(--color-text-muted)',
                  backgroundColor:
                    hoveredItem === layer.key
                      ? 'rgba(255,255,255,0.05)'
                      : 'transparent',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={() => setHoveredItem(layer.key)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <input
                  type="checkbox"
                  checked={layers[layer.key]}
                  onChange={() => onToggleLayer(layer.key)}
                  style={{
                    width: 14,
                    height: 14,
                    accentColor: 'var(--color-accent)',
                    cursor: 'pointer',
                    margin: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    width: 16,
                    textAlign: 'center',
                  }}
                >
                  {layer.icon}
                </span>
                <span>{layer.label}</span>
              </label>
            ))}
          </div>

          {/* Base map selector */}
          <div
            style={{
              borderTop: '1px solid var(--color-border)',
              padding: '8px 12px',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '2px',
                color: 'var(--color-text-bright)',
                marginBottom: 6,
                textTransform: 'uppercase',
              }}
            >
              BASE MAP
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {baseMapOptions.map((option) => (
                <label
                  key={option.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    fontSize: 10,
                    letterSpacing: '1px',
                    color:
                      baseMap === option.value
                        ? 'var(--color-accent)'
                        : 'var(--color-text-muted)',
                    padding: '3px 0',
                  }}
                >
                  <input
                    type="radio"
                    name="baseMap"
                    checked={baseMap === option.value}
                    onChange={() => onChangeBaseMap(option.value)}
                    style={{
                      accentColor: 'var(--color-accent)',
                      cursor: 'pointer',
                      margin: 0,
                    }}
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
