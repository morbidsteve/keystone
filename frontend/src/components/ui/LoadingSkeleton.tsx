interface LoadingSkeletonProps {
  width?: string | number;
  height?: string | number;
  count?: number;
  style?: React.CSSProperties;
}

export default function LoadingSkeleton({
  width = '100%',
  height = 16,
  count = 1,
  style,
}: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            width,
            height,
            marginBottom: i < count - 1 ? 8 : 0,
            ...style,
          }}
        />
      ))}
    </>
  );
}

export function CardSkeleton() {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: 16,
      }}
    >
      <LoadingSkeleton width={120} height={10} style={{ marginBottom: 12 }} />
      <LoadingSkeleton width={80} height={28} style={{ marginBottom: 8 }} />
      <LoadingSkeleton width="100%" height={6} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          gap: 16,
        }}
      >
        {[80, 100, 60, 60, 60, 80].map((w, i) => (
          <LoadingSkeleton key={i} width={w} height={10} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            gap: 16,
          }}
        >
          {[80, 100, 60, 60, 60, 80].map((w, j) => (
            <LoadingSkeleton key={j} width={w} height={12} />
          ))}
        </div>
      ))}
    </div>
  );
}

// --- Variant-based skeleton component ---

interface SkeletonProps {
  variant?: 'card' | 'table' | 'text' | 'chart' | 'kpi-row';
  count?: number;
}

function TextSkeleton() {
  return (
    <div>
      <div className="skeleton" style={{ width: '100%', height: 14, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: '80%', height: 14, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: '60%', height: 14 }} />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div
      className="skeleton"
      style={{
        width: '100%',
        height: 200,
        borderRadius: 'var(--radius)',
      }}
    />
  );
}

function KpiRowSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

function CardVariantSkeleton() {
  return (
    <div
      className="skeleton"
      style={{
        width: '100%',
        height: 120,
        borderRadius: 'var(--radius)',
      }}
    />
  );
}

export function Skeleton({ variant = 'text', count = 1 }: SkeletonProps) {
  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, i) => {
        const key = i;
        switch (variant) {
          case 'card':
            return <CardVariantSkeleton key={key} />;
          case 'table':
            return <TableSkeleton key={key} />;
          case 'text':
            return <TextSkeleton key={key} />;
          case 'chart':
            return <ChartSkeleton key={key} />;
          case 'kpi-row':
            return <KpiRowSkeleton key={key} />;
          default:
            return <TextSkeleton key={key} />;
        }
      })}
    </>
  );
}
