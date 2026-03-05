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
      style={{
        flex: '1 1 0',
        minWidth: 160,
        padding: 16,
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          color: 'var(--color-text-muted)',
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 24,
            fontWeight: 700,
            color: valueColor,
          }}
        >
          {value}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--color-text-muted)',
          }}
        >
          {unit}
        </span>
      </div>
      {barValue != null && barMax != null && (
        <div
          style={{
            width: '100%',
            height: 4,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min((barValue / barMax) * 100, 100)}%`,
              height: '100%',
              backgroundColor: barColor,
              borderRadius: 2,
              transition: 'width 0.3s ease',
            }}
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
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="skeleton"
            style={{
              flex: '1 1 0',
              minWidth: 160,
              height: 100,
              borderRadius: 'var(--radius)',
            }}
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
      style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      {cards.map((card) => (
        <KPICard key={card.label} {...card} />
      ))}
    </div>
  );
}
