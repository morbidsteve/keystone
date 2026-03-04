import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronRight } from 'lucide-react';
import { type EquipmentRecord } from '@/lib/types';
import { getStatusColor } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import { getEquipmentRecords } from '@/api/equipment';
import { useDashboardStore } from '@/stores/dashboardStore';

const columnHelper = createColumnHelper<EquipmentRecord>();

export default function ReadinessTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const navigate = useNavigate();
  const selectedUnitId = useDashboardStore((s) => s.selectedUnitId);

  const { data: apiData } = useQuery({
    queryKey: ['equipment', 'readiness-table', selectedUnitId],
    queryFn: () => getEquipmentRecords({ unitId: selectedUnitId ?? undefined }),
  });

  const tableData = useMemo(() => apiData?.data || [], [apiData]);

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
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: () => (
          <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: tableData,
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
                style={{ transition: 'background-color var(--transition)', cursor: 'pointer' }}
                onClick={() => navigate(`/equipment/${row.original.id}`)}
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
