import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import { SupplyStatus, SupplyClass, type SupplyRecord, type EquipmentRecord, type Movement, MovementStatus } from '@/lib/types';
import { formatDateShort, getStatusColor } from '@/lib/utils';
import { SUPPLY_CLASS_SHORT } from '@/lib/constants';
import { Filter } from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { mockApi } from '@/api/mockClient';

const tableHeaderStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  color: 'var(--color-text-muted)',
  padding: '10px 12px',
  textAlign: 'left',
  borderBottom: '1px solid var(--color-border)',
  whiteSpace: 'nowrap',
};

const tableCellStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  padding: '8px 12px',
  borderBottom: '1px solid var(--color-border)',
  color: 'var(--color-text)',
};

export default function S4View() {
  const [supplyFilter, setSupplyFilter] = useState<string>('ALL');
  const selectedUnitId = useDashboardStore((s) => s.selectedUnitId);
  const [supplyData, setSupplyData] = useState<SupplyRecord[]>([]);
  const [equipmentData, setEquipmentData] = useState<EquipmentRecord[]>([]);
  const [movementData, setMovementData] = useState<Movement[]>([]);

  useEffect(() => {
    mockApi.getSupplyRecords({ unitId: selectedUnitId ?? undefined }).then((r) => setSupplyData(r.data));
    mockApi.getEquipmentRecords({ unitId: selectedUnitId ?? undefined }).then((r) => setEquipmentData(r.data));
    mockApi.getMovements({ unitId: selectedUnitId ?? undefined }).then(setMovementData);
  }, [selectedUnitId]);

  const filteredSupply =
    supplyFilter === 'ALL'
      ? supplyData
      : supplyData.filter((s) => s.supplyClass === supplyFilter);

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      {/* Supply Status */}
      <Card
        title="SUPPLY STATUS"
        headerRight={
          <div className="flex items-center gap-1.5">
            <Filter size={12} className="text-[var(--color-text-muted)]" />
            <select
              value={supplyFilter}
              onChange={(e) => setSupplyFilter(e.target.value)}
              className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text)] font-[var(--font-mono)] text-[10px] py-1 px-2"
            >
              <option value="ALL">ALL CLASSES</option>
              {Object.values(SupplyClass).map((sc) => (
                <option key={sc} value={sc}>
                  {SUPPLY_CLASS_SHORT[sc]}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th style={tableHeaderStyle}>UNIT</th>
                <th style={tableHeaderStyle}>CLASS</th>
                <th style={tableHeaderStyle}>ITEM</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>ON HAND</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>AUTH</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>%</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>DOS</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>RATE</th>
                <th style={tableHeaderStyle}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredSupply.map((row) => {
                const pct = Math.round((row.onHand / row.authorized) * 100);
                return (
                  <tr
                    key={row.id}
                    className="transition-colors duration-[var(--transition)]"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'transparent')
                    }
                  >
                    <td style={tableCellStyle}>{row.unitName}</td>
                    <td style={tableCellStyle}>{SUPPLY_CLASS_SHORT[row.supplyClass]}</td>
                    <td style={{ ...tableCellStyle, color: 'var(--color-text-bright)' }}>
                      {row.item}
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                      {row.onHand.toLocaleString()}
                    </td>
                    <td className="text-[var(--color-text-muted)]">
                      {row.authorized.toLocaleString()}
                    </td>
                    <td
                      className="font-semibold" style={{ color: getStatusColor(row.status) }}
                    >
                      {pct}%
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'right' }}>{row.dos}D</td>
                    <td className="text-[var(--color-text-muted)]">
                      {row.consumptionRate}/day
                    </td>
                    <td style={tableCellStyle}>
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Two Column: Equipment + Movements */}
      <div className="grid-responsive-2col">
        {/* Equipment Readiness */}
        <Card title="EQUIPMENT READINESS">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>TYPE</th>
                  <th style={tableHeaderStyle}>UNIT</th>
                  <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>MC</th>
                  <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>NMC</th>
                  <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>%</th>
                  <th style={tableHeaderStyle}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {equipmentData.map((eq) => (
                  <tr
                    key={eq.id}
                    className="transition-colors duration-[var(--transition)]"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'transparent')
                    }
                  >
                    <td style={{ ...tableCellStyle, color: 'var(--color-text-bright)' }}>
                      {eq.type}
                    </td>
                    <td style={tableCellStyle}>{eq.unitName}</td>
                    <td className="text-[var(--color-success)]">
                      {eq.missionCapable}
                    </td>
                    <td className="text-[var(--color-danger)]">
                      {eq.notMissionCapable}
                    </td>
                    <td
                      className="font-semibold" style={{ color: getStatusColor(eq.status) }}
                    >
                      {eq.readinessPercent}%
                    </td>
                    <td style={tableCellStyle}>
                      <StatusBadge status={eq.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Active Movements */}
        <Card title="ACTIVE MOVEMENTS">
          <div className="flex flex-col gap-2">
            {movementData.map((mov) => {
              const movColor =
                mov.status === MovementStatus.EN_ROUTE
                  ? 'var(--color-accent)'
                  : mov.status === MovementStatus.DELAYED
                  ? 'var(--color-danger)'
                  : 'var(--color-text-muted)';
              return (
                <div
                  key={mov.id}
                  className="py-2.5 px-3 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius)]"
                >
                  <div
                    className="flex justify-between items-center mb-1.5"
                  >
                    <span
                      className="font-[var(--font-mono)] text-xs font-semibold text-[var(--color-text-bright)]"
                    >
                      {mov.name}
                    </span>
                    <span
                      className="font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px]" style={{ color: movColor }}
                    >
                      {mov.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div
                    className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] flex gap-4"
                  >
                    <span>{mov.originUnit} → {mov.destinationUnit}</span>
                    <span>{mov.cargo}</span>
                    <span>{mov.vehicles} VEH</span>
                    {mov.eta && <span>ETA: {formatDateShort(mov.eta)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
