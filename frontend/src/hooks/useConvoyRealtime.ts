import { useEffect, useRef } from 'react';

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
 * Stub hook for future Socket.IO-based real-time convoy position updates.
 * Currently a no-op; will be wired to Socket.IO when backend support is ready.
 */
export function useConvoyRealtime(options: UseConvoyRealtimeOptions = {}) {
  const { enabled = false, onPositionUpdate } = options;
  const callbackRef = useRef(onPositionUpdate);
  callbackRef.current = onPositionUpdate;

  useEffect(() => {
    if (!enabled) return;
    // TODO: Initialize Socket.IO connection
    // const socket = io(window.location.origin, { path: '/socket.io/' });
    // socket.on('convoy:position_update', (data) => callbackRef.current?.(data));
    // return () => { socket.disconnect(); };
  }, [enabled]);

  return { isConnected: false };
}
