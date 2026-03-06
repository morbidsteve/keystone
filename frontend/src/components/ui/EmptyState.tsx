import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-6 text-[var(--color-text-muted)]"
    >
      <div className="mb-3 opacity-50">
        {icon || <Inbox size={32} />}
      </div>
      <div
        className="font-[var(--font-mono)] text-xs font-semibold tracking-[1.5px] uppercase mb-1"
      >
        {title}
      </div>
      {message && (
        <div className="text-[13px] opacity-70">{message}</div>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] uppercase py-2 px-4 bg-[var(--color-accent)] text-[var(--color-bg)] border-0 rounded-[var(--radius)] cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
