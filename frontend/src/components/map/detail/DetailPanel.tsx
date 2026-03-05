import { useEffect } from 'react';
import type React from 'react';
import { X } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';
import type { MapUnit, MapConvoy, MapSupplyPoint, MapRoute, MapAlert, ConvoyVehicleDetail } from '@/api/map';
import { UnitDetailPanel } from './UnitDetailPanel';
import { ConvoyDetailPanel } from './ConvoyDetailPanel';
import { SupplyPointDetailPanel } from './SupplyPointDetailPanel';
import { RouteDetailPanel } from './RouteDetailPanel';
import { AlertDetailPanel } from './AlertDetailPanel';

function getEntityTitle(entity: { type: string; data: unknown }): string {
  switch (entity.type) {
    case 'unit':
      return (entity.data as MapUnit).name;
    case 'convoy':
      return (entity.data as MapConvoy).name;
    case 'supplyPoint':
      return (entity.data as MapSupplyPoint).name;
    case 'route':
      return (entity.data as MapRoute).name;
    case 'alert':
      return (entity.data as MapAlert).alert_type.replace(/_/g, ' ');
    case 'convoy_vehicle': {
      const v = entity.data as ConvoyVehicleDetail & { convoyName?: string };
      return `${v.call_sign} — ${v.vehicle_type}`;
    }
    default:
      return 'Details';
  }
}

function getEntitySubtitle(entity: { type: string; data: unknown }): string | null {
  switch (entity.type) {
    case 'unit': {
      const unit = entity.data as MapUnit;
      return `${unit.abbreviation} | ${unit.echelon}`;
    }
    case 'convoy': {
      const convoy = entity.data as MapConvoy;
      return `${convoy.vehicle_count} vehicles`;
    }
    case 'supplyPoint': {
      const sp = entity.data as MapSupplyPoint;
      return sp.point_type.replace(/_/g, ' ');
    }
    case 'route': {
      const route = entity.data as MapRoute;
      return `${route.route_type} - ${route.status}`;
    }
    case 'alert': {
      const alert = entity.data as MapAlert;
      return alert.severity;
    }
    case 'convoy_vehicle': {
      const v = entity.data as ConvoyVehicleDetail & { convoyName?: string };
      return v.convoyName || v.bumper_number;
    }
    default:
      return null;
  }
}

export function DetailPanel() {
  const { selectedEntity, detailPanelOpen, clearSelection } = useMapStore();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearSelection();
    };
    if (detailPanelOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [detailPanelOpen, clearSelection]);

  if (!selectedEntity || !detailPanelOpen) return null;

  const renderContent = () => {
    switch (selectedEntity.type) {
      case 'unit':
        return <UnitDetailPanel data={selectedEntity.data as MapUnit} />;
      case 'convoy':
        return <ConvoyDetailPanel data={selectedEntity.data as MapConvoy} />;
      case 'supplyPoint':
        return <SupplyPointDetailPanel data={selectedEntity.data as MapSupplyPoint} />;
      case 'route':
        return <RouteDetailPanel data={selectedEntity.data as MapRoute} />;
      case 'alert':
        return <AlertDetailPanel data={selectedEntity.data as MapAlert} />;
      case 'convoy_vehicle':
        return <VehicleDetailContent data={selectedEntity.data as ConvoyVehicleDetail} />;
      default:
        return null;
    }
  };

  const title = getEntityTitle(selectedEntity);
  const subtitle = getEntitySubtitle(selectedEntity);

  return (
    <div style={panelStyles.container}>
      {/* Header */}
      <div style={panelStyles.header}>
        <div style={panelStyles.headerText}>
          <h2 style={panelStyles.title}>{title}</h2>
          {subtitle && <div style={panelStyles.subtitle}>{subtitle}</div>}
        </div>
        <button
          onClick={clearSelection}
          style={panelStyles.closeBtn}
          aria-label="Close detail panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Divider */}
      <div style={panelStyles.divider} />

      {/* Content */}
      <div style={panelStyles.content}>{renderContent()}</div>
    </div>
  );
}

function VehicleDetailContent({ data }: { data: ConvoyVehicleDetail }) {
  return (
    <div style={{ fontSize: 11, lineHeight: 1.6 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' as const }}>VEHICLE INFO</div>
        <div><span style={{ color: '#64748b' }}>BUMPER:</span> {data.bumper_number}</div>
        <div><span style={{ color: '#64748b' }}>TAMCN:</span> {data.tamcn}</div>
        <div><span style={{ color: '#64748b' }}>STATUS:</span> <span style={{ color: data.status === 'MOVING' ? '#22c55e' : data.status === 'STOPPED' ? '#eab308' : '#ef4444', fontWeight: 600 }}>{data.status}</span></div>
        <div><span style={{ color: '#64748b' }}>SPEED:</span> {data.speed_kph} KPH</div>
        <div><span style={{ color: '#64748b' }}>HEADING:</span> {data.heading}°</div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' as const }}>CREW ({data.crew.length})</div>
        {data.crew.map((p) => (
          <div key={p.personnel_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
            <span><span style={{ color: '#94a3b8' }}>{p.rank}</span> {p.name}</span>
            <span style={{ fontSize: 9, color: '#4dabf7' }}>{p.role}</span>
          </div>
        ))}
        {data.crew.length === 0 && <div style={{ color: '#64748b', fontStyle: 'italic' }}>None assigned</div>}
      </div>

      <div>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' as const }}>CARGO ({data.cargo.length})</div>
        {data.cargo.map((c) => (
          <div key={c.item_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
            <span>{c.item_name} <span style={{ color: '#64748b', fontSize: 9 }}>CL {c.supply_class}</span></span>
            <span style={{ color: '#4dabf7' }}>{c.quantity} {c.uom}</span>
          </div>
        ))}
        {data.cargo.length === 0 && <div style={{ color: '#64748b', fontStyle: 'italic' }}>No cargo</div>}
        {data.cargo.length > 0 && (
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)', fontWeight: 700, textAlign: 'right' as const }}>
            {data.cargo.reduce((s, c) => s + c.total_weight_kg, 0).toLocaleString()} kg total
          </div>
        )}
      </div>
    </div>
  );
}

const panelStyles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 400,
    height: '100%',
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    backdropFilter: 'blur(12px)',
    borderLeft: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    fontFamily: "'JetBrains Mono', monospace",
    color: '#e2e8f0',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.4)',
    animation: 'slideInRight 0.25s ease-out',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px 16px 12px 16px',
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontSize: 14,
    fontWeight: 700,
    color: '#e2e8f0',
    letterSpacing: '0.5px',
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1.3,
    wordBreak: 'break-word' as const,
  },
  subtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 3,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  },
  closeBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#94a3b8',
    cursor: 'pointer',
    flexShrink: 0,
    marginLeft: 8,
    transition: 'background-color 0.15s, color 0.15s',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginLeft: 16,
    marginRight: 16,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 16px 16px 16px',
  },
};
