import { useMemo } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { useAlerts } from '@/hooks/useAlerts';
import SupplyStatusCard from './SupplyStatusCard';
import ReadinessGauge from './ReadinessGauge';
import SustainabilityTimeline from './SustainabilityTimeline';
import ConsumptionChart from './ConsumptionChart';
import AlertBanner from './AlertBanner';
import Card from '@/components/ui/Card';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import StatusDot from '@/components/ui/StatusDot';
import {
  SupplyClass,
  SupplyStatus,
  AlertSeverity,
  type SupplyClassSummary,
  type Alert,
} from '@/lib/types';
import { SUPPLY_CLASS_SHORT } from '@/lib/constants';
import { getStatusColor, formatNumber } from '@/lib/utils';

// Demo data for standalone mode
const demoSupplyData: SupplyClassSummary[] = [
  { supplyClass: SupplyClass.I, name: 'Subsistence', percentage: 85, dos: 8, status: SupplyStatus.GREEN, trend: 'STABLE', onHand: 8500, authorized: 10000 },
  { supplyClass: SupplyClass.III, name: 'POL', percentage: 62, dos: 4, status: SupplyStatus.AMBER, trend: 'DOWN', onHand: 6200, authorized: 10000 },
  { supplyClass: SupplyClass.V, name: 'Ammunition', percentage: 45, dos: 2, status: SupplyStatus.RED, trend: 'DOWN', onHand: 4500, authorized: 10000 },
  { supplyClass: SupplyClass.VIII, name: 'Medical', percentage: 92, dos: 14, status: SupplyStatus.GREEN, trend: 'UP', onHand: 9200, authorized: 10000 },
  { supplyClass: SupplyClass.IX, name: 'Repair Parts', percentage: 71, dos: 5, status: SupplyStatus.AMBER, trend: 'STABLE', onHand: 7100, authorized: 10000 },
  { supplyClass: SupplyClass.II, name: 'Clothing & Equip', percentage: 88, dos: 10, status: SupplyStatus.GREEN, trend: 'UP', onHand: 8800, authorized: 10000 },
];

const demoAlerts: Alert[] = [
  { id: '1', type: 'SUPPLY_CRITICAL' as never, severity: AlertSeverity.CRITICAL, unitId: '1-1', unitName: '1/1 BN', title: 'CL V CRITICAL', message: 'Ammunition below 50% - 2 DOS remaining', acknowledged: false, createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: '2', type: 'SUPPLY_LOW' as never, severity: AlertSeverity.WARNING, unitId: '2-1', unitName: '2/1 BN', title: 'CL III LOW', message: 'POL at 62% authorized level - consumption rate increasing', acknowledged: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', type: 'EQUIPMENT_DOWN' as never, severity: AlertSeverity.WARNING, unitId: '1-1', unitName: '1/1 BN', title: 'AAV READINESS DROP', message: '3x AAV NMC - parts on order, ETA 48hrs', acknowledged: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
];

export default function CommanderView() {
  const { summary, supplyOverview, readiness, sustainability, isLoading } = useDashboard();
  const { alerts, acknowledgeAlert } = useAlerts();

  const supplyData = supplyOverview || demoSupplyData;
  const displayAlerts = alerts.length > 0 ? alerts : demoAlerts;

  // Derive readiness data from API or use summary-based data
  const readinessData = useMemo(() => {
    if (readiness?.byType && readiness.byType.length > 0) {
      return readiness.byType.map((r) => ({
        type: r.type,
        percent: r.readinessPercent,
      }));
    }
    return [];
  }, [readiness]);

  // Compute status tiles from API data when available
  const statusTiles = useMemo(() => {
    const supplyPct = supplyOverview
      ? Math.round(supplyOverview.reduce((s, c) => s + c.percentage, 0) / supplyOverview.length)
      : 74;
    const supplyGreenCount = supplyOverview
      ? supplyOverview.filter((c) => c.status === SupplyStatus.GREEN).length
      : 6;
    const supplyTotal = supplyOverview ? supplyOverview.length : 10;

    const maintenancePct = readiness?.overall ?? 84;
    const maintenanceStatus = maintenancePct >= 90 ? SupplyStatus.GREEN : maintenancePct >= 75 ? SupplyStatus.AMBER : SupplyStatus.RED;

    const movementCount = summary?.activeMovements ?? 3;

    return [
      { label: 'SUPPLY', status: supplyPct >= 80 ? SupplyStatus.GREEN : supplyPct >= 60 ? SupplyStatus.AMBER : SupplyStatus.RED, value: supplyPct, detail: `${supplyGreenCount}/${supplyTotal} classes green` },
      { label: 'MAINTENANCE', status: maintenanceStatus, value: Math.round(maintenancePct), detail: readiness ? `${readiness.byType.reduce((s, r) => s + r.missionCapable, 0)}/${readiness.byType.reduce((s, r) => s + r.authorized, 0)} MC` : '312/371 MC' },
      { label: 'TRANSPORTATION', status: SupplyStatus.GREEN, value: 91, detail: `${movementCount} active convoys` },
      { label: 'ENGINEERING', status: SupplyStatus.GREEN, value: 95, detail: 'All projects on track' },
      { label: 'HEALTH SVCS', status: SupplyStatus.GREEN, value: 92, detail: 'CL VIII adequate' },
      { label: 'SERVICES', status: SupplyStatus.AMBER, value: 78, detail: '2 facilities degraded' },
    ];
  }, [supplyOverview, readiness, summary]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="grid-responsive-6col">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Row: Status Tiles */}
      <div className="grid-responsive-6col">
        {statusTiles.map((tile) => {
          const color = getStatusColor(tile.status);
          return (
            <div
              key={tile.label}
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderTop: `2px solid ${color}`,
                borderRadius: 'var(--radius)',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'background-color var(--transition)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)')
              }
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <span className="section-header">{tile.label}</span>
                <StatusDot status={tile.status} pulse={tile.status === SupplyStatus.RED} />
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 32,
                  fontWeight: 700,
                  color: color,
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                {tile.value}%
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.5px',
                }}
              >
                {tile.detail}
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Row: Supply Cards + Readiness */}
      <div className="grid-responsive-2fr1fr">
        {/* Supply Status Cards */}
        <Card title="SUPPLY CLASS STATUS">
          <div className="grid-responsive-3col" style={{ gap: 10 }}>
            {supplyData.map((s) => (
              <SupplyStatusCard key={s.supplyClass} data={s} />
            ))}
          </div>
        </Card>

        {/* Equipment Readiness */}
        <Card title="EQUIPMENT READINESS">
          <div
            className="grid-responsive-3col"
            style={{
              justifyItems: 'center',
            }}
          >
            {readinessData.map((eq) => (
              <ReadinessGauge key={eq.type} percent={eq.percent} label={eq.type} size={72} />
            ))}
          </div>
        </Card>
      </div>

      {/* Sustainability + Consumption */}
      <div className="grid-responsive-2col">
        <SustainabilityTimeline data={sustainability ?? undefined} />
        <ConsumptionChart />
      </div>

      {/* Active Alerts */}
      <Card title="ACTIVE ALERTS" accentColor="var(--color-warning)">
        <AlertBanner
          alerts={displayAlerts}
          onAcknowledge={acknowledgeAlert}
        />
      </Card>
    </div>
  );
}
