import type { MapUnit } from '@/api/map';
import { formatRelativeTime } from '@/lib/utils';
import { getStatusColor } from '../symbols/symbolConfig';

interface UnitPopupProps {
  unit: MapUnit;
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className="inline-block py-0.5 px-2 rounded-[10px] text-[9px] font-bold tracking-[1px] font-[var(--font-mono)] text-[#fff] uppercase" style={{ backgroundColor: getStatusColor(status) }}
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
    <div className="mb-1">
      <div
        className="flex justify-between text-[9px] text-[var(--color-text-muted)] mb-0.5 font-[var(--font-mono)]"
      >
        <span>{label}</span>
        <span>
          {Math.round(percentage)}% | {dos} DOS
        </span>
      </div>
      <div
        className="w-full h-[6px] bg-[rgba(255,255,255,0.1)] rounded-[3px] overflow-hidden"
      >
        <div
          className="h-full rounded-[3px]" style={{ width: `${Math.min(100, percentage)}%`, backgroundColor: getStatusColor(status), transition: 'width 0.3s ease' }}
        />
      </div>
    </div>
  );
}

export default function UnitPopup({ unit }: UnitPopupProps) {
  return (
    <div
      className="min-w-[260px] max-w-[300px] font-[var(--font-mono)] bg-[var(--color-bg-elevated)] text-[var(--color-text)] p-3 rounded-[var(--radius)]"
    >
      {/* Header */}
      <div
        className="flex justify-between items-start mb-2"
      >
        <div>
          <div
            className="text-xs font-bold text-[var(--color-text-bright)] tracking-[0.5px]"
          >
            {unit.name}
          </div>
          <div
            className="text-[10px] text-[var(--color-text-muted)] mt-0.5"
          >
            {unit.abbreviation} | {unit.echelon}
          </div>
        </div>
        <StatusPill status={unit.supply_status} />
      </div>

      {/* Position info */}
      <div
        className="text-[9px] text-[var(--color-text-muted)] mb-2 py-1 px-0 border-t border-t-[var(--color-border)] border-b border-b-[var(--color-border)]"
      >
        <div>
          POS: {Math.abs(unit.latitude).toFixed(2)}{unit.latitude >= 0 ? 'N' : 'S'}, {Math.abs(unit.longitude).toFixed(2)}{unit.longitude >= 0 ? 'E' : 'W'}
          {unit.position_source && (
            <span className="ml-2 text-[var(--color-accent)]">
              [{unit.position_source}]
            </span>
          )}
        </div>
        {unit.last_updated && (
          <div className="mt-0.5">
            UPDATED: {formatRelativeTime(unit.last_updated)}
          </div>
        )}
      </div>

      {/* Readiness */}
      <div
        className="flex justify-between items-center mb-2"
      >
        <span className="text-[10px] text-[var(--color-text-muted)]">
          OVERALL READINESS
        </span>
        <span
          className="text-sm font-bold" style={{ color: getStatusColor(
              unit.readiness_pct >= 90
                ? 'GREEN'
                : unit.readiness_pct >= 75
                  ? 'AMBER'
                  : 'RED',
            ) }}
        >
          {Math.round(unit.readiness_pct)}%
        </span>
      </div>

      {/* Supply breakdown */}
      {unit.supply_breakdown && unit.supply_breakdown.length > 0 && (
        <div className="mb-2">
          <div
            className="text-[9px] font-bold tracking-[1.5px] text-[var(--color-text-bright)] mb-1.5 uppercase"
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
        <div className="mb-2">
          <div
            className="text-[9px] font-bold tracking-[1.5px] text-[var(--color-text-bright)] mb-1 uppercase"
          >
            EQUIPMENT READINESS
          </div>
          <div className="flex flex-col gap-0.5">
            {unit.equipment_summary.map((eq) => (
              <div
                key={eq.type}
                className="flex justify-between items-center text-[9px] py-0.5 px-0"
              >
                <span className="text-[var(--color-text-muted)]">
                  {eq.type}
                </span>
                <span>
                  <span
                    className="font-semibold" style={{ color: getStatusColor(
                        eq.readiness_pct >= 90
                          ? 'GREEN'
                          : eq.readiness_pct >= 75
                            ? 'AMBER'
                            : 'RED',
                      ) }}
                  >
                    {eq.mission_capable}/{eq.total}
                  </span>
                  <span className="text-[var(--color-text-muted)] ml-1">
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
        <div className="mb-1">
          <div
            className="text-[9px] font-bold tracking-[1.5px] text-[var(--color-text-bright)] mb-1 uppercase"
          >
            INBOUND CONVOYS
          </div>
          {unit.inbound_convoys.map((cv) => (
            <div
              key={cv.convoy_id}
              className="text-[9px] py-1 px-1.5 bg-[rgba(255,255,255,0.03)] rounded-[var(--radius)] mb-0.5"
            >
              <div
                className="flex justify-between mb-0.5"
              >
                <span className="text-[var(--color-text-bright)] font-semibold">
                  {cv.name}
                </span>
                <StatusPill status={cv.status} />
              </div>
              <div className="text-[var(--color-text-muted)]">
                ETA: {formatRelativeTime(cv.eta)} | {cv.cargo_summary}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Dashboard link */}
      <div
        className="text-center pt-1.5 border-t border-t-[var(--color-border)] mt-1"
      >
        <a
          href={`/dashboard?unit=${unit.unit_id}`}
          className="text-[9px] text-[var(--color-accent)] no-underline tracking-[1px] font-semibold uppercase"
        >
          VIEW DASHBOARD
        </a>
      </div>
    </div>
  );
}
