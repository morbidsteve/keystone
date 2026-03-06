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

interface MapLegendProps {
  layers: LayerState;
}

function LegendSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1.5">
      <div
        className="text-[8px] font-bold tracking-[1.5px] text-[var(--color-text-bright)] mb-[3px] uppercase"
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function LegendDot({
  color,
  label,
  letter,
}: {
  color: string;
  label: string;
  letter?: string;
}) {
  return (
    <div
      className="flex items-center gap-2 py-0.5 px-0"
    >
      <div
        className="w-[16px] h-[16px] flex items-center justify-center text-[9px] font-bold text-[#fff] font-[var(--font-mono)]" style={{ backgroundColor: color, borderRadius: letter ? 3 : '50%' }}
      >
        {letter}
      </div>
      <span
        className="text-[9px] text-[var(--color-text-muted)] tracking-[0.5px]"
      >
        {label}
      </span>
    </div>
  );
}

function LegendLine({
  color,
  label,
  dashed,
  weight,
}: {
  color: string;
  label: string;
  dashed?: boolean;
  weight?: number;
}) {
  return (
    <div
      className="flex items-center gap-2 py-0.5 px-0"
    >
      <div
        className="w-[20px] rounded-[1px]" style={{ height: weight || 3, borderStyle: dashed ? 'dashed' : 'solid', borderWidth: dashed ? 1 : 0, borderColor: color, backgroundColor: dashed ? 'transparent' : color }}
      />
      <span
        className="text-[9px] text-[var(--color-text-muted)] tracking-[0.5px]"
      >
        {label}
      </span>
    </div>
  );
}

export default function MapLegend({ layers }: MapLegendProps) {
  const [collapsed, setCollapsed] = useState(false);

  const hasActiveLayer =
    layers.units ||
    layers.supplyOverlay ||
    layers.convoys ||
    layers.convoyVehicles ||
    layers.supplyPoints ||
    layers.routes ||
    layers.alerts;

  if (!hasActiveLayer) return null;

  return (
    <div
      className="absolute bottom-5 right-2.5 z-[1000] bg-[rgba(17,17,17,0.92)] border border-[var(--color-border)] rounded-[var(--radius)] font-[var(--font-mono)]" style={{ backdropFilter: 'blur(8px)', boxShadow: '0 4px 16px rgba(0,0,0,0.5)', minWidth: collapsed ? 40 : 160, transition: 'min-width 0.2s ease' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer" style={{ padding: collapsed ? '6px 8px' : '6px 10px', borderBottom: collapsed ? 'none' : '1px solid var(--color-border)' }}
        onClick={() => setCollapsed(!collapsed)}
      >
        {!collapsed && (
          <span
            className="text-[9px] font-bold tracking-[2px] text-[var(--color-text-bright)] uppercase"
          >
            LEGEND
          </span>
        )}
        <span
          className="text-xs text-[var(--color-text-muted)] flex items-center justify-center w-[16px] h-[16px]"
        >
          {collapsed ? '\u25B2' : '\u25BC'}
        </span>
      </div>

      {!collapsed && (
        <div style={{ padding: '6px 10px 8px' }}>
          {/* Unit affiliation / status colors */}
          {(layers.units || layers.supplyOverlay) && (
            <LegendSection title="UNIT AFFILIATION">
              <LegendDot color="#4dabf7" label="Friendly (Blue)" />
              <LegendDot color="#ff6b6b" label="Hostile (Red)" />
              <LegendDot color="#40c057" label="Neutral (Green)" />
              <LegendDot color="#fab005" label="Unknown (Yellow)" />
            </LegendSection>
          )}

          {/* Supply status overlay */}
          {layers.supplyOverlay && (
            <LegendSection title="SUPPLY STATUS">
              <LegendDot color="#40c057" label="GREEN (>90%)" />
              <LegendDot color="#fab005" label="AMBER (75-90%)" />
              <LegendDot color="#ff6b6b" label="RED (<75%)" />
            </LegendSection>
          )}

          {/* Supply point icons */}
          {layers.supplyPoints && (
            <LegendSection title="SUPPLY POINTS">
              <LegendDot color="#40c057" label="LOG BASE" letter="L" />
              <LegendDot color="#40c057" label="AMMO SP" letter="A" />
              <LegendDot color="#40c057" label="FARP" letter="F" />
              <LegendDot color="#fab005" label="LZ (PLANNED)" letter="H" />
              <LegendDot color="#40c057" label="WATER PT" letter="W" />
            </LegendSection>
          )}

          {/* Route types */}
          {layers.routes && (
            <LegendSection title="ROUTES">
              <LegendLine color="#40c057" label="MSR (OPEN)" weight={4} />
              <LegendLine color="#40c057" label="ASR (OPEN)" weight={3} />
              <LegendLine color="#fab005" label="RESTRICTED" dashed />
              <LegendLine color="#ff6b6b" label="CLOSED" dashed />
            </LegendSection>
          )}

          {/* Convoy routes */}
          {layers.convoys && (
            <LegendSection title="CONVOYS">
              <LegendDot color="#40c057" label="EN ROUTE" />
              <LegendDot color="#fab005" label="DELAYED" />
              <LegendDot color="#868e96" label="PLANNED" />
            </LegendSection>
          )}

          {/* Vehicle status */}
          {layers.convoyVehicles && (
            <LegendSection title="VEHICLE STATUS">
              <LegendDot color="#22c55e" label="MOVING / FMC" />
              <LegendDot color="#eab308" label="STOPPED" />
              <LegendDot color="#ef4444" label="NMC / BREAKDOWN" />
            </LegendSection>
          )}

          {/* Alerts */}
          {layers.alerts && (
            <LegendSection title="ALERTS">
              <LegendDot color="#ff6b6b" label="CRITICAL" />
              <LegendDot color="#fab005" label="WARNING" />
              <LegendDot color="#4dabf7" label="INFO" />
            </LegendSection>
          )}
        </div>
      )}
    </div>
  );
}
