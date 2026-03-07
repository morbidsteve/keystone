import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { useToastStore, type Toast } from '@/stores/toastStore';

const severityConfig: Record<Toast['severity'], { color: string; icon: typeof Info }> = {
  success: { color: 'var(--color-success)', icon: CheckCircle },
  info: { color: 'var(--color-info)', icon: Info },
  warning: { color: 'var(--color-warning)', icon: AlertTriangle },
  danger: { color: 'var(--color-danger)', icon: XCircle },
};

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-label="Notifications"
      className="fixed top-8 right-6 z-[9999] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => {
        const { color, icon: Icon } = severityConfig[toast.severity];
        return (
          <div
            key={toast.id}
            className="toast-item pointer-events-auto flex items-center gap-3 py-2.5 px-3.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] font-[var(--font-mono)] text-xs text-[var(--color-text-bright)] min-w-[280px] max-w-[420px] shadow-[0_4px_12px_rgba(0,0,0,0.3)] animate-[slideInRight_0.3s_ease_forwards]"
            style={{ borderLeftWidth: 4, borderLeftColor: color }}
          >
            <Icon size={16} style={{ color, flexShrink: 0 }} aria-hidden="true" />
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              className="flex items-center justify-center bg-transparent border-0 text-[var(--color-text-muted)] cursor-pointer p-0.5 shrink-0 rounded hover:text-[var(--color-text-bright)] hover:bg-[var(--color-bg-hover)] transition-colors duration-150"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
