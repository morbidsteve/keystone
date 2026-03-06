import { CircleMarker, Tooltip } from 'react-leaflet';
import type { MapAlert } from '@/api/map';
import { useMapStore } from '@/stores/mapStore';

interface AlertLayerProps {
  alerts: MapAlert[];
}

function getAlertColor(severity: string): string {
  switch (severity) {
    case 'CRITICAL':
      return '#ff6b6b';
    case 'WARNING':
      return '#fab005';
    case 'INFO':
      return '#4dabf7';
    default:
      return '#868e96';
  }
}

function getAlertIcon(severity: string): string {
  switch (severity) {
    case 'CRITICAL':
      return '\u2716';
    case 'WARNING':
      return '\u26A0';
    case 'INFO':
      return '\u2139';
    default:
      return '\u25CF';
  }
}

export default function AlertLayer({ alerts }: AlertLayerProps) {
  const selectEntity = useMapStore((s) => s.selectEntity);

  return (
    <>
      {alerts.map((alert) => {
        const color = getAlertColor(alert.severity);
        const isCritical = alert.severity === 'CRITICAL';

        return (
          <CircleMarker
            key={alert.id}
            center={[alert.latitude, alert.longitude]}
            radius={isCritical ? 12 : 8}
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: isCritical ? 0.4 : 0.3,
              weight: 2,
              className: isCritical ? 'alert-pulse' : undefined,
            }}
            eventHandlers={{
              click: () => selectEntity('alert', alert.id, alert),
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
              <div
                className="font-[var(--font-mono)] text-[9px] font-bold text-[#111] py-0.5 px-1"
              >
                {getAlertIcon(alert.severity)} {alert.severity} - {alert.alert_type.replace(/_/g, ' ')}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
