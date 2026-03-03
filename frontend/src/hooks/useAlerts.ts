import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAlertStore } from '@/stores/alertStore';
import * as alertsApi from '@/api/alerts';
import { useDashboardStore } from '@/stores/dashboardStore';

export function useAlerts() {
  const { selectedUnitId } = useDashboardStore();
  const { alerts, unreadCount, acknowledgeAlert, setAlerts } = useAlertStore();

  const query = useQuery({
    queryKey: ['alerts', selectedUnitId],
    queryFn: () =>
      alertsApi.getAlerts({
        unitId: selectedUnitId ?? undefined,
      }),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (query.data) {
      setAlerts(query.data);
    }
  }, [query.data, setAlerts]);

  return {
    alerts,
    unreadCount,
    isLoading: query.isLoading,
    isError: query.isError,
    acknowledgeAlert,
    refetch: query.refetch,
  };
}
