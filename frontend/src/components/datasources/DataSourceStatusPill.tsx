import StatusDot from '@/components/ui/StatusDot';
import type { DataSourceStatus } from '@/api/dataSources';

const statusMap: Record<DataSourceStatus, { dot: string; label: string; color: string; pulse: boolean }> = {
  active: { dot: 'GREEN', label: 'ACTIVE', color: 'var(--color-success)', pulse: false },
  inactive: { dot: 'RED', label: 'INACTIVE', color: 'var(--color-text-muted)', pulse: false },
  error: { dot: 'AMBER', label: 'ERROR', color: 'var(--color-warning)', pulse: false },
  connecting: { dot: 'AMBER', label: 'CONNECTING', color: 'var(--color-warning)', pulse: true },
  connected: { dot: 'GREEN', label: 'CONNECTED', color: 'var(--color-success)', pulse: true },
  disconnected: { dot: 'RED', label: 'DISCONNECTED', color: 'var(--color-danger)', pulse: false },
};

export default function DataSourceStatusPill({ status }: { status: DataSourceStatus }) {
  const info = statusMap[status] || statusMap.inactive;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 10px',
        borderRadius: 2,
        border: `1px solid ${info.color}`,
        backgroundColor: `${info.color}15`,
      }}
    >
      <StatusDot status={info.dot} size={6} pulse={info.pulse} />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          fontWeight: 500,
          color: info.color,
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}
      >
        {info.label}
      </span>
    </span>
  );
}
