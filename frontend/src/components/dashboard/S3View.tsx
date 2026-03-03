import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import StatusDot from '@/components/ui/StatusDot';
import { SupplyStatus } from '@/lib/types';
import { getStatusColor } from '@/lib/utils';

// Demo unit sustainability data
const unitCards = [
  {
    id: '1-1',
    name: '1/1 BN',
    echelon: 'BATTALION',
    overallStatus: SupplyStatus.AMBER,
    readiness: 82,
    sustainability: 5,
    supplies: [
      { class: 'CL I', dos: 8, status: SupplyStatus.GREEN },
      { class: 'CL III', dos: 4, status: SupplyStatus.AMBER },
      { class: 'CL V', dos: 2, status: SupplyStatus.RED },
      { class: 'CL VIII', dos: 14, status: SupplyStatus.GREEN },
      { class: 'CL IX', dos: 7, status: SupplyStatus.GREEN },
    ],
    constraints: ['CL V resupply delayed 24hrs', 'AAV parts on backorder'],
  },
  {
    id: '2-1',
    name: '2/1 BN',
    echelon: 'BATTALION',
    overallStatus: SupplyStatus.GREEN,
    readiness: 91,
    sustainability: 8,
    supplies: [
      { class: 'CL I', dos: 10, status: SupplyStatus.GREEN },
      { class: 'CL III', dos: 7, status: SupplyStatus.GREEN },
      { class: 'CL V', dos: 6, status: SupplyStatus.AMBER },
      { class: 'CL VIII', dos: 12, status: SupplyStatus.GREEN },
      { class: 'CL IX', dos: 9, status: SupplyStatus.GREEN },
    ],
    constraints: [],
  },
  {
    id: '3-1',
    name: '3/1 BN',
    echelon: 'BATTALION',
    overallStatus: SupplyStatus.RED,
    readiness: 68,
    sustainability: 3,
    supplies: [
      { class: 'CL I', dos: 5, status: SupplyStatus.AMBER },
      { class: 'CL III', dos: 2, status: SupplyStatus.RED },
      { class: 'CL V', dos: 1, status: SupplyStatus.RED },
      { class: 'CL VIII', dos: 6, status: SupplyStatus.AMBER },
      { class: 'CL IX', dos: 3, status: SupplyStatus.AMBER },
    ],
    constraints: ['CL III emergency resupply requested', 'CL V black - requesting emergency push', 'Multiple NMC vehicles awaiting parts'],
  },
];

const movementFeasibility = [
  { name: 'MSR ALPHA', status: 'GREEN', detail: 'Open, no restrictions' },
  { name: 'MSR BRAVO', status: 'AMBER', detail: 'Bridge weight limit 20T' },
  { name: 'ASR CHARLIE', status: 'RED', detail: 'Closed - IED threat' },
];

export default function S3View() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Unit Sustainability Cards */}
      <div>
        <div className="section-header" style={{ marginBottom: 12, paddingLeft: 2 }}>
          UNIT SUSTAINABILITY OVERLAY
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {unitCards.map((unit) => {
            const color = getStatusColor(unit.overallStatus);
            return (
              <div
                key={unit.id}
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  borderTop: `2px solid ${color}`,
                  borderRadius: 'var(--radius)',
                  padding: 16,
                }}
              >
                {/* Unit Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--color-text-bright)',
                      }}
                    >
                      {unit.name}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        color: 'var(--color-text-muted)',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {unit.echelon}
                    </div>
                  </div>
                  <StatusBadge status={unit.overallStatus} />
                </div>

                {/* Key Stats */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    marginBottom: 12,
                    padding: '8px 0',
                    borderTop: '1px solid var(--color-border)',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <div className="section-header" style={{ marginBottom: 2 }}>
                      READINESS
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 20,
                        fontWeight: 700,
                        color: getStatusColor(
                          unit.readiness >= 90
                            ? SupplyStatus.GREEN
                            : unit.readiness >= 75
                            ? SupplyStatus.AMBER
                            : SupplyStatus.RED,
                        ),
                      }}
                    >
                      {unit.readiness}%
                    </div>
                  </div>
                  <div>
                    <div className="section-header" style={{ marginBottom: 2 }}>
                      SUSTAINABILITY
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 20,
                        fontWeight: 700,
                        color: getStatusColor(
                          unit.sustainability >= 7
                            ? SupplyStatus.GREEN
                            : unit.sustainability >= 3
                            ? SupplyStatus.AMBER
                            : SupplyStatus.RED,
                        ),
                      }}
                    >
                      {unit.sustainability}D
                    </div>
                  </div>
                </div>

                {/* Supply DOS */}
                <div style={{ marginBottom: 10 }}>
                  <div className="section-header" style={{ marginBottom: 6 }}>
                    SUPPLY DOS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {unit.supplies.map((s) => (
                      <div
                        key={s.class}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                        }}
                      >
                        <StatusDot status={s.status} size={6} />
                        <span style={{ width: 50, color: 'var(--color-text-muted)' }}>
                          {s.class}
                        </span>
                        <div
                          style={{
                            flex: 1,
                            height: 4,
                            backgroundColor: 'var(--color-bg)',
                            borderRadius: 2,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min((s.dos / 14) * 100, 100)}%`,
                              height: '100%',
                              backgroundColor: getStatusColor(s.status),
                              borderRadius: 2,
                            }}
                          />
                        </div>
                        <span style={{ width: 28, textAlign: 'right', color: getStatusColor(s.status) }}>
                          {s.dos}D
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Constraints */}
                {unit.constraints.length > 0 && (
                  <div>
                    <div className="section-header" style={{ marginBottom: 4, color: 'var(--color-warning)' }}>
                      CONSTRAINTS
                    </div>
                    {unit.constraints.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: 10,
                          color: 'var(--color-text-muted)',
                          padding: '2px 0',
                          borderLeft: '2px solid var(--color-warning)',
                          paddingLeft: 8,
                          marginBottom: 3,
                        }}
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Movement Feasibility */}
      <Card title="MOVEMENT ROUTE STATUS">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {movementFeasibility.map((route) => (
            <div
              key={route.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 12px',
                backgroundColor: 'var(--color-bg-surface)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--color-border)',
              }}
            >
              <StatusDot status={route.status} />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-text-bright)',
                  width: 100,
                }}
              >
                {route.name}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                }}
              >
                {route.detail}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
