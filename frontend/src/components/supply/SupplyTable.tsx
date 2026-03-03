import { useState, useMemo } from 'react';
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
import { ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { getSupplyRecords } from '@/api/supply';
import { SupplyClass, SupplyStatus, type SupplyRecord } from '@/lib/types';
import { SUPPLY_CLASS_SHORT } from '@/lib/constants';
import { getStatusColor } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';

// Demo data for when API is not connected
const demoData: SupplyRecord[] = [
  { id: '1', unitId: '1-1', unitName: '1/1 BN', supplyClass: SupplyClass.I, item: 'MRE Case A', onHand: 2400, authorized: 3000, required: 3000, dueIn: 0, consumptionRate: 300, dos: 8, status: SupplyStatus.GREEN, lastUpdated: '2026-03-03T08:00:00Z' },
  { id: '2', unitId: '1-1', unitName: '1/1 BN', supplyClass: SupplyClass.I, item: 'UGR-H&S', onHand: 180, authorized: 200, required: 200, dueIn: 20, consumptionRate: 15, dos: 12, status: SupplyStatus.GREEN, lastUpdated: '2026-03-03T08:00:00Z' },
  { id: '3', unitId: '1-1', unitName: '1/1 BN', supplyClass: SupplyClass.III, item: 'JP-8 (gal)', onHand: 12000, authorized: 20000, required: 20000, dueIn: 5000, consumptionRate: 3000, dos: 4, status: SupplyStatus.AMBER, lastUpdated: '2026-03-03T07:30:00Z' },
  { id: '4', unitId: '1-1', unitName: '1/1 BN', supplyClass: SupplyClass.III, item: 'MOGAS (gal)', onHand: 800, authorized: 1500, required: 1500, dueIn: 0, consumptionRate: 200, dos: 4, status: SupplyStatus.AMBER, lastUpdated: '2026-03-03T07:30:00Z' },
  { id: '5', unitId: '2-1', unitName: '2/1 BN', supplyClass: SupplyClass.V, item: '5.56mm Ball', onHand: 45000, authorized: 100000, required: 100000, dueIn: 0, consumptionRate: 22500, dos: 2, status: SupplyStatus.RED, lastUpdated: '2026-03-03T06:00:00Z' },
  { id: '6', unitId: '2-1', unitName: '2/1 BN', supplyClass: SupplyClass.V, item: '7.62mm', onHand: 22000, authorized: 50000, required: 50000, dueIn: 10000, consumptionRate: 8000, dos: 3, status: SupplyStatus.RED, lastUpdated: '2026-03-03T06:00:00Z' },
  { id: '7', unitId: '1-1', unitName: '1/1 BN', supplyClass: SupplyClass.VIII, item: 'Blood Type O+', onHand: 180, authorized: 200, required: 200, dueIn: 20, consumptionRate: 10, dos: 18, status: SupplyStatus.GREEN, lastUpdated: '2026-03-03T08:15:00Z' },
  { id: '8', unitId: '2-1', unitName: '2/1 BN', supplyClass: SupplyClass.IX, item: 'HMMWV Parts Kit', onHand: 42, authorized: 60, required: 60, dueIn: 12, consumptionRate: 6, dos: 7, status: SupplyStatus.AMBER, lastUpdated: '2026-03-03T05:00:00Z' },
  { id: '9', unitId: '1-1', unitName: '1/1 BN', supplyClass: SupplyClass.II, item: 'MOPP Suits', onHand: 900, authorized: 1000, required: 1000, dueIn: 0, consumptionRate: 10, dos: 90, status: SupplyStatus.GREEN, lastUpdated: '2026-03-03T04:00:00Z' },
  { id: '10', unitId: '2-1', unitName: '2/1 BN', supplyClass: SupplyClass.IV, item: 'Concertina Wire (rolls)', onHand: 45, authorized: 100, required: 100, dueIn: 30, consumptionRate: 5, dos: 9, status: SupplyStatus.AMBER, lastUpdated: '2026-03-03T03:00:00Z' },
];

const columnHelper = createColumnHelper<SupplyRecord>();

interface SupplyTableProps {
  unitFilter?: string;
  classFilter?: SupplyClass;
  statusFilter?: SupplyStatus;
}

export default function SupplyTable({ unitFilter, classFilter, statusFilter }: SupplyTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const { data: apiData, isLoading } = useQuery({
    queryKey: ['supply', unitFilter, classFilter, statusFilter],
    queryFn: () =>
      getSupplyRecords({
        unitId: unitFilter,
        supplyClass: classFilter,
        status: statusFilter,
      }),
    retry: false,
  });

  const tableData = useMemo(() => {
    const records = apiData?.data || demoData;
    let filtered = records;
    if (classFilter) {
      filtered = filtered.filter((r) => r.supplyClass === classFilter);
    }
    if (statusFilter) {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }
    return filtered;
  }, [apiData, classFilter, statusFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('unitName', {
        header: 'UNIT',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('supplyClass', {
        header: 'CLASS',
        cell: (info) => SUPPLY_CLASS_SHORT[info.getValue()] || info.getValue(),
      }),
      columnHelper.accessor('item', {
        header: 'ITEM',
        cell: (info) => (
          <span style={{ color: 'var(--color-text-bright)' }}>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('onHand', {
        header: 'ON HAND',
        cell: (info) => info.getValue().toLocaleString(),
      }),
      columnHelper.accessor('authorized', {
        header: 'REQUIRED',
        cell: (info) => (
          <span style={{ color: 'var(--color-text-muted)' }}>
            {info.getValue().toLocaleString()}
          </span>
        ),
      }),
      columnHelper.accessor(
        (row) => Math.round((row.onHand / row.authorized) * 100),
        {
          id: 'percent',
          header: '%',
          cell: (info) => {
            const val = info.getValue();
            const row = info.row.original;
            return (
              <span
                style={{
                  color: getStatusColor(row.status),
                  fontWeight: 600,
                }}
              >
                {val}%
              </span>
            );
          },
        },
      ),
      columnHelper.accessor('dos', {
        header: 'DOS',
        cell: (info) => `${info.getValue()}D`,
      }),
      columnHelper.accessor('consumptionRate', {
        header: 'RATE',
        cell: (info) => (
          <span style={{ color: 'var(--color-text-muted)' }}>
            {info.getValue()}/day
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
    data: tableData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) return <TableSkeleton rows={8} />;

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
        <input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search supply records..."
          style={{
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: '6px 10px',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--color-text)',
            width: 260,
          }}
        />
      </div>

      {/* Table */}
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
                          ['onHand', 'authorized', 'percent', 'dos', 'consumptionRate'].includes(
                            header.column.id,
                          )
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
                        color: 'var(--color-text)',
                        textAlign:
                          ['onHand', 'authorized', 'percent', 'dos', 'consumptionRate'].includes(
                            cell.column.id,
                          )
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
    </div>
  );
}
