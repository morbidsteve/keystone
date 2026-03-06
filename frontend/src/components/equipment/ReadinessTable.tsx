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
import ExportMenu from '@/components/common/ExportMenu';
import { useVirtualRows } from '@/hooks/useVirtualRows';

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
          <span className="text-[var(--color-success)]">{info.getValue()}</span>
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
          <span className="font-semibold" style={{ color: getStatusColor(info.row.original.status) }}>
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
          <ChevronRight size={14} className="text-[var(--color-text-muted)]" />
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

  const rows = table.getRowModel().rows;
  const { parentRef, virtualizer } = useVirtualRows({ count: rows.length, estimateSize: 36 });

  const exportData = useMemo(
    () =>
      tableData.map((r) => ({
        type: r.type,
        tamcn: r.tamcn,
        unitName: r.unitName,
        authorized: r.authorized,
        onHand: r.onHand,
        missionCapable: r.missionCapable,
        notMissionCapable: r.notMissionCapable,
        readinessPercent: r.readinessPercent,
        status: r.status,
      })) as Record<string, unknown>[],
    [tableData],
  );

  const exportColumns = [
    { key: 'type', header: 'Type' },
    { key: 'tamcn', header: 'TAMCN' },
    { key: 'unitName', header: 'Unit' },
    { key: 'authorized', header: 'Auth' },
    { key: 'onHand', header: 'O/H' },
    { key: 'missionCapable', header: 'MC' },
    { key: 'notMissionCapable', header: 'NMC' },
    { key: 'readinessPercent', header: '%' },
    { key: 'status', header: 'Status' },
  ];

  return (
    <div>
      {/* Export control */}
      <div className="mb-3 flex items-center justify-end">
        <ExportMenu
          data={exportData}
          filename="equipment-readiness"
          title="Equipment Readiness Report"
          columns={exportColumns}
        />
      </div>

      <div
        className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden"
      >
        <div ref={parentRef} style={{ maxHeight: 600, overflow: 'auto' }}>
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-[var(--color-bg-elevated)]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="font-[var(--font-mono)] text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] py-2.5 px-3 border-b border-b-[var(--color-border)] cursor-pointer whitespace-nowrap" style={{ textAlign: ['authorized', 'onHand', 'missionCapable', 'notMissionCapable', 'readinessPercent'].includes(header.column.id)
                            ? 'right'
                            : 'left', userSelect: 'none' }}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' ? (
                          <ArrowUp size={10} />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <ArrowDown size={10} />
                        ) : (
                          <ArrowUpDown size={10} className="opacity-30" />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <tr
                    key={row.id}
                    className="cursor-pointer transition-colors duration-[var(--transition)]"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: virtualRow.size,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
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
                        className="font-[var(--font-mono)] text-xs py-2 px-3 border-b border-b-[var(--color-border)]" style={{ color: cell.column.id === 'type' ? 'var(--color-text-bright)' : 'var(--color-text)', textAlign: ['authorized', 'onHand', 'missionCapable', 'notMissionCapable', 'readinessPercent'].includes(cell.column.id)
                              ? 'right'
                              : 'left' }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
