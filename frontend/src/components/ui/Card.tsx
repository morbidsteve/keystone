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
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        borderTop: accentColor ? `2px solid ${accentColor}` : undefined,
        overflow: 'hidden',
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--color-text-muted)',
            }}
          >
            {title}
          </span>
          {headerRight}
        </div>
      )}
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}
