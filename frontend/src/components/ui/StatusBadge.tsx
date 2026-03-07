import { getStatusColor } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const color = getStatusColor(status);

  return (
    <span
      role="status"
      aria-label={`Status: ${label || status}`}
      className="font-[var(--font-mono)] text-[10px] py-0.5 px-2 rounded-[2px] uppercase tracking-[1px] font-medium whitespace-nowrap" style={{ border: `1px solid ${color}`, color: color, backgroundColor: `${color}33` }}
    >
      {label || status}
    </span>
  );
}
