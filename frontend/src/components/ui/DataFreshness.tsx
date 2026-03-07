import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

interface DataFreshnessProps {
  lastUpdated: Date | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

function formatAge(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function getDotColor(ms: number): string {
  if (ms < 60_000) return '#22c55e';       // green: < 1 min
  if (ms < 300_000) return '#f59e0b';      // yellow: 1-5 min
  return '#ef4444';                          // red: > 5 min
}

function getFreshnessLabel(ms: number): string {
  if (ms < 60_000) return 'FRESH';
  if (ms < 300_000) return 'STALE';
  return 'OLD';
}

export default function DataFreshness({ lastUpdated, isRefreshing, onRefresh }: DataFreshnessProps) {
  const [age, setAge] = useState<number>(0);

  const computeAge = useCallback(() => {
    if (!lastUpdated) return 0;
    return Date.now() - lastUpdated.getTime();
  }, [lastUpdated]);

  useEffect(() => {
    setAge(computeAge());
    const interval = setInterval(() => {
      setAge(computeAge());
    }, 5_000);
    return () => clearInterval(interval);
  }, [computeAge]);

  if (!lastUpdated) return null;

  const dotColor = getDotColor(age);

  return (
    <div className="flex items-center gap-1.5">
      {/* Freshness dot + label for colorblind accessibility */}
      <span
        className="inline-block w-[6px] h-[6px] rounded-full shrink-0"
        style={{ backgroundColor: dotColor }}
        aria-hidden="true"
      />
      <span className="font-[var(--font-mono)] text-[7px] font-bold tracking-[0.5px] uppercase" style={{ color: dotColor }}>
        {getFreshnessLabel(age)}
      </span>

      {/* Label */}
      <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[0.5px] whitespace-nowrap">
        Updated {formatAge(age)}
      </span>

      {/* Refresh button */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`flex items-center justify-center bg-transparent border-0 text-[var(--color-text-muted)] p-0.5 ${
            isRefreshing ? 'opacity-50 cursor-not-allowed' : 'opacity-70 cursor-pointer'
          }`}
          title="Refresh data"
          aria-label="Refresh data"
        >
          <RefreshCw
            size={10}
            className={isRefreshing ? 'animate-spin' : ''}
          />
        </button>
      )}
    </div>
  );
}
