import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, Filter } from 'lucide-react';
import { type EquipmentRecord, SupplyStatus } from '@/lib/types';
import { getStatusColor } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import { getEquipmentRecords } from '@/api/equipment';
import { useDashboardStore } from '@/stores/dashboardStore';
import ExportMenu from '@/components/common/ExportMenu';
import TablePagination from '@/components/ui/TablePagination';

const columnHelper = createColumnHelper<EquipmentRecord>();

type EquipmentStatusFilter = 'ALL' | 'MC' | 'NMC' | 'DEADLINE';

export default function ReadinessTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatusFilter>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const navigate = useNavigate();
  const selectedUnitId = useDashboardStore((s) => s.selectedUnitId);

  const { data: apiData } = useQuery({
    queryKey: ['equipment', 'readiness-table', selectedUnitId],
    queryFn: () => getEquipmentRecords({ unitId: selectedUnitId ?? undefined }),
  });

  const tableData = useMemo(() => {
    let data = apiData?.data || [];

    // Status filter
    if (statusFilter !== 'ALL') {
      data = data.filter((row) => {
        switch (statusFilter) {
          case 'MC':
            return row.notMissionCapable === 0;
          case 'NMC':
            return row.notMissionCapable > 0;
          case 'DEADLINE':
            return row.status === SupplyStatus.RED;
          default:
            return true;
        }
      });
    }

    return data;
  }, [apiData, statusFilter]);

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
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const allRows = table.getRowModel().rows;
  const totalFiltered = allRows.length;

  // Pagination slice
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allRows.slice(start, start + pageSize);
  }, [allRows, currentPage, pageSize]);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [globalFilter, statusFilter]);

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

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div>
      {/* Search + Status Filter + Export */}
      <div className="mb-3 flex items-center gap-3 flex-wrap">
        <Filter size={14} className="text-[var(--color-text-muted)]" />
        <input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search type, TAMCN, unit..."
          className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] py-1.5 px-2.5 font-[var(--font-mono)] text-xs text-[var(--color-text)] w-[260px]"
        />
        <div>
          <label
            className="font-[var(--font-mono)] text-[9px] uppercase tracking-[1.5px] text-[var(--color-text-muted)] block mb-1"
          >
            STATUS
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EquipmentStatusFilter)}
            className="py-1.5 px-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text)] font-[var(--font-mono)] text-[11px]"
          >
            <option value="ALL">ALL</option>
            <option value="MC">MC</option>
            <option value="NMC">NMC</option>
            <option value="DEADLINE">DEADLINE</option>
          </select>
        </div>
        <div className="ml-auto">
          <ExportMenu
            data={exportData}
            filename="equipment-readiness"
            title="Equipment Readiness Report"
            columns={exportColumns}
          />
        </div>
      </div>

      <div
        className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden"
      >
        <div style={{ overflow: 'auto' }}>
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
            <tbody>
              {paginatedRows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer transition-colors duration-[var(--transition)]"
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-t-[var(--color-border)]">
          <TablePagination
            totalItems={totalFiltered}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>
    </div>
  );
}
