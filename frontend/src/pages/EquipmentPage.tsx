import ReadinessTable from '@/components/equipment/ReadinessTable';
import MaintenanceQueue from '@/components/equipment/MaintenanceQueue';
import ReadinessTrend from '@/components/equipment/ReadinessTrend';

export default function EquipmentPage() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Readiness Table */}
      <ReadinessTable />

      {/* Bottom Row: Maintenance + Trend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <MaintenanceQueue />
        <ReadinessTrend />
      </div>
    </div>
  );
}
