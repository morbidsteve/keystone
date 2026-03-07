import { useQuery } from '@tanstack/react-query';
import ReadinessTable from '@/components/equipment/ReadinessTable';
import MaintenanceQueue from '@/components/equipment/MaintenanceQueue';
import ReadinessTrend from '@/components/equipment/ReadinessTrend';
import DataFreshness from '@/components/ui/DataFreshness';
import { useDashboardStore } from '@/stores/dashboardStore';
import { getEquipmentRecords } from '@/api/equipment';

export default function EquipmentPage() {
  const selectedUnitId = useDashboardStore((s) => s.selectedUnitId);

  const { dataUpdatedAt, isRefetching, refetch } = useQuery({
    queryKey: ['equipment', 'readiness-table', selectedUnitId],
    queryFn: () => getEquipmentRecords({ unitId: selectedUnitId ?? undefined }),
  });

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      {/* Header with freshness */}
      <div className="flex items-center justify-end">
        <DataFreshness
          lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : null}
          isRefreshing={isRefetching}
          onRefresh={() => refetch()}
        />
      </div>

      {/* Readiness Table */}
      <div className="responsive-table-wrapper">
        <ReadinessTable />
      </div>

      {/* Bottom Row: Maintenance + Trend */}
      <div className="grid-responsive-2col">
        <div className="max-h-[500px] overflow-y-auto">
          <MaintenanceQueue />
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          <ReadinessTrend />
        </div>
      </div>
    </div>
  );
}
