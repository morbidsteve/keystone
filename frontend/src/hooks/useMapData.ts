import { useQuery } from '@tanstack/react-query';
import * as mapApi from '@/api/map';

export function useMapData() {
  const mapQuery = useQuery({
    queryKey: ['map', 'data'],
    queryFn: () => mapApi.getMapData(),
    refetchInterval: 30_000,
  });

  const convoyDetailQuery = useQuery({
    queryKey: ['map', 'convoys', 'active'],
    queryFn: () => mapApi.getActiveConvoyMovements(),
    refetchInterval: 15_000,
  });

  return {
    units: mapQuery.data?.units ?? [],
    convoys: mapQuery.data?.convoys ?? [],
    convoyMovements: convoyDetailQuery.data ?? [],
    supplyPoints: mapQuery.data?.supplyPoints ?? [],
    routes: mapQuery.data?.routes ?? [],
    alerts: mapQuery.data?.alerts ?? [],
    isLoading: mapQuery.isLoading,
    isError: mapQuery.isError,
    refetch: () => {
      mapQuery.refetch();
      convoyDetailQuery.refetch();
    },
  };
}
