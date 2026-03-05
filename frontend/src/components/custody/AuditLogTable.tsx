// =============================================================================
// AuditLogTable — Audit log table with action/entity badges and filters
// =============================================================================

import { FileText } from 'lucide-react';
import type { AuditLogEntry } from '@/lib/types';
import EmptyState from '@/components/ui/EmptyState';

interface AuditLogTableProps {
  logs: AuditLogEntry[];
  loading?: boolean;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: '#22c55e',
  UPDATE: '#3b82f6',
  DELETE: '#ef4444',
  VIEW: '#6b7280',
  TRANSFER: '#a855f7',
  STATUS_CHANGE: '#f59e0b',
  INVENTORY_START: '#3b82f6',
  INVENTORY_COMPLETE: '#22c55e',
  ITEM_VERIFIED: '#14b8a6',
  LOGIN: '#14b8a6',
  LOGOUT: '#6b7280',
  PERMISSION_CHANGE: '#8b5cf6',
  EXPORT: '#8b5cf6',
};

const thStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  padding: '8px 10px',
  textAlign: 'left',
  borderBottom: '1px solid var(--color-border)',
};

const tdStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  padding: '8px 10px',
  borderBottom: '1px solid var(--color-border)',
  color: 'var(--color-text)',
};

export default function AuditLogTable({ logs, loading }: AuditLogTableProps) {
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div
          className="skeleton"
          style={{ width: 200, height: 16, margin: '0 auto 12px' }}
        />
        <div
          className="skeleton"
          style={{ width: 300, height: 12, margin: '0 auto' }}
        />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={<FileText size={32} />}
        title="NO AUDIT LOGS"
        message="Audit log entries will appear here"
      />
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Date/Time', 'User', 'Action', 'Entity Type', 'Description'].map((h) => (
              <th key={h} style={thStyle}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const actionColor = ACTION_COLORS[log.action] ?? '#6b7280';

            return (
              <tr key={log.id}>
                <td style={{ ...tdStyle, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                  {log.user_id === 1 ? 'admin' : `User #${log.user_id}`}
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 3,
                      backgroundColor: `${actionColor}20`,
                      color: actionColor,
                      fontWeight: 600,
                      fontSize: 9,
                      letterSpacing: '0.5px',
                    }}
                  >
                    {log.action}
                  </span>
                </td>
                <td style={{ ...tdStyle, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {log.entity_type.replace(/_/g, ' ')}
                </td>
                <td style={{ ...tdStyle, maxWidth: 400 }}>{log.description}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
