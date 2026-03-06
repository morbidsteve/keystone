// =============================================================================
// PredictiveAlertsPanel — List of PM recommendations with priority badges
// =============================================================================

import { useQuery } from '@tanstack/react-query';
import { getPMRecommendations } from '@/api/maintenanceAnalytics';
import type { PMRecommendation } from '@/api/maintenanceAnalytics';

interface PredictiveAlertsPanelProps {
  unitId: number;
}

function getPriorityBadge(priority: number): { label: string; bg: string; color: string } {
  if (priority === 1) {
    return {
      label: 'CRITICAL',
      bg: 'rgba(239, 68, 68, 0.15)',
      color: 'var(--color-danger)',
    };
  }
  return {
    label: 'WARNING',
    bg: 'rgba(245, 158, 11, 0.15)',
    color: 'var(--color-warning)',
  };
}

export default function PredictiveAlertsPanel({ unitId }: PredictiveAlertsPanelProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['pm-recommendations', unitId],
    queryFn: () => getPMRecommendations(unitId),
  });

  if (isLoading) {
    return <div className="skeleton w-full h-[300px]"  />;
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="h-[200px] flex items-center justify-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
      >
        No predictive alerts at this time
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((rec: PMRecommendation, idx: number) => {
        const badge = getPriorityBadge(rec.priority);
        return (
          <div
            key={idx}
            className="py-3 px-4 border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-bg-surface)] flex flex-col gap-2"
          >
            {/* Header row */}
            <div
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="inline-block py-0.5 px-2 rounded-[var(--radius)] font-[var(--font-mono)] text-[9px] font-bold tracking-[1px] uppercase" style={{ backgroundColor: badge.bg, color: badge.color }}
                >
                  {badge.label}
                </span>
                <span
                  className="font-[var(--font-mono)] text-xs font-semibold text-[var(--color-text-bright)] tracking-[0.5px]"
                >
                  {rec.equipment_type}
                </span>
              </div>
              <span
                className="font-[var(--font-mono)] text-[10px] font-semibold" style={{ color: rec.days_until_failure <= 10 ? 'var(--color-danger)' : 'var(--color-warning)' }}
              >
                {rec.days_until_failure}D TO FAILURE
              </span>
            </div>

            {/* Recommendation */}
            <div
              className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-bright)]"
            >
              {rec.recommendation}
            </div>

            {/* Reason */}
            <div
              className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]"
            >
              {rec.reason}
            </div>
          </div>
        );
      })}
    </div>
  );
}
