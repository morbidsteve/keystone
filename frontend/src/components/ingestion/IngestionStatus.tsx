import { FileText, Check, AlertTriangle, Clock, Loader } from 'lucide-react';
import Card from '@/components/ui/Card';
import StatusDot from '@/components/ui/StatusDot';
import { formatRelativeTime } from '@/lib/utils';

interface IngestionEntry {
  id: string;
  filename: string;
  source: string;
  records: number;
  confidence: number;
  status: 'PENDING' | 'PARSING' | 'PARSED' | 'REVIEWED' | 'ERROR';
  uploadedBy: string;
  uploadedAt: string;
  errors?: string[];
}

const demoEntries: IngestionEntry[] = [
  { id: '1', filename: 'logstat_0303_0800.txt', source: 'mIRC', records: 12, confidence: 0.85, status: 'PARSED', uploadedBy: 'cpl.smith', uploadedAt: '2026-03-03T08:15:00Z' },
  { id: '2', filename: 'equipment_status.xlsx', source: 'Excel', records: 45, confidence: 0.92, status: 'REVIEWED', uploadedBy: 'sgt.jones', uploadedAt: '2026-03-03T07:00:00Z' },
  { id: '3', filename: 'supply_update_0302.csv', source: 'CSV', records: 28, confidence: 0.78, status: 'PARSED', uploadedBy: 'cpl.smith', uploadedAt: '2026-03-02T18:00:00Z' },
  { id: '4', filename: 'movement_log.txt', source: 'mIRC', records: 0, confidence: 0, status: 'PARSING', uploadedBy: 'lt.davis', uploadedAt: '2026-03-03T09:00:00Z' },
  { id: '5', filename: 'bad_format.txt', source: 'mIRC', records: 0, confidence: 0, status: 'ERROR', uploadedBy: 'cpl.smith', uploadedAt: '2026-03-03T08:30:00Z', errors: ['Unrecognized format'] },
];

function getStatusIcon(status: string) {
  switch (status) {
    case 'REVIEWED': return <Check size={12} style={{ color: 'var(--color-success)' }} />;
    case 'PARSED': return <FileText size={12} style={{ color: 'var(--color-accent)' }} />;
    case 'PARSING': return <Loader size={12} className="animate-spin" style={{ color: 'var(--color-accent)' }} />;
    case 'ERROR': return <AlertTriangle size={12} style={{ color: 'var(--color-danger)' }} />;
    default: return <Clock size={12} style={{ color: 'var(--color-text-muted)' }} />;
  }
}

function getStatusDot(status: string) {
  switch (status) {
    case 'REVIEWED': return 'GREEN';
    case 'PARSED': return 'AMBER';
    case 'PARSING': return 'AMBER';
    case 'ERROR': return 'RED';
    default: return 'AMBER';
  }
}

export default function IngestionStatus() {
  return (
    <Card title="PIPELINE STATUS">
      {/* Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 16,
          padding: '12px 0',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {[
          { label: 'TOTAL', value: demoEntries.length, color: 'var(--color-text-bright)' },
          { label: 'PARSED', value: demoEntries.filter((e) => e.status === 'PARSED').length, color: 'var(--color-accent)' },
          { label: 'REVIEWED', value: demoEntries.filter((e) => e.status === 'REVIEWED').length, color: 'var(--color-success)' },
          { label: 'ERRORS', value: demoEntries.filter((e) => e.status === 'ERROR').length, color: 'var(--color-danger)' },
        ].map((stat) => (
          <div key={stat.label} style={{ textAlign: 'center' }}>
            <div className="section-header" style={{ marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {demoEntries.map((entry) => (
          <div
            key={entry.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              backgroundColor: 'var(--color-bg-surface)',
              borderRadius: 'var(--radius)',
              transition: 'background-color var(--transition)',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)')
            }
          >
            {getStatusIcon(entry.status)}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {entry.filename}
              </div>
              {entry.errors && entry.errors.length > 0 && (
                <div style={{ fontSize: 9, color: 'var(--color-danger)', marginTop: 1 }}>
                  {entry.errors[0]}
                </div>
              )}
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--color-text-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {entry.records > 0 ? `${entry.records} rec` : '-'}
            </span>
            <StatusDot status={getStatusDot(entry.status)} size={6} />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--color-text-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {formatRelativeTime(entry.uploadedAt)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
