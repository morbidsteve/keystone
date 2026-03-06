import ReadinessTable from '@/components/equipment/ReadinessTable';
import MaintenanceQueue from '@/components/equipment/MaintenanceQueue';
import ReadinessTrend from '@/components/equipment/ReadinessTrend';

export default function EquipmentPage() {
  return (
    <div className="animate-fade-in flex flex-col gap-4">
      {/* Readiness Table */}
      <div className="responsive-table-wrapper">
        <ReadinessTable />
      </div>

      {/* Bottom Row: Maintenance + Trend */}
      <div className="grid-responsive-2col">
        <MaintenanceQueue />
        <ReadinessTrend />
      </div>
    </div>
  );
}
