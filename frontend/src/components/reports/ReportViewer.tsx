import { FileText, Check, Download, Clock, User } from 'lucide-react';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import { ReportStatus, type Report } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface ReportViewerProps {
  report?: Report;
}

const demoReports: Report[] = [
  {
    id: '1',
    type: 'LOGSTAT' as never,
    title: 'LOGSTAT - 1ST MAR - 03 MAR 2026',
    unitId: '1mar',
    unitName: '1ST MAR',
    dateRange: { start: '2026-03-03', end: '2026-03-03' },
    status: ReportStatus.READY,
    content: `LOGISTICS STATUS REPORT
============================
DTG: 030800Z MAR 2026
UNIT: 1ST MARINE REGIMENT
CLASSIFICATION: UNCLASSIFIED

1. SUPPLY STATUS
   a. CL I  - GREEN (85%) - 8 DOS
   b. CL II - GREEN (88%) - 10 DOS
   c. CL III - AMBER (62%) - 4 DOS
   d. CL V  - RED (45%) - 2 DOS ***CRITICAL***
   e. CL VIII - GREEN (92%) - 14 DOS
   f. CL IX - AMBER (71%) - 5 DOS

2. EQUIPMENT READINESS
   Overall: 84%
   HMMWV: 87% (40/46 MC)
   MTVR:  75% (18/24 MC)
   LAV-25: 94% (15/16 MC)
   AAV:   67% (8/12 MC) ***BELOW THRESHOLD***

3. ACTIVE MOVEMENTS
   CONVOY ALPHA - EN ROUTE (ETA 1600L)
   CONVOY BRAVO - PLANNED (DEP 0600L 04MAR)

4. CRITICAL ITEMS
   - CL V resupply URGENT
   - AAV parts on backorder (48hr ETA)
   - CL III consumption rate exceeding projections`,
    generatedBy: 'sgt.jones',
    generatedAt: '2026-03-03T08:30:00Z',
  },
  {
    id: '2',
    type: 'READINESS' as never,
    title: 'READINESS - 1/1 BN - 02 MAR 2026',
    unitId: '1-1',
    unitName: '1/1 BN',
    dateRange: { start: '2026-03-02', end: '2026-03-02' },
    status: ReportStatus.FINALIZED,
    generatedBy: 'cpl.smith',
    generatedAt: '2026-03-02T18:00:00Z',
    finalizedAt: '2026-03-02T19:00:00Z',
    finalizedBy: 'lt.davis',
  },
  {
    id: '3',
    type: 'SUPPLY_STATUS' as never,
    title: 'SUPPLY STATUS - 2/1 BN',
    unitId: '2-1',
    unitName: '2/1 BN',
    dateRange: { start: '2026-03-01', end: '2026-03-03' },
    status: ReportStatus.GENERATING,
    generatedBy: 'cpl.smith',
    generatedAt: '2026-03-03T09:00:00Z',
  },
];

function getReportStatusColor(status: ReportStatus) {
  switch (status) {
    case ReportStatus.FINALIZED: return 'GREEN';
    case ReportStatus.READY: return 'AMBER';
    case ReportStatus.GENERATING: return 'AMBER';
    case ReportStatus.DRAFT: return 'AMBER';
    case ReportStatus.ERROR: return 'RED';
    default: return 'AMBER';
  }
}

export default function ReportViewer({ report }: ReportViewerProps) {
  const selectedReport = report || demoReports[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Report List */}
      <Card title="GENERATED REPORTS">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {demoReports.map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                backgroundColor:
                  r.id === selectedReport.id
                    ? 'var(--color-bg-hover)'
                    : 'var(--color-bg-surface)',
                border:
                  r.id === selectedReport.id
                    ? '1px solid var(--color-accent)'
                    : '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                transition: 'all var(--transition)',
              }}
            >
              <FileText size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--color-text-bright)',
                    fontWeight: 600,
                  }}
                >
                  {r.title}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    gap: 8,
                    marginTop: 2,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <User size={9} />
                    {r.generatedBy}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={9} />
                    {formatDate(r.generatedAt)}
                  </span>
                </div>
              </div>
              <StatusBadge status={getReportStatusColor(r.status)} label={r.status} />
            </div>
          ))}
        </div>
      </Card>

      {/* Report Content */}
      {selectedReport.content && (
        <Card
          title={selectedReport.title}
          headerRight={
            <div style={{ display: 'flex', gap: 6 }}>
              {selectedReport.status === ReportStatus.READY && (
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    backgroundColor: 'var(--color-accent)',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    color: 'var(--color-bg)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: '1px',
                    cursor: 'pointer',
                  }}
                >
                  <Check size={10} /> FINALIZE
                </button>
              )}
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  letterSpacing: '1px',
                  cursor: 'pointer',
                }}
              >
                <Download size={10} /> EXPORT
              </button>
            </div>
          }
        >
          <pre
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              lineHeight: 1.6,
              color: 'var(--color-text)',
              whiteSpace: 'pre-wrap',
              padding: 12,
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--color-border)',
              maxHeight: 500,
              overflow: 'auto',
            }}
          >
            {selectedReport.content}
          </pre>
        </Card>
      )}
    </div>
  );
}
