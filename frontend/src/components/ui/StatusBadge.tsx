import { getStatusColor } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const color = getStatusColor(status);

  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        padding: '2px 8px',
        borderRadius: 2,
        border: `1px solid ${color}`,
        color: color,
        backgroundColor: `${color}15`,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {label || status}
    </span>
  );
}
