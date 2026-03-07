import { AlertTriangle, AlertCircle, Info, Check } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatRelativeTime } from '@/lib/utils';
import { acknowledgeAlert } from '@/api/alerts';
import { useAlertStore } from '@/stores/alertStore';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
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
  const queryClient = useQueryClient();
  const toast = useToast();
  const markAcknowledged = useAlertStore((s) => s.markAcknowledged);
  const { hasPermission } = usePermission();
  const canAcknowledge = hasPermission('alerts:acknowledge');

  const ackMutation = useMutation({
    mutationFn: (id: string) => acknowledgeAlert(id),
    onSuccess: (_data, id) => {
      markAcknowledged(id);
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-summary'] });
      toast.success('Alert acknowledged');
    },
    onError: () => {
      toast.danger('Failed to acknowledge alert');
    },
  });

  const handleAcknowledge = (id: string) => {
    if (onAcknowledge) {
      onAcknowledge(id);
    }
    ackMutation.mutate(id);
  };

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
              {!alert.acknowledged && canAcknowledge && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleAcknowledge(alert.id); }}
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
