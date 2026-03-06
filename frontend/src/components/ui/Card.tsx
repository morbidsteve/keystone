import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  accentColor?: string;
  style?: React.CSSProperties;
  headerRight?: ReactNode;
}

export default function Card({ children, title, accentColor, style, headerRight }: CardProps) {
  return (
    <div
      className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden" style={{ borderTop: accentColor ? `2px solid ${accentColor}` : undefined }}
    >
      {title && (
        <div
          className="py-3 px-4 border-b border-b-[var(--color-border)] flex items-center justify-between"
        >
          <span
            className="font-[var(--font-mono)] text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)]"
          >
            {title}
          </span>
          {headerRight}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
