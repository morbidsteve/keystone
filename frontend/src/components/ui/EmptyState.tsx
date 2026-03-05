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
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        color: 'var(--color-text-muted)',
      }}
    >
      <div style={{ marginBottom: 12, opacity: 0.5 }}>
        {icon || <Inbox size={32} />}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      {message && (
        <div style={{ fontSize: 13, opacity: 0.7 }}>{message}</div>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            marginTop: 16,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            padding: '8px 16px',
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-bg)',
            border: 'none',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
