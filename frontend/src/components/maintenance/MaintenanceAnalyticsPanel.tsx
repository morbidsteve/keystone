import type { MaintenanceAnalytics } from '@/lib/types';

interface MaintenanceAnalyticsPanelProps {
  analytics: MaintenanceAnalytics | undefined;
}

interface KPICardConfig {
  label: string;
  value: string;
  unit: string;
  barValue?: number;
  barMax?: number;
  threshold?: number;
  invertThreshold?: boolean; // true = red when ABOVE threshold
  dangerColor: boolean;
}

function KPICard({ label, value, unit, barValue, barMax, threshold, invertThreshold, dangerColor }: KPICardConfig) {
  const isAboveThreshold = threshold != null && barValue != null && (
    invertThreshold ? barValue > threshold : barValue < threshold
  );
  const barColor = isAboveThreshold ? 'var(--color-danger)' : dangerColor ? 'var(--color-danger)' : 'var(--color-success)';
  const valueColor = isAboveThreshold ? 'var(--color-danger)' : 'var(--color-text-bright)';

  return (
    <div
      className="min-w-[160px] p-4 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius)] flex flex-col gap-2 flex-1"
    >
      <span
        className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)]"
      >
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span
          className="font-[var(--font-mono)] text-2xl font-bold" style={{ color: valueColor }}
        >
          {value}
        </span>
        <span
          className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]"
        >
          {unit}
        </span>
      </div>
      {barValue != null && barMax != null && (
        <div
          className="w-full h-[4px] bg-[rgba(255,255,255,0.06)] rounded-[2px] overflow-hidden"
        >
          <div
            className="h-full rounded-[2px]" style={{ width: `${Math.min((barValue / barMax) * 100, 100)}%`, backgroundColor: barColor, transition: 'width 0.3s ease' }}
          />
        </div>
      )}
    </div>
  );
}

export default function MaintenanceAnalyticsPanel({ analytics }: MaintenanceAnalyticsPanelProps) {
  if (!analytics) {
    return (
      <div
        className="flex gap-3 flex-wrap"
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="skeleton min-w-[160px] h-[100px] rounded-[var(--radius)] flex-1"
          />
        ))}
      </div>
    );
  }

  const cards: KPICardConfig[] = [
    {
      label: 'Deadline Rate',
      value: analytics.deadlineRate.toFixed(1),
      unit: '%',
      barValue: analytics.deadlineRate,
      barMax: 100,
      threshold: 15,
      invertThreshold: true,
      dangerColor: analytics.deadlineRate > 15,
    },
    {
      label: 'Mean Time to Repair',
      value: analytics.mttr.toFixed(1),
      unit: 'hrs',
      dangerColor: false,
    },
    {
      label: 'Parts Fill Rate',
      value: analytics.partsFillRate.toFixed(1),
      unit: '%',
      barValue: analytics.partsFillRate,
      barMax: 100,
      threshold: 90,
      invertThreshold: false,
      dangerColor: analytics.partsFillRate < 90,
    },
    {
      label: 'Cannibalization Rate',
      value: analytics.cannibalizationRate.toFixed(1),
      unit: '%',
      barValue: analytics.cannibalizationRate,
      barMax: 100,
      threshold: 10,
      invertThreshold: true,
      dangerColor: analytics.cannibalizationRate > 10,
    },
  ];

  return (
    <div
      className="flex gap-3 flex-wrap"
    >
      {cards.map((card) => (
        <KPICard key={card.label} {...card} />
      ))}
    </div>
  );
}
