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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Supply Status */}
      <Card
        title="SUPPLY STATUS"
        headerRight={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={12} style={{ color: 'var(--color-text-muted)' }} />
            <select
              value={supplyFilter}
              onChange={(e) => setSupplyFilter(e.target.value)}
              style={{
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                color: 'var(--color-text)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                padding: '4px 8px',
              }}
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
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                    style={{ transition: 'background-color var(--transition)' }}
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
                    <td style={{ ...tableCellStyle, textAlign: 'right', color: 'var(--color-text-muted)' }}>
                      {row.authorized.toLocaleString()}
                    </td>
                    <td
                      style={{
                        ...tableCellStyle,
                        textAlign: 'right',
                        color: getStatusColor(row.status),
                        fontWeight: 600,
                      }}
                    >
                      {pct}%
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'right' }}>{row.dos}D</td>
                    <td style={{ ...tableCellStyle, textAlign: 'right', color: 'var(--color-text-muted)' }}>
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
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                    style={{ transition: 'background-color var(--transition)' }}
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
                    <td style={{ ...tableCellStyle, textAlign: 'right', color: 'var(--color-success)' }}>
                      {eq.missionCapable}
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'right', color: 'var(--color-danger)' }}>
                      {eq.notMissionCapable}
                    </td>
                    <td
                      style={{
                        ...tableCellStyle,
                        textAlign: 'right',
                        color: getStatusColor(eq.status),
                        fontWeight: 600,
                      }}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                  }}
                >
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
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--color-text-bright)',
                      }}
                    >
                      {mov.name}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: movColor,
                        fontWeight: 600,
                        letterSpacing: '1px',
                      }}
                    >
                      {mov.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      gap: 16,
                    }}
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
