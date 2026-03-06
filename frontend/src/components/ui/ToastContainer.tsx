import { X } from 'lucide-react';
import { useToastStore } from '@/stores/toastStore';

const severityColors: Record<string, string> = {
  success: 'var(--color-success)',
  info: 'var(--color-info)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
};

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Notifications"
      className="fixed top-8 right-6 z-[9999] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-3 py-2.5 px-3.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] font-[var(--font-mono)] text-xs text-[var(--color-text-bright)] min-w-[280px] max-w-[420px]" style={{ pointerEvents: 'auto', borderLeft: `4px solid ${severityColors[toast.severity]}`, animation: 'slideInRight 0.3s ease forwards' }}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss notification"
            className="flex items-center justify-center bg-transparent border-0 text-[var(--color-text-muted)] cursor-pointer p-0.5 shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
