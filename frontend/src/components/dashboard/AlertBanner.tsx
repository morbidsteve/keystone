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
    <div className="flex flex-col gap-1">
      {displayAlerts.map((alert) => {
        const color = getSeverityColor(alert.severity);
        return (
          <div
            key={alert.id}
            className="flex items-center gap-2.5 py-2 px-3 bg-[var(--color-bg-surface)] rounded-[var(--radius)]" style={{ border: '1px solid', borderColor: color, borderLeftWidth: 3, animation: alert.severity === 'CRITICAL' ? 'pulse 2s ease-in-out infinite' : undefined }}
          >
            <span style={{ color, flexShrink: 0 }}>{getSeverityIcon(alert.severity)}</span>
            <div className="flex-1 min-w-0">
              <div
                className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-bright)] font-semibold"
              >
                {alert.title}
              </div>
              <div
                className="text-[11px] text-[var(--color-text-muted)] mt-px whitespace-nowrap overflow-hidden text-ellipsis"
              >
                {alert.message}
              </div>
            </div>
            <div
              className="flex items-center gap-2 shrink-0"
            >
              <span
                className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] whitespace-nowrap"
              >
                {alert.unitName} / {formatRelativeTime(alert.createdAt)}
              </span>
              {onAcknowledge && !alert.acknowledged && (
                <button
                  onClick={() => onAcknowledge(alert.id)}
                  className="flex items-center gap-1 py-[3px] px-2 bg-transparent border border-[var(--color-border-strong)] rounded-[var(--radius)] text-[var(--color-text-muted)] font-[var(--font-mono)] text-[9px] cursor-pointer transition-all duration-[var(--transition)]"
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
