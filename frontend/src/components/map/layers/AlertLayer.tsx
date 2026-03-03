import { CircleMarker, Popup } from 'react-leaflet';
import type { MapAlert } from '@/api/map';

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
          >
            <Popup
              maxWidth={260}
              minWidth={200}
              closeButton={true}
              className="keystone-popup"
            >
              <div
                style={{
                  minWidth: 200,
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: 'var(--color-bg-elevated)',
                  color: 'var(--color-text)',
                  padding: 12,
                  borderRadius: 'var(--radius)',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 16,
                      color: color,
                    }}
                  >
                    {getAlertIcon(alert.severity)}
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: color,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {alert.severity}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: 'var(--color-text-muted)',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {alert.alert_type.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--color-text-bright)',
                    lineHeight: 1.4,
                    padding: '6px 0',
                    borderTop: '1px solid var(--color-border)',
                  }}
                >
                  {alert.message}
                </div>

                {/* Unit */}
                {alert.unit_name && (
                  <div
                    style={{
                      fontSize: 9,
                      color: 'var(--color-text-muted)',
                      marginTop: 4,
                    }}
                  >
                    UNIT:{' '}
                    <span
                      style={{
                        color: 'var(--color-text-bright)',
                        fontWeight: 600,
                      }}
                    >
                      {alert.unit_name}
                    </span>
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
