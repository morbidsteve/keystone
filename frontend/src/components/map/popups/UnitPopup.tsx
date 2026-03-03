import type { MapUnit } from '@/api/map';
import { formatRelativeTime } from '@/lib/utils';
import { getStatusColor } from '../symbols/symbolConfig';

interface UnitPopupProps {
  unit: MapUnit;
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 10,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '1px',
        fontFamily: 'var(--font-mono)',
        color: '#fff',
        backgroundColor: getStatusColor(status),
        textTransform: 'uppercase',
      }}
    >
      {status}
    </span>
  );
}

function SupplyBar({
  label,
  percentage,
  dos,
  status,
}: {
  label: string;
  percentage: number;
  dos: number;
  status: string;
}) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 9,
          color: 'var(--color-text-muted)',
          marginBottom: 2,
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span>{label}</span>
        <span>
          {Math.round(percentage)}% | {dos} DOS
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: 6,
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, percentage)}%`,
            height: '100%',
            backgroundColor: getStatusColor(status),
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

export default function UnitPopup({ unit }: UnitPopupProps) {
  return (
    <div
      style={{
        minWidth: 260,
        maxWidth: 300,
        fontFamily: 'var(--font-mono)',
        backgroundColor: 'var(--color-bg-elevated)',
        color: 'var(--color-text)',
        padding: 12,
        borderRadius: 'var(--radius)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--color-text-bright)',
              letterSpacing: '0.5px',
            }}
          >
            {unit.name}
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--color-text-muted)',
              marginTop: 2,
            }}
          >
            {unit.abbreviation} | {unit.echelon}
          </div>
        </div>
        <StatusPill status={unit.supply_status} />
      </div>

      {/* Position info */}
      <div
        style={{
          fontSize: 9,
          color: 'var(--color-text-muted)',
          marginBottom: 8,
          padding: '4px 0',
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div>
          POS: {Math.abs(unit.latitude).toFixed(2)}{unit.latitude >= 0 ? 'N' : 'S'}, {Math.abs(unit.longitude).toFixed(2)}{unit.longitude >= 0 ? 'E' : 'W'}
          {unit.position_source && (
            <span style={{ marginLeft: 8, color: 'var(--color-accent)' }}>
              [{unit.position_source}]
            </span>
          )}
        </div>
        {unit.last_updated && (
          <div style={{ marginTop: 2 }}>
            UPDATED: {formatRelativeTime(unit.last_updated)}
          </div>
        )}
      </div>

      {/* Readiness */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
          OVERALL READINESS
        </span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: getStatusColor(
              unit.readiness_pct >= 90
                ? 'GREEN'
                : unit.readiness_pct >= 75
                  ? 'AMBER'
                  : 'RED',
            ),
          }}
        >
          {Math.round(unit.readiness_pct)}%
        </span>
      </div>

      {/* Supply breakdown */}
      {unit.supply_breakdown && unit.supply_breakdown.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '1.5px',
              color: 'var(--color-text-bright)',
              marginBottom: 6,
              textTransform: 'uppercase',
            }}
          >
            SUPPLY STATUS
          </div>
          {unit.supply_breakdown.map((s) => (
            <SupplyBar
              key={s.supply_class}
              label={`CL ${s.supply_class} - ${s.name}`}
              percentage={s.percentage}
              dos={s.dos}
              status={s.status}
            />
          ))}
        </div>
      )}

      {/* Equipment summary */}
      {unit.equipment_summary && unit.equipment_summary.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '1.5px',
              color: 'var(--color-text-bright)',
              marginBottom: 4,
              textTransform: 'uppercase',
            }}
          >
            EQUIPMENT READINESS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {unit.equipment_summary.map((eq) => (
              <div
                key={eq.type}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 9,
                  padding: '2px 0',
                }}
              >
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {eq.type}
                </span>
                <span>
                  <span
                    style={{
                      color: getStatusColor(
                        eq.readiness_pct >= 90
                          ? 'GREEN'
                          : eq.readiness_pct >= 75
                            ? 'AMBER'
                            : 'RED',
                      ),
                      fontWeight: 600,
                    }}
                  >
                    {eq.mission_capable}/{eq.total}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)', marginLeft: 4 }}>
                    ({Math.round(eq.readiness_pct)}%)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inbound convoys */}
      {unit.inbound_convoys && unit.inbound_convoys.length > 0 && (
        <div style={{ marginBottom: 4 }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '1.5px',
              color: 'var(--color-text-bright)',
              marginBottom: 4,
              textTransform: 'uppercase',
            }}
          >
            INBOUND CONVOYS
          </div>
          {unit.inbound_convoys.map((cv) => (
            <div
              key={cv.convoy_id}
              style={{
                fontSize: 9,
                padding: '4px 6px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: 'var(--radius)',
                marginBottom: 2,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 2,
                }}
              >
                <span style={{ color: 'var(--color-text-bright)', fontWeight: 600 }}>
                  {cv.name}
                </span>
                <StatusPill status={cv.status} />
              </div>
              <div style={{ color: 'var(--color-text-muted)' }}>
                ETA: {formatRelativeTime(cv.eta)} | {cv.cargo_summary}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Dashboard link */}
      <div
        style={{
          textAlign: 'center',
          paddingTop: 6,
          borderTop: '1px solid var(--color-border)',
          marginTop: 4,
        }}
      >
        <a
          href={`/dashboard?unit=${unit.unit_id}`}
          style={{
            fontSize: 9,
            color: 'var(--color-accent)',
            textDecoration: 'none',
            letterSpacing: '1px',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          VIEW DASHBOARD
        </a>
      </div>
    </div>
  );
}
