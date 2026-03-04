import { useState } from 'react';
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
    content: `READINESS REPORT
============================
DTG: 021800Z MAR 2026
UNIT: 1ST BATTALION, 1ST MARINES
CLASSIFICATION: UNCLASSIFIED

1. PERSONNEL STRENGTH
   T/O: 850    Assigned: 812    Available: 784
   Deployable: 91.2%

2. EQUIPMENT READINESS
   Overall: 82%
   HMMWV M1151:  36/42 MC (86%)
   MTVR MK23:    14/18 MC (78%)
   LAV-25:       15/16 MC (94%)
   AAV-7A1:      8/12 MC (67%) ***BELOW THRESHOLD***

3. TRAINING STATUS
   BN Readiness: T-2 (Mission Capable)
   Last FEX: 15 FEB 2026
   Next scheduled: 20 MAR 2026

4. MAINTENANCE ISSUES
   - 4x AAV awaiting depot-level repair (ETA 10 MAR)
   - 2x MTVR engine replacement in progress
   - 1x HMMWV turret mechanism failure (parts on order)

5. COMMANDER ASSESSMENT
   BN maintains mission-capable status. CL V shortage
   and AAV readiness degradation are primary concerns.
   Requesting priority on AAV parts allocation.`,
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
  const [reports, setReports] = useState<Report[]>(demoReports);
  const [selectedReport, setSelectedReport] = useState<Report>(report || demoReports[0]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Report List */}
      <Card title="GENERATED REPORTS">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {reports.map((r) => (
            <div
              key={r.id}
              onClick={() => setSelectedReport(r)}
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
              {(selectedReport.status === ReportStatus.READY ||
                selectedReport.status === ReportStatus.FINALIZED) && (
                <button
                  disabled={selectedReport.status === ReportStatus.FINALIZED}
                  onClick={() => {
                    const updated = reports.map((r) =>
                      r.id === selectedReport.id
                        ? { ...r, status: ReportStatus.FINALIZED, finalizedAt: new Date().toISOString(), finalizedBy: 'Demo User' }
                        : r,
                    );
                    setReports(updated);
                    const updatedReport = updated.find((r) => r.id === selectedReport.id);
                    if (updatedReport) setSelectedReport(updatedReport);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    backgroundColor:
                      selectedReport.status === ReportStatus.FINALIZED
                        ? 'var(--color-bg-surface)'
                        : 'var(--color-accent)',
                    border:
                      selectedReport.status === ReportStatus.FINALIZED
                        ? '1px solid var(--color-border)'
                        : 'none',
                    borderRadius: 'var(--radius)',
                    color:
                      selectedReport.status === ReportStatus.FINALIZED
                        ? 'var(--color-text-muted)'
                        : 'var(--color-bg)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: '1px',
                    cursor:
                      selectedReport.status === ReportStatus.FINALIZED ? 'not-allowed' : 'pointer',
                    opacity: selectedReport.status === ReportStatus.FINALIZED ? 0.5 : 1,
                  }}
                >
                  <Check size={10} /> FINALIZE
                </button>
              )}
              <button
                onClick={() => {
                  if (!selectedReport.content) return;
                  const blob = new Blob([selectedReport.content], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${selectedReport.title.replace(/[^a-zA-Z0-9-_ ]/g, '') || 'report'}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
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
