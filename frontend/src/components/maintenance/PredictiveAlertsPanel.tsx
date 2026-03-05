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
    return <div className="skeleton" style={{ width: '100%', height: 300 }} />;
  }

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--color-text-muted)',
        }}
      >
        No predictive alerts at this time
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.map((rec: PMRecommendation, idx: number) => {
        const badge = getPriorityBadge(rec.priority);
        return (
          <div
            key={idx}
            style={{
              padding: '12px 16px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {/* Header row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius)',
                    backgroundColor: badge.bg,
                    color: badge.color,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  {badge.label}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--color-text-bright)',
                    letterSpacing: '0.5px',
                  }}
                >
                  {rec.equipment_type}
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: rec.days_until_failure <= 10 ? 'var(--color-danger)' : 'var(--color-warning)',
                  fontWeight: 600,
                }}
              >
                {rec.days_until_failure}D TO FAILURE
              </span>
            </div>

            {/* Recommendation */}
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-text-bright)',
              }}
            >
              {rec.recommendation}
            </div>

            {/* Reason */}
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-text-muted)',
              }}
            >
              {rec.reason}
            </div>
          </div>
        );
      })}
    </div>
  );
}
