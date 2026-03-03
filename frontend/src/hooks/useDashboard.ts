import { useQuery } from '@tanstack/react-query';
import { useDashboardStore } from '@/stores/dashboardStore';
import * as dashboardApi from '@/api/dashboard';

export function useDashboard() {
  const { selectedUnitId, timeRange } = useDashboardStore();

  const summaryQuery = useQuery({
    queryKey: ['dashboard', 'summary', selectedUnitId, timeRange],
    queryFn: () => dashboardApi.getDashboardSummary(selectedUnitId ?? undefined, timeRange),
    refetchInterval: 60_000,
  });

  const supplyQuery = useQuery({
    queryKey: ['dashboard', 'supply', selectedUnitId, timeRange],
    queryFn: () => dashboardApi.getSupplyOverview(selectedUnitId ?? undefined, timeRange),
    refetchInterval: 60_000,
  });

  const readinessQuery = useQuery({
    queryKey: ['dashboard', 'readiness', selectedUnitId, timeRange],
    queryFn: () => dashboardApi.getReadinessOverview(selectedUnitId ?? undefined, timeRange),
    refetchInterval: 60_000,
  });

  const sustainabilityQuery = useQuery({
    queryKey: ['dashboard', 'sustainability', selectedUnitId, timeRange],
    queryFn: () => dashboardApi.getSustainability(selectedUnitId ?? undefined, timeRange),
    refetchInterval: 60_000,
  });

  const alertsQuery = useQuery({
    queryKey: ['dashboard', 'alerts', selectedUnitId, timeRange],
    queryFn: () => dashboardApi.getAlerts(selectedUnitId ?? undefined, timeRange),
    refetchInterval: 30_000,
  });

  return {
    summary: summaryQuery.data,
    supplyOverview: supplyQuery.data,
    readiness: readinessQuery.data,
    sustainability: sustainabilityQuery.data,
    alerts: alertsQuery.data,
    isLoading:
      summaryQuery.isLoading ||
      supplyQuery.isLoading ||
      readinessQuery.isLoading,
    isError:
      summaryQuery.isError ||
      supplyQuery.isError ||
      readinessQuery.isError,
    selectedUnitId,
    timeRange,
  };
}
