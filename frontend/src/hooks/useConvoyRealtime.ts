import { useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface ConvoyPositionUpdate {
  movementId: string;
  vehicles: Array<{
    vehicle_id: string;
    lat: number;
    lon: number;
    heading: number;
    speed_kph: number;
    status: string;
  }>;
}

interface UseConvoyRealtimeOptions {
  enabled?: boolean;
  onPositionUpdate?: (update: ConvoyPositionUpdate) => void;
}

/**
 * Real-time convoy position updates via the WebSocket event bus.
 * Subscribes to "convoy:position_update" events and forwards them to the callback.
 */
export function useConvoyRealtime(options: UseConvoyRealtimeOptions = {}) {
  const { enabled = false, onPositionUpdate } = options;
  const callbackRef = useRef(onPositionUpdate);
  callbackRef.current = onPositionUpdate;

  const { isConnected, subscribe } = useWebSocket();

  useEffect(() => {
    if (!enabled) return;
    const unsub = subscribe('convoy:position_update', (event) => {
      callbackRef.current?.(event as unknown as ConvoyPositionUpdate);
    });
    return unsub;
  }, [enabled, subscribe]);

  return { isConnected: enabled && isConnected };
}
