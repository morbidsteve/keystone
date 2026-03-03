import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { SupplyStatus, type EquipmentRecord } from '@/lib/types';
import { getStatusColor } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';

const demoData: EquipmentRecord[] = [
  { id: '1', unitId: '1-1', unitName: '1/1 BN', type: 'HMMWV', tamcn: 'D1092', authorized: 48, onHand: 46, missionCapable: 40, notMissionCapable: 6, readinessPercent: 87, status: SupplyStatus.GREEN, lastUpdated: '2026-03-03T08:00:00Z' },
  { id: '2', unitId: '2-1', unitName: '2/1 BN', type: 'HMMWV', tamcn: 'D1092', authorized: 48, onHand: 48, missionCapable: 44, notMissionCapable: 4, readinessPercent: 92, status: SupplyStatus.GREEN, lastUpdated: '2026-03-03T07:00:00Z' },
  { id: '3', unitId: '1-1', unitName: '1/1 BN', type: 'MTVR', tamcn: 'D0095', authorized: 24, onHand: 24, missionCapable: 18, notMissionCapable: 6, readinessPercent: 75, status: SupplyStatus.AMBER, lastUpdated: '2026-03-03T07:00:00Z' },
  { id: '4', unitId: '2-1', unitName: '2/1 BN', type: 'MTVR', tamcn: 'D0095', authorized: 24, onHand: 22, missionCapable: 20, notMissionCapable: 2, readinessPercent: 91, status: SupplyStatus.GREEN, lastUpdated: '2026-03-03T06:00:00Z' },
  { id: '5', unitId: '1-1', unitName: '1/1 BN', type: 'LAV-25', tamcn: 'E0846', authorized: 16, onHand: 16, missionCapable: 15, notMissionCapable: 1, readinessPercent: 94, status: SupplyStatus.GREEN, lastUpdated: '2026-03-03T08:00:00Z' },
  { id: '6', unitId: '1-1', unitName: '1/1 BN', type: 'AAV', tamcn: 'E0902', authorized: 12, onHand: 12, missionCapable: 8, notMissionCapable: 4, readinessPercent: 67, status: SupplyStatus.RED, lastUpdated: '2026-03-03T06:30:00Z' },
  { id: '7', unitId: '2-1', unitName: '2/1 BN', type: 'M777', tamcn: 'D1168', authorized: 6, onHand: 6, missionCapable: 6, notMissionCapable: 0, readinessPercent: 100, status: SupplyStatus.GREEN, lastUpdated: '2026-03-03T08:00:00Z' },
  { id: '8', unitId: '1-1', unitName: '1/1 BN', type: 'JLTV', tamcn: 'D1200', authorized: 36, onHand: 34, missionCapable: 28, notMissionCapable: 6, readinessPercent: 82, status: SupplyStatus.AMBER, lastUpdated: '2026-03-03T07:00:00Z' },
];

const columnHelper = createColumnHelper<EquipmentRecord>();

export default function ReadinessTable() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('type', { header: 'TYPE' }),
      columnHelper.accessor('tamcn', { header: 'TAMCN' }),
      columnHelper.accessor('unitName', { header: 'UNIT' }),
      columnHelper.accessor('authorized', { header: 'AUTH' }),
      columnHelper.accessor('onHand', { header: 'O/H' }),
      columnHelper.accessor('missionCapable', {
        header: 'MC',
        cell: (info) => (
          <span style={{ color: 'var(--color-success)' }}>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('notMissionCapable', {
        header: 'NMC',
        cell: (info) => (
          <span style={{ color: info.getValue() > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('readinessPercent', {
        header: '%',
        cell: (info) => (
          <span style={{ color: getStatusColor(info.row.original.status), fontWeight: 600 }}>
            {info.getValue()}%
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'STATUS',
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: demoData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                      color: 'var(--color-text-muted)',
                      padding: '10px 12px',
                      textAlign:
                        ['authorized', 'onHand', 'missionCapable', 'notMissionCapable', 'readinessPercent'].includes(header.column.id)
                          ? 'right'
                          : 'left',
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' ? (
                        <ArrowUp size={10} />
                      ) : header.column.getIsSorted() === 'desc' ? (
                        <ArrowDown size={10} />
                      ) : (
                        <ArrowUpDown size={10} style={{ opacity: 0.3 }} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
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
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--color-border)',
                      color: cell.column.id === 'type' ? 'var(--color-text-bright)' : 'var(--color-text)',
                      textAlign:
                        ['authorized', 'onHand', 'missionCapable', 'notMissionCapable', 'readinessPercent'].includes(cell.column.id)
                          ? 'right'
                          : 'left',
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
