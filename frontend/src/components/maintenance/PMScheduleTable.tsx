import { useMemo } from 'react';
import { AlertTriangle, Calendar, CheckCircle, Clock } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import type { PMScheduleItem, PMType } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface PMScheduleTableProps {
  schedule: PMScheduleItem[];
}

const PM_TYPE_COLORS: Record<PMType, string> = {
  DAILY: '#06b6d4',
  WEEKLY: '#3b82f6',
  MONTHLY: '#8b5cf6',
  QUARTERLY: '#f59e0b',
  ANNUAL: '#ef4444',
  MILEAGE: '#10b981',
};

function getStatusInfo(item: PMScheduleItem): { label: string; color: string; icon: 'overdue' | 'upcoming' | 'ok' } {
  if (item.isOverdue) {
    return { label: 'OVERDUE', color: 'var(--color-danger)', icon: 'overdue' };
  }
  // Check if due within 7 days
  if (item.nextDue) {
    const nextDate = new Date(item.nextDue);
    const now = new Date();
    const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      return { label: 'UPCOMING', color: 'var(--color-warning)', icon: 'upcoming' };
    }
  }
  return { label: 'OK', color: 'var(--color-success)', icon: 'ok' };
}

export default function PMScheduleTable({ schedule }: PMScheduleTableProps) {
  const sortedSchedule = useMemo(() => {
    return [...schedule].sort((a, b) => {
      // Overdue first, then by next due ascending
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.nextDue && b.nextDue) return a.nextDue.localeCompare(b.nextDue);
      if (a.nextDue) return -1;
      if (b.nextDue) return 1;
      return 0;
    });
  }, [schedule]);

  if (sortedSchedule.length === 0) {
    return (
      <EmptyState
        icon={<Calendar size={32} />}
        title="NO PM SCHEDULES"
        message="Preventive maintenance schedules will appear here"
      />
    );
  }

  const columns = ['EQUIPMENT', 'TYPE', 'INTERVAL', 'LAST PERFORMED', 'NEXT DUE', 'STATUS'];

  return (
    <div className="overflow-x-auto">
      <table
        className="w-full border-collapse font-[var(--font-mono)] text-[11px]"
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="py-2.5 px-3 text-left text-[9px] font-semibold tracking-[1.5px] uppercase text-[var(--color-text-muted)] border-b border-b-[var(--color-border)] whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedSchedule.map((item) => {
            const status = getStatusInfo(item);
            return (
              <tr
                key={item.id}
                style={{
                  borderLeft: item.isOverdue
                    ? '3px solid var(--color-danger)'
                    : '3px solid transparent',
                  transition: 'background-color var(--transition)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {/* Equipment */}
                <td className="py-2.5 px-3 border-b border-b-[var(--color-border)]">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-[var(--color-text-bright)]">
                      {item.bumperNumber || '---'}
                    </span>
                    <span className="text-[9px] text-[var(--color-text-muted)]">
                      {item.nomenclature || '---'}
                    </span>
                  </div>
                </td>

                {/* Type badge */}
                <td className="py-2.5 px-3 border-b border-b-[var(--color-border)]">
                  <span
                    className="text-[8px] font-semibold tracking-[1px] py-0.5 px-2 rounded-[var(--radius)]" style={{ backgroundColor: `${PM_TYPE_COLORS[item.pmType]}18`, color: PM_TYPE_COLORS[item.pmType], border: `1px solid ${PM_TYPE_COLORS[item.pmType]}40` }}
                  >
                    {item.pmType}
                  </span>
                </td>

                {/* Interval */}
                <td
                  className="py-2.5 px-3 border-b border-b-[var(--color-border)] text-[var(--color-text)]"
                >
                  {item.pmType === 'MILEAGE'
                    ? `${(item.intervalValue ?? 0).toLocaleString()} mi`
                    : `${item.intervalValue ?? 0}d`}
                </td>

                {/* Last Performed */}
                <td
                  className="py-2.5 px-3 border-b border-b-[var(--color-border)] text-[var(--color-text-muted)] whitespace-nowrap"
                >
                  {item.lastPerformed ? formatDate(item.lastPerformed, 'dd MMM yyyy') : '---'}
                </td>

                {/* Next Due */}
                <td
                  className="py-2.5 px-3 border-b border-b-[var(--color-border)] whitespace-nowrap" style={{ color: item.isOverdue ? 'var(--color-danger)' : 'var(--color-text)', fontWeight: item.isOverdue ? 600 : 400 }}
                >
                  {item.nextDue ? formatDate(item.nextDue, 'dd MMM yyyy') : '---'}
                  {item.isOverdue && item.daysOverdue != null && item.daysOverdue > 0 && (
                    <span className="text-[9px] ml-1.5 text-[var(--color-danger)]">
                      ({item.daysOverdue}d overdue)
                    </span>
                  )}
                </td>

                {/* Status */}
                <td className="py-2.5 px-3 border-b border-b-[var(--color-border)]">
                  <div className="flex items-center gap-1.5">
                    {status.icon === 'overdue' && <AlertTriangle size={12} style={{ color: status.color }} />}
                    {status.icon === 'upcoming' && <Clock size={12} style={{ color: status.color }} />}
                    {status.icon === 'ok' && <CheckCircle size={12} style={{ color: status.color }} />}
                    <span
                      className="text-[9px] font-semibold tracking-[1px]" style={{ color: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
