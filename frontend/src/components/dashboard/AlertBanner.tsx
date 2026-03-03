import { AlertTriangle, AlertCircle, Info, Check } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import type { Alert, AlertSeverity } from '@/lib/types';

interface AlertBannerProps {
  alerts: Alert[];
  onAcknowledge?: (id: string) => void;
  maxItems?: number;
}

function getSeverityIcon(severity: AlertSeverity | string) {
  switch (severity) {
    case 'CRITICAL':
      return <AlertCircle size={14} />;
    case 'WARNING':
      return <AlertTriangle size={14} />;
    default:
      return <Info size={14} />;
  }
}

function getSeverityColor(severity: AlertSeverity | string) {
  switch (severity) {
    case 'CRITICAL':
      return 'var(--color-danger)';
    case 'WARNING':
      return 'var(--color-warning)';
    default:
      return 'var(--color-info)';
  }
}

export default function AlertBanner({ alerts, onAcknowledge, maxItems = 5 }: AlertBannerProps) {
  const displayAlerts = alerts.slice(0, maxItems);

  if (displayAlerts.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {displayAlerts.map((alert) => {
        const color = getSeverityColor(alert.severity);
        return (
          <div
            key={alert.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid',
              borderColor: color,
              borderRadius: 'var(--radius)',
              borderLeftWidth: 3,
              animation: alert.severity === 'CRITICAL' ? 'pulse 2s ease-in-out infinite' : undefined,
            }}
          >
            <span style={{ color, flexShrink: 0 }}>{getSeverityIcon(alert.severity)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-text-bright)',
                  fontWeight: 600,
                }}
              >
                {alert.title}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                  marginTop: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {alert.message}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {alert.unitName} / {formatRelativeTime(alert.createdAt)}
              </span>
              {onAcknowledge && !alert.acknowledged && (
                <button
                  onClick={() => onAcknowledge(alert.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--color-border-strong)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--color-text-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    cursor: 'pointer',
                    transition: 'all var(--transition)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-accent)';
                    e.currentTarget.style.color = 'var(--color-accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                    e.currentTarget.style.color = 'var(--color-text-muted)';
                  }}
                >
                  <Check size={10} />
                  ACK
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
