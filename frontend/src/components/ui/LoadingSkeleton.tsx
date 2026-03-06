interface LoadingSkeletonProps {
  width?: string | number;
  height?: string | number;
  count?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function LoadingSkeleton({
  width = '100%',
  height = 16,
  count = 1,
  style,
  className,
}: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton ${className || ''}`}
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
      className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] p-4"
    >
      <LoadingSkeleton width={120} height={10} className="mb-3" />
      <LoadingSkeleton width={80} height={28} className="mb-2" />
      <LoadingSkeleton width="100%" height={6} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden"
    >
      {/* Header */}
      <div
        className="py-3 px-4 border-b border-b-[var(--color-border)] flex gap-4"
      >
        {[80, 100, 60, 60, 60, 80].map((w, i) => (
          <LoadingSkeleton key={i} width={w} height={10} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="py-3 px-4 border-b border-b-[var(--color-border)] flex gap-4"
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
      <div className="skeleton w-full h-[14px] mb-2"  />
      <div className="skeleton w-[80%] h-[14px] mb-2"  />
      <div className="skeleton w-[60%] h-[14px]"  />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div
      className="skeleton w-full h-[200px] rounded-[var(--radius)]"
      
    />
  );
}

function KpiRowSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

function CardVariantSkeleton() {
  return (
    <div
      className="skeleton w-full h-[120px] rounded-[var(--radius)]"
      
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
