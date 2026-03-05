// =============================================================================
// QualificationMatrix — Qualification currency + P-Rating display
// =============================================================================

import type { QualStatusData, PersonnelReadinessData } from '@/lib/types';

interface QualificationMatrixProps {
  quals: Record<string, QualStatusData>;
  readiness: PersonnelReadinessData;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function qualColor(pct: number): string {
  if (pct >= 90) return '#4ade80';
  if (pct >= 75) return '#fbbf24';
  return '#f87171';
}

function pRatingColor(rating: string): string {
  switch (rating) {
    case 'P1': return '#4ade80';
    case 'P2': return '#60a5fa';
    case 'P3': return '#fbbf24';
    case 'P4': return '#fb923c';
    case 'P5': return '#f87171';
    default: return '#94a3b8';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function QualificationMatrix({ quals, readiness }: QualificationMatrixProps) {
  const qualEntries = Object.entries(quals);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* P-Rating badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '16px 20px',
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: `3px solid ${pRatingColor(readiness.p_rating)}`,
            backgroundColor: `${pRatingColor(readiness.p_rating)}15`,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 18,
              fontWeight: 700,
              color: pRatingColor(readiness.p_rating),
            }}
          >
            {readiness.p_rating}
          </span>
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--color-text-bright)',
              marginBottom: 6,
            }}
          >
            PERSONNEL READINESS: {readiness.percent_ready.toFixed(1)}%
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-text-muted)',
              lineHeight: 1.6,
            }}
          >
            Fill Rate (50%): {readiness.fill_rate_pct.toFixed(1)}% | Qualifications (30%): {readiness.qualification_pct.toFixed(1)}% | Fitness (20%): {readiness.fitness_pct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Qualification progress bars */}
      <div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '1.5px',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          QUALIFICATION CURRENCY
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {qualEntries.map(([name, data]) => {
            const color = qualColor(data.percent);
            return (
              <div key={name}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--color-text-bright)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {name}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      color,
                    }}
                  >
                    {data.current}/{data.total} ({data.percent.toFixed(1)}%)
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 8,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(data.percent, 100)}%`,
                      height: '100%',
                      backgroundColor: color,
                      borderRadius: 4,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown weights */}
      <div
        style={{
          padding: '14px 16px',
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '1.5px',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          P-RATING FORMULA
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'FILL RATE', weight: '50%', value: readiness.fill_rate_pct, color: qualColor(readiness.fill_rate_pct) },
            { label: 'QUALIFICATIONS', weight: '30%', value: readiness.qualification_pct, color: qualColor(readiness.qualification_pct) },
            { label: 'FITNESS', weight: '20%', value: readiness.fitness_pct, color: qualColor(readiness.fitness_pct) },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                flex: '1 1 120px',
                padding: '10px 12px',
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  marginBottom: 4,
                }}
              >
                {item.label} ({item.weight})
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 16,
                  fontWeight: 700,
                  color: item.color,
                }}
              >
                {item.value.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
