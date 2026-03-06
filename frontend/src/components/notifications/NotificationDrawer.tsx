import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertTriangle, AlertCircle, Info, CheckCheck } from 'lucide-react';
import { useAlertStore } from '@/stores/alertStore';
import { AlertSeverity, type Alert } from '@/lib/types';

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
}

function severityIcon(severity: AlertSeverity) {
  switch (severity) {
    case AlertSeverity.CRITICAL:
      return <AlertTriangle size={16} className="text-[#f87171] flex-shrink-0" />;
    case AlertSeverity.WARNING:
      return <AlertCircle size={16} className="text-[#fbbf24] flex-shrink-0" />;
    case AlertSeverity.INFO:
    default:
      return <Info size={16} className="text-[#60a5fa] flex-shrink-0" />;
  }
}

function severityBorder(severity: AlertSeverity): string {
  switch (severity) {
    case AlertSeverity.CRITICAL: return 'rgba(248, 113, 113, 0.3)';
    case AlertSeverity.WARNING: return 'rgba(251, 191, 36, 0.3)';
    default: return 'rgba(96, 165, 250, 0.15)';
  }
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'JUST NOW';
    if (diffMin < 60) return `${diffMin}M AGO`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}H AGO`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}D AGO`;
  } catch {
    return '';
  }
}

export default function NotificationDrawer({ open, onClose }: NotificationDrawerProps) {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const alerts = useAlertStore((s) => s.alerts);
  const acknowledgeAlert = useAlertStore((s) => s.acknowledgeAlert);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleMarkAllRead = () => {
    alerts.filter((a) => !a.acknowledged).forEach((a) => acknowledgeAlert(a.id));
  };

  const handleNotificationClick = (alert: Alert) => {
    onClose();
    navigate('/alerts');
  };

  if (!open) return null;

  const unread = alerts.filter((a) => !a.acknowledged);
  const displayAlerts = unread.length > 0 ? unread : alerts.slice(0, 20);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1200] bg-[rgba(0,0,0,0.3)]"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full z-[1201] flex flex-col bg-[var(--color-bg-surface)] border-l border-l-[var(--color-border)]"
        style={{
          width: 380,
          maxWidth: '100vw',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
          animation: 'slideInRight 200ms ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between py-3 px-4 border-b border-b-[var(--color-border)]">
          <span className="font-[var(--font-mono)] text-[11px] font-bold tracking-[2px] text-[var(--color-text-bright)] uppercase">
            NOTIFICATIONS
          </span>
          <div className="flex items-center gap-2">
            {unread.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 py-1 px-2 font-[var(--font-mono)] text-[9px] font-semibold tracking-[1px] text-[var(--color-accent)] bg-transparent border border-[var(--color-accent)] rounded-[var(--radius)] cursor-pointer"
                style={{ transition: 'all var(--transition)' }}
              >
                <CheckCheck size={12} />
                MARK ALL READ
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-transparent border-none cursor-pointer text-[var(--color-text-muted)] p-1"
              aria-label="Close notifications"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto py-2 px-3">
          {displayAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Info size={32} className="text-[var(--color-text-muted)] mb-2 opacity-40" />
              <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]">
                NO NOTIFICATIONS
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {displayAlerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => handleNotificationClick(alert)}
                  className="w-full text-left p-3 rounded-[var(--radius)] cursor-pointer bg-[var(--color-bg-elevated)] border"
                  style={{
                    borderColor: severityBorder(alert.severity),
                    transition: 'background-color var(--transition)',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)')
                  }
                >
                  <div className="flex items-start gap-2.5">
                    {severityIcon(alert.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-[var(--font-mono)] text-[11px] font-semibold text-[var(--color-text-bright)] truncate">
                          {alert.title}
                        </span>
                        <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] whitespace-nowrap flex-shrink-0">
                          {formatTimestamp(alert.createdAt)}
                        </span>
                      </div>
                      <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] leading-[1.4] line-clamp-2">
                        {alert.message}
                      </div>
                      <div className="mt-1.5 font-[var(--font-mono)] text-[9px] tracking-[1px] text-[var(--color-text-muted)] uppercase">
                        {alert.unitName}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="py-2.5 px-4 border-t border-t-[var(--color-border)]">
          <button
            onClick={() => {
              onClose();
              navigate('/alerts');
            }}
            className="w-full py-2 font-[var(--font-mono)] text-[10px] font-semibold tracking-[1.5px] text-[var(--color-accent)] bg-transparent border border-[var(--color-border)] rounded-[var(--radius)] cursor-pointer"
            style={{ transition: 'all var(--transition)' }}
          >
            VIEW ALL ALERTS
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
