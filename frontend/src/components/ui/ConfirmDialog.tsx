import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  danger: {
    border: 'var(--color-danger)',
    bg: 'rgba(255, 107, 107, 0.15)',
    text: 'var(--color-danger)',
  },
  warning: {
    border: 'var(--color-warning)',
    bg: 'rgba(245, 158, 11, 0.15)',
    text: 'var(--color-warning)',
  },
  default: {
    border: 'var(--color-accent)',
    bg: 'rgba(77, 171, 247, 0.15)',
    text: 'var(--color-accent)',
  },
};

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const colors = VARIANT_COLORS[variant] || VARIANT_COLORS.default;

  return (
    <div
      className="fixed inset-0 z-[4000] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="w-full max-w-[400px] bg-[var(--color-bg-elevated)] border border-[var(--color-border-strong)] rounded-[var(--radius)] overflow-hidden"
        style={{ boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)' }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2.5 py-3 px-4 border-b border-b-[var(--color-border)]"
        >
          {variant !== 'default' && (
            <AlertTriangle size={14} style={{ color: colors.text }} />
          )}
          <span
            className="font-[var(--font-mono)] text-[11px] font-bold tracking-[2px] uppercase"
            style={{ color: colors.text }}
          >
            {title}
          </span>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="font-[var(--font-mono)] text-xs text-[var(--color-text)] m-0 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end py-3 px-4 border-t border-t-[var(--color-border)]">
          <button
            onClick={onCancel}
            className="py-1.5 px-4 border border-[var(--color-border)] rounded-[var(--radius)] bg-transparent text-[var(--color-text-muted)] font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-1.5 py-1.5 px-4 rounded-[var(--radius)] font-[var(--font-mono)] text-[10px] font-bold tracking-[1px] cursor-pointer"
            style={{
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.bg,
              color: colors.text,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
