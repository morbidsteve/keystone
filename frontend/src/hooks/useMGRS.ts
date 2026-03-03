import { useCallback } from 'react';
import { latLonToMGRS, mgrsToLatLon, isValidMGRS } from '@/utils/coordinates';

export function useMGRS() {
  const toMGRS = useCallback((lat: number, lon: number) => {
    try {
      return latLonToMGRS(lat, lon);
    } catch {
      return null;
    }
  }, []);

  const fromMGRS = useCallback((mgrsStr: string) => {
    try {
      return mgrsToLatLon(mgrsStr);
    } catch {
      return null;
    }
  }, []);

  return { toMGRS, fromMGRS, isValidMGRS };
}
