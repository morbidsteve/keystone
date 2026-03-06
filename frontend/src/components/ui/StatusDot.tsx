import { getStatusColor } from '@/lib/utils';

interface StatusDotProps {
  status: string;
  size?: number;
  pulse?: boolean;
}

export default function StatusDot({ status, size = 8, pulse = false }: StatusDotProps) {
  const color = getStatusColor(status);

  return (
    <span
      role="img"
      aria-label={`Status: ${status}`}
      className="inline-block shrink-0" style={{ width: size, height: size, borderRadius: '50%', backgroundColor: color, animation: pulse ? 'pulse 2s ease-in-out infinite' : undefined }}
    />
  );
}
