import { useEffect, useRef, useState, useCallback } from 'react';
import { isDemoMode } from '@/api/mockClient';

// ---- Types ----

export interface WSEvent {
  type: string;
  [key: string]: unknown;
}

type EventCallback = (event: WSEvent) => void;

interface UseWebSocketReturn {
  isConnected: boolean;
  lastEvent: WSEvent | null;
  subscribe: (type: string, callback: EventCallback) => () => void;
}

// ---- Singleton connection manager ----

type Listener = { type: string; cb: EventCallback };

let ws: WebSocket | null = null;
let listeners: Listener[] = [];
let refCount = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = 1000;
const MAX_RECONNECT_DELAY = 30_000;
let connectedFlag = false;
let onStatusChange: (() => void)[] = [];

function notifyStatus() {
  onStatusChange.forEach((fn) => fn());
}

function dispatch(event: WSEvent) {
  for (const l of listeners) {
    if (l.type === '*' || l.type === event.type) {
      try {
        l.cb(event);
      } catch {
        // swallow listener errors
      }
    }
  }
}

function buildWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/api/v1/ws`;
}

function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  const url = buildWsUrl();
  ws = new WebSocket(url);

  ws.onopen = () => {
    connectedFlag = true;
    reconnectDelay = 1000;
    notifyStatus();
  };

  ws.onmessage = (evt) => {
    try {
      const data: WSEvent = JSON.parse(evt.data);
      dispatch(data);
    } catch {
      // ignore non-JSON frames
    }
  };

  ws.onclose = () => {
    connectedFlag = false;
    ws = null;
    notifyStatus();
    scheduleReconnect();
  };

  ws.onerror = () => {
    // onclose will fire after onerror, triggering reconnect
  };
}

function scheduleReconnect() {
  if (refCount <= 0) return;
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
  }, reconnectDelay);
}

function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    ws.onclose = null; // prevent reconnect on intentional close
    ws.close();
    ws = null;
  }
  connectedFlag = false;
  reconnectDelay = 1000;
  notifyStatus();
}

function addRef() {
  refCount++;
  if (refCount === 1 && !isDemoMode) {
    connect();
  }
}

function removeRef() {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0) {
    disconnect();
  }
}

// ---- Demo mode mock events ----

const DEMO_EVENT_TYPES = ['alert', 'convoy:position_update', 'supply:update', 'heartbeat'];

function randomDemoEvent(): WSEvent {
  const type = DEMO_EVENT_TYPES[Math.floor(Math.random() * DEMO_EVENT_TYPES.length)];
  if (type === 'alert') {
    return {
      type: 'alert',
      id: crypto.randomUUID(),
      severity: ['CRITICAL', 'WARNING', 'INFO'][Math.floor(Math.random() * 3)],
      title: 'Demo alert',
      message: 'This is a simulated alert event',
    };
  }
  if (type === 'convoy:position_update') {
    return {
      type: 'convoy:position_update',
      movementId: `MOV-${Math.floor(Math.random() * 1000)}`,
      vehicles: [
        {
          vehicle_id: `V-${Math.floor(Math.random() * 100)}`,
          lat: 33.5 + Math.random() * 0.5,
          lon: -117.5 + Math.random() * 0.5,
          heading: Math.floor(Math.random() * 360),
          speed_kph: Math.floor(Math.random() * 80),
          status: 'MOVING',
        },
      ],
    };
  }
  return { type };
}

// ---- React hook ----

export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(isDemoMode ? true : connectedFlag);
  const [lastEvent, setLastEvent] = useState<WSEvent | null>(null);
  const listenersRef = useRef<Listener[]>([]);
  const demoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track connection status
  useEffect(() => {
    if (isDemoMode) {
      setIsConnected(true);
      // Start demo event generator
      demoTimerRef.current = setInterval(() => {
        const evt = randomDemoEvent();
        setLastEvent(evt);
        dispatch(evt);
      }, 5000);
      return () => {
        if (demoTimerRef.current) clearInterval(demoTimerRef.current);
      };
    }

    const handler = () => setIsConnected(connectedFlag);
    onStatusChange.push(handler);
    addRef();

    return () => {
      onStatusChange = onStatusChange.filter((fn) => fn !== handler);
      // Remove all listeners registered by this hook instance
      for (const l of listenersRef.current) {
        listeners = listeners.filter((x) => x !== l);
      }
      listenersRef.current = [];
      removeRef();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const subscribe = useCallback((type: string, callback: EventCallback): (() => void) => {
    const listener: Listener = { type, cb: callback };
    listeners.push(listener);
    listenersRef.current.push(listener);
    return () => {
      listeners = listeners.filter((x) => x !== listener);
      listenersRef.current = listenersRef.current.filter((x) => x !== listener);
    };
  }, []);

  return { isConnected, lastEvent, subscribe };
}
