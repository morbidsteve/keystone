import { useEffect, useState } from 'react';
import { FileText, Check, Download, Clock, User, FileDown, Send, X, Loader } from 'lucide-react';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import { ReportStatus, ReportType } from '@/lib/types';
import type { Report, ReportContent, ExportDestination, ApiExportResultItem } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { getReports, finalizeReport as apiFinalizeReport, exportReportPdf, getExportDestinations, exportReportToApi } from '@/api/reports';
import { useReportStore } from '@/stores/reportStore';

function getReportStatusColor(status: ReportStatus | string) {
  switch (status) {
    case ReportStatus.FINALIZED: return 'GREEN';
    case ReportStatus.READY: return 'AMBER';
    case ReportStatus.GENERATING: return 'AMBER';
    case ReportStatus.DRAFT: return 'AMBER';
    case ReportStatus.ERROR: return 'RED';
    default: return 'AMBER';
  }
}

function statusColor(s: string): string {
  switch (s) {
    case 'GREEN': return 'var(--color-green, #22c55e)';
    case 'AMBER': return 'var(--color-amber, #f59e0b)';
    case 'RED': return 'var(--color-red, #ef4444)';
    case 'BLACK': return '#fff';
    default: return 'var(--color-text-muted)';
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ReportViewer() {
  const { selectedReport, generatedReports, setSelectedReport, setReports, updateReport } = useReportStore();
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showApiExportModal, setShowApiExportModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const resp = await getReports();
        const fetched = resp.data || [];
        // Parse content for any that have it
        for (const r of fetched) {
          if (r.content && !r.parsedContent) {
            try { r.parsedContent = JSON.parse(r.content) as ReportContent; } catch { /* plain text */ }
          }
        }
        setReports(fetched);
        if (!selectedReport && fetched.length > 0) {
          setSelectedReport(fetched[0]);
        }
      } catch {
        // ignore load errors in demo mode
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const reports = generatedReports;

  const handleFinalize = async () => {
    if (!selectedReport) return;
    try {
      const updated = await apiFinalizeReport(selectedReport.id);
      updateReport(selectedReport.id, { status: updated.status || ReportStatus.FINALIZED });
    } catch {
      // Fallback for demo
      updateReport(selectedReport.id, { status: ReportStatus.FINALIZED });
    }
  };

  const handleExport = () => {
    if (!selectedReport) return;
    const text = selectedReport.content || JSON.stringify(selectedReport.parsedContent, null, 2) || '';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport.title.replace(/[^a-zA-Z0-9-_ ]/g, '') || 'report'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    if (!selectedReport) return;
    setPdfLoading(true);
    try {
      const blob = await exportReportPdf(selectedReport.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport.title.replace(/[^a-zA-Z0-9-_ ]/g, '') || 'report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silently fail in demo
    } finally {
      setPdfLoading(false);
    }
  };

  const exportBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
    backgroundColor: 'transparent',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius)',
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '1px', cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Report List */}
      <Card title="GENERATED REPORTS">
        {loading ? (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)', padding: 16, textAlign: 'center' }}>
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)', padding: 16, textAlign: 'center' }}>
            No reports generated yet. Use the panel on the left to generate one.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflow: 'auto' }}>
            {reports.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedReport(r)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  backgroundColor: r.id === selectedReport?.id ? 'var(--color-bg-hover)' : 'var(--color-bg-surface)',
                  border: r.id === selectedReport?.id ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                }}
              >
                <FileText size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-bright)', fontWeight: 600 }}>
                    {r.title}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', display: 'flex', gap: 8, marginTop: 2 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <User size={9} /> {r.generatedBy}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={9} /> {formatDate(r.generatedAt)}
                    </span>
                  </div>
                </div>
                <StatusBadge status={getReportStatusColor(r.status)} label={r.status} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Report Content */}
      {selectedReport && (
        <Card
          title={selectedReport.title}
          headerRight={
            <div style={{ display: 'flex', gap: 6 }}>
              {(selectedReport.status === ReportStatus.READY || selectedReport.status === ReportStatus.FINALIZED) && (
                <button
                  disabled={selectedReport.status === ReportStatus.FINALIZED}
                  onClick={handleFinalize}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                    backgroundColor: selectedReport.status === ReportStatus.FINALIZED ? 'var(--color-bg-surface)' : 'var(--color-accent)',
                    border: selectedReport.status === ReportStatus.FINALIZED ? '1px solid var(--color-border)' : 'none',
                    borderRadius: 'var(--radius)',
                    color: selectedReport.status === ReportStatus.FINALIZED ? 'var(--color-text-muted)' : 'var(--color-bg)',
                    fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '1px',
                    cursor: selectedReport.status === ReportStatus.FINALIZED ? 'not-allowed' : 'pointer',
                    opacity: selectedReport.status === ReportStatus.FINALIZED ? 0.5 : 1,
                  }}
                >
                  <Check size={10} /> FINALIZE
                </button>
              )}
              <button onClick={handleExportPdf} disabled={pdfLoading} style={exportBtnStyle}>
                {pdfLoading ? <Loader size={10} className="animate-spin" /> : <FileDown size={10} />}
                {pdfLoading ? 'GENERATING...' : 'EXPORT PDF'}
              </button>
              <button onClick={() => setShowApiExportModal(true)} style={exportBtnStyle}>
                <Send size={10} /> EXPORT TO API
              </button>
              <button onClick={handleExport} style={exportBtnStyle}>
                <Download size={10} /> EXPORT TXT
              </button>
            </div>
          }
        >
          {selectedReport.parsedContent
            ? <StructuredReportView content={selectedReport.parsedContent} reportType={selectedReport.type} />
            : selectedReport.content
              ? (
                <pre style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.6,
                  color: 'var(--color-text)', whiteSpace: 'pre-wrap', padding: 12,
                  backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius)',
                  border: '1px solid var(--color-border)', maxHeight: 500, overflow: 'auto',
                }}>
                  {selectedReport.content}
                </pre>
              )
              : (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)', padding: 16, textAlign: 'center' }}>
                  Report content is still generating...
                </div>
              )
          }
        </Card>
      )}

      {/* API Export Modal */}
      {showApiExportModal && selectedReport && (
        <ApiExportModal
          reportId={selectedReport.id}
          onClose={() => setShowApiExportModal(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// API Export Modal
// ---------------------------------------------------------------------------

function ApiExportModal({ reportId, onClose }: { reportId: string; onClose: () => void }) {
  const [destinations, setDestinations] = useState<ExportDestination[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<ApiExportResultItem[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const dests = await getExportDestinations();
        setDestinations(dests.filter((d) => d.is_active));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleDest = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0) return;
    setSending(true);
    try {
      const resp = await exportReportToApi(reportId, Array.from(selected));
      setResults(resp.results);
    } catch {
      setResults([]);
    } finally {
      setSending(false);
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)', padding: 20, minWidth: 400, maxWidth: 500,
    maxHeight: '80vh', overflow: 'auto',
  };

  const checkboxRowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
    backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius)',
    border: '1px solid var(--color-border)', cursor: 'pointer',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', color: 'var(--color-text-bright)' }}>
            EXPORT TO API
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', padding: 20 }}>
            Loading destinations...
          </div>
        ) : destinations.length === 0 ? (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', padding: 20 }}>
            No active export destinations configured.
          </div>
        ) : results ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
              EXPORT RESULTS
            </div>
            {results.map((r) => (
              <div key={r.destination_id} style={{
                ...checkboxRowStyle,
                borderColor: r.success ? 'var(--color-green, #22c55e)' : 'var(--color-red, #ef4444)',
                cursor: 'default',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  backgroundColor: r.success ? 'var(--color-green, #22c55e)' : 'var(--color-red, #ef4444)',
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-bright)', fontWeight: 600 }}>
                    {r.destination_name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)' }}>
                    {r.success ? `Success (${r.status_code})` : `Failed: ${r.error || 'Unknown error'}`}
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={onClose}
              style={{
                marginTop: 8, padding: '8px 16px', backgroundColor: 'var(--color-accent)',
                border: 'none', borderRadius: 'var(--radius)', color: 'var(--color-bg)',
                fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1px', cursor: 'pointer',
              }}
            >
              CLOSE
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
              SELECT DESTINATIONS
            </div>
            {destinations.map((d) => (
              <div key={d.id} style={checkboxRowStyle} onClick={() => toggleDest(d.id)}>
                <input
                  type="checkbox"
                  checked={selected.has(d.id)}
                  onChange={() => toggleDest(d.id)}
                  style={{ accentColor: 'var(--color-accent)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-bright)', fontWeight: 600 }}>
                    {d.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)' }}>
                    {d.url}
                  </div>
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 8, padding: '2px 6px',
                  borderRadius: 'var(--radius)', backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)', color: 'var(--color-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  {d.auth_type}
                </div>
              </div>
            ))}
            <button
              onClick={handleSend}
              disabled={selected.size === 0 || sending}
              style={{
                marginTop: 8, padding: '8px 16px',
                backgroundColor: selected.size === 0 || sending ? 'var(--color-bg-surface)' : 'var(--color-accent)',
                border: selected.size === 0 || sending ? '1px solid var(--color-border)' : 'none',
                borderRadius: 'var(--radius)',
                color: selected.size === 0 || sending ? 'var(--color-text-muted)' : 'var(--color-bg)',
                fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1px',
                cursor: selected.size === 0 || sending ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {sending ? <><Loader size={12} className="animate-spin" /> SENDING...</> : <><Send size={12} /> SEND TO {selected.size} DESTINATION{selected.size !== 1 ? 'S' : ''}</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Structured report renderer — type-specific sections
// ---------------------------------------------------------------------------

function StructuredReportView({ content, reportType }: { content: ReportContent; reportType: ReportType | string }) {
  const containerStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: 16, padding: 12,
    backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius)',
    border: '1px solid var(--color-border)', maxHeight: 600, overflow: 'auto',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <ReportHeader content={content} />

      {/* Type-specific sections */}
      {(reportType === ReportType.LOGSTAT || reportType === 'LOGSTAT') && <LogstatSection content={content} />}
      {(reportType === ReportType.READINESS || reportType === 'READINESS') && <ReadinessSection content={content} />}
      {(reportType === ReportType.SUPPLY_STATUS || reportType === 'SUPPLY_STATUS') && <SupplyStatusSection content={content} />}
      {(reportType === ReportType.EQUIPMENT_STATUS || reportType === 'EQUIPMENT_STATUS') && <EquipmentStatusSection content={content} />}
      {(reportType === ReportType.MAINTENANCE_SUMMARY || reportType === 'MAINTENANCE_SUMMARY') && <MaintenanceSection content={content} />}
      {(reportType === ReportType.MOVEMENT_SUMMARY || reportType === 'MOVEMENT_SUMMARY') && <MovementSection content={content} />}
      {(reportType === ReportType.PERSONNEL_STRENGTH || reportType === 'PERSONNEL_STRENGTH') && <PersonnelSection content={content} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '1.5px',
  color: 'var(--color-accent)', marginBottom: 8, borderBottom: '1px solid var(--color-border)',
  paddingBottom: 4,
};

const statBoxStyle: React.CSSProperties = {
  padding: '8px 12px', backgroundColor: 'var(--color-bg-surface)',
  borderRadius: 'var(--radius)', border: '1px solid var(--color-border)',
  textAlign: 'center',
};

const statValueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--color-text-bright)',
};

const statLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 8, textTransform: 'uppercase',
  letterSpacing: '1px', color: 'var(--color-text-muted)', marginTop: 2,
};

const tableStyle: React.CSSProperties = {
  width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 10,
};

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--color-border)',
  fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '1px',
  color: 'var(--color-text-muted)',
};

const tdStyle: React.CSSProperties = {
  padding: '6px 8px', borderBottom: '1px solid var(--color-border)',
  color: 'var(--color-text)',
};

function ReportHeader({ content }: { content: ReportContent }) {
  return (
    <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--color-text-bright)' }}>
        {content.report_type} REPORT
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)', display: 'flex', gap: 16, marginTop: 4 }}>
        {content.unit && <span>Unit: {content.unit.name} ({content.unit.abbreviation})</span>}
        {content.generated_at && <span>Generated: {formatDate(content.generated_at)}</span>}
      </div>
    </div>
  );
}

// --- LOGSTAT ---
function LogstatSection({ content }: { content: ReportContent }) {
  return (
    <>
      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        <StatBox value={`${content.equipment_readiness?.readiness_pct ?? 0}%`} label="EQUIP READINESS" color={statusColor(content.equipment_readiness?.status || '')} />
        <StatBox value={String(content.open_work_orders ?? 0)} label="OPEN WORK ORDERS" />
        <StatBox value={String(content.active_movements ?? 0)} label="ACTIVE MOVEMENTS" />
        <StatBox value={String(content.personnel_strength ?? 0)} label="PERSONNEL" />
        <StatBox value={String(content.total_supply_items ?? 0)} label="SUPPLY ITEMS" />
      </div>

      {/* Supply status by class */}
      {content.supply_status && content.supply_status.length > 0 && (
        <div>
          <div style={sectionTitleStyle}>SUPPLY STATUS BY CLASS</div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>CLASS</th>
                <th style={thStyle}>NAME</th>
                <th style={thStyle}>ITEMS</th>
                <th style={thStyle}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {content.supply_status.map((s) => (
                <tr key={s.class}>
                  <td style={tdStyle}>{s.class}</td>
                  <td style={tdStyle}>{s.class_name}</td>
                  <td style={tdStyle}>{s.items.length}</td>
                  <td style={tdStyle}>
                    <span style={{ color: statusColor(s.overall_status || ''), fontWeight: 600 }}>
                      {s.overall_status || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// --- READINESS ---
function ReadinessSection({ content }: { content: ReportContent }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <StatBox value={`${content.overall_readiness_pct ?? 0}%`} label="OVERALL READINESS" color={statusColor(content.overall_status || '')} />
        <StatBox value={String(content.total_possessed ?? 0)} label="TOTAL POSSESSED" />
        <StatBox value={String(content.total_mission_capable ?? 0)} label="MISSION CAPABLE" />
        <StatBox value={String(content.total_nmc ?? 0)} label="NOT MC" />
      </div>

      {content.equipment_types && content.equipment_types.length > 0 && (
        <div>
          <div style={sectionTitleStyle}>EQUIPMENT BY TYPE</div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>TAMCN</th>
                <th style={thStyle}>NOMENCLATURE</th>
                <th style={thStyle}>POSS</th>
                <th style={thStyle}>MC</th>
                <th style={thStyle}>NMC-M</th>
                <th style={thStyle}>NMC-S</th>
                <th style={thStyle}>RATE</th>
                <th style={thStyle}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {content.equipment_types.map((e) => (
                <tr key={e.tamcn}>
                  <td style={tdStyle}>{e.tamcn}</td>
                  <td style={tdStyle}>{e.nomenclature}</td>
                  <td style={tdStyle}>{e.total_possessed}</td>
                  <td style={tdStyle}>{e.mission_capable}</td>
                  <td style={tdStyle}>{e.nmc_maintenance ?? '-'}</td>
                  <td style={tdStyle}>{e.nmc_supply ?? '-'}</td>
                  <td style={tdStyle}>{e.readiness_pct}%</td>
                  <td style={tdStyle}><span style={{ color: statusColor(e.status), fontWeight: 600 }}>{e.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {content.individual_status_breakdown && (
        <div>
          <div style={sectionTitleStyle}>INDIVIDUAL EQUIPMENT STATUS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {Object.entries(content.individual_status_breakdown).map(([s, count]) => (
              <StatBox key={s} value={String(count)} label={s} />
            ))}
          </div>
        </div>
      )}

      {content.deadlined_items && content.deadlined_items.length > 0 && (
        <div>
          <div style={sectionTitleStyle}>DEADLINED ITEMS</div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>BUMPER</th>
                <th style={thStyle}>TYPE</th>
                <th style={thStyle}>TAMCN</th>
              </tr>
            </thead>
            <tbody>
              {content.deadlined_items.map((d, i) => (
                <tr key={i}>
                  <td style={tdStyle}>{d.bumper_number}</td>
                  <td style={tdStyle}>{d.equipment_type}</td>
                  <td style={tdStyle}>{d.tamcn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// --- SUPPLY_STATUS ---
function SupplyStatusSection({ content }: { content: ReportContent }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <StatBox
          value={content.overall_health || 'N/A'}
          label="OVERALL HEALTH"
          color={statusColor(content.overall_health || '')}
        />
        <StatBox value={String(content.total_classes_tracked ?? 0)} label="CLASSES TRACKED" />
        <StatBox value={String(content.red_classes ?? 0)} label="RED CLASSES" color={statusColor('RED')} />
        <StatBox value={String(content.amber_classes ?? 0)} label="AMBER CLASSES" color={statusColor('AMBER')} />
      </div>

      {content.class_summaries && content.class_summaries.length > 0 && (
        <div>
          <div style={sectionTitleStyle}>SUPPLY CLASS BREAKDOWN</div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>CLASS</th>
                <th style={thStyle}>NAME</th>
                <th style={thStyle}>ON HAND</th>
                <th style={thStyle}>REQUIRED</th>
                <th style={thStyle}>FILL %</th>
                <th style={thStyle}>AVG DOS</th>
                <th style={thStyle}>RED</th>
                <th style={thStyle}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {content.class_summaries.map((c) => (
                <tr key={c.supply_class}>
                  <td style={tdStyle}>{c.supply_class}</td>
                  <td style={tdStyle}>{c.class_name}</td>
                  <td style={tdStyle}>{c.total_on_hand.toLocaleString()}</td>
                  <td style={tdStyle}>{c.total_required.toLocaleString()}</td>
                  <td style={tdStyle}>{c.fill_rate_pct}%</td>
                  <td style={tdStyle}>{c.avg_dos}</td>
                  <td style={tdStyle}>{c.red_items}</td>
                  <td style={tdStyle}><span style={{ color: statusColor(c.status), fontWeight: 600 }}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Critical items */}
      {content.class_summaries?.some((c) => c.critical_items.length > 0) && (
        <div>
          <div style={sectionTitleStyle}>CRITICAL ITEMS (RED STATUS)</div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>CLASS</th>
                <th style={thStyle}>ITEM</th>
                <th style={thStyle}>ON HAND</th>
                <th style={thStyle}>REQUIRED</th>
                <th style={thStyle}>DOS</th>
              </tr>
            </thead>
            <tbody>
              {content.class_summaries?.filter((c) => c.critical_items.length > 0).flatMap((c) =>
                c.critical_items.map((ci, i) => (
                  <tr key={`${c.supply_class}-${i}`}>
                    <td style={tdStyle}>{c.supply_class}</td>
                    <td style={tdStyle}>{ci.item}</td>
                    <td style={tdStyle}>{ci.on_hand}</td>
                    <td style={tdStyle}>{ci.required}</td>
                    <td style={{ ...tdStyle, color: statusColor('RED'), fontWeight: 600 }}>{ci.dos}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// --- EQUIPMENT_STATUS ---
function EquipmentStatusSection({ content }: { content: ReportContent }) {
  return (
    <>
      {content.fleet_readiness && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          <StatBox value={`${content.fleet_readiness.readiness_pct}%`} label="FLEET READINESS" color={statusColor(content.fleet_readiness.status)} />
          <StatBox value={String(content.fleet_readiness.total_possessed)} label="TOTAL POSSESSED" />
          <StatBox value={String(content.fleet_readiness.total_mission_capable)} label="MISSION CAPABLE" />
          <StatBox value={String(content.fleet_readiness.total_nmc_maintenance)} label="NMC-M" />
          <StatBox value={String(content.fleet_readiness.total_nmc_supply)} label="NMC-S" />
        </div>
      )}

      {content.fleet_by_type && content.fleet_by_type.length > 0 && (
        <div>
          <div style={sectionTitleStyle}>FLEET BY TYPE</div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>TAMCN</th>
                <th style={thStyle}>NOMENCLATURE</th>
                <th style={thStyle}>POSS</th>
                <th style={thStyle}>MC</th>
                <th style={thStyle}>NMC-M</th>
                <th style={thStyle}>NMC-S</th>
                <th style={thStyle}>RATE</th>
                <th style={thStyle}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {content.fleet_by_type.map((e) => (
                <tr key={e.tamcn}>
                  <td style={tdStyle}>{e.tamcn}</td>
                  <td style={tdStyle}>{e.nomenclature}</td>
                  <td style={tdStyle}>{e.total_possessed}</td>
                  <td style={tdStyle}>{e.mission_capable}</td>
                  <td style={tdStyle}>{e.nmc_maintenance ?? '-'}</td>
                  <td style={tdStyle}>{e.nmc_supply ?? '-'}</td>
                  <td style={tdStyle}>{e.readiness_pct}%</td>
                  <td style={tdStyle}><span style={{ color: statusColor(e.status), fontWeight: 600 }}>{e.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {content.individual_status_breakdown && (
        <div>
          <div style={sectionTitleStyle}>INDIVIDUAL EQUIPMENT STATUS ({content.individual_total ?? 0} total)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {Object.entries(content.individual_status_breakdown).map(([s, count]) => (
              <StatBox key={s} value={String(count)} label={s} />
            ))}
          </div>
        </div>
      )}

      {content.top_deadlined_items && content.top_deadlined_items.length > 0 && (
        <div>
          <div style={sectionTitleStyle}>TOP DEADLINED ITEMS</div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>BUMPER</th>
                <th style={thStyle}>TYPE</th>
                <th style={thStyle}>TAMCN</th>
                <th style={thStyle}>FAULT</th>
                <th style={thStyle}>SEVERITY</th>
              </tr>
            </thead>
            <tbody>
              {content.top_deadlined_items.map((d, i) => (
                <tr key={i}>
                  <td style={tdStyle}>{d.bumper_number}</td>
                  <td style={tdStyle}>{d.equipment_type}</td>
                  <td style={tdStyle}>{d.tamcn}</td>
                  <td style={tdStyle}>{d.fault || 'N/A'}</td>
                  <td style={tdStyle}>{d.fault_severity || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// --- MAINTENANCE_SUMMARY ---
function MaintenanceSection({ content }: { content: ReportContent }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <StatBox value={String(content.total_work_orders ?? 0)} label="TOTAL WORK ORDERS" />
        <StatBox value={`${content.avg_completion_time_hours ?? 0}h`} label="AVG COMPLETION" />
        <StatBox value={String(content.total_labor_hours ?? 0)} label="LABOR HOURS" />
        <StatBox value={String(content.parts_on_order ?? 0)} label="PARTS ON ORDER" />
      </div>

      {content.work_order_counts && (
        <div>
          <div style={sectionTitleStyle}>WORK ORDER STATUS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {Object.entries(content.work_order_counts).map(([status, count]) => (
              <StatBox key={status} value={String(count)} label={status.replace(/_/g, ' ')} />
            ))}
          </div>
        </div>
      )}

      {content.top_issues && content.top_issues.length > 0 && (
        <div>
          <div style={sectionTitleStyle}>TOP MAINTENANCE ISSUES</div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>EQUIPMENT TYPE</th>
                <th style={thStyle}>OPEN WOs</th>
              </tr>
            </thead>
            <tbody>
              {content.top_issues.map((issue, i) => (
                <tr key={i}>
                  <td style={tdStyle}>{issue.equipment_type}</td>
                  <td style={tdStyle}>{issue.open_work_orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// --- MOVEMENT_SUMMARY ---
function MovementSection({ content }: { content: ReportContent }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <StatBox value={String(content.total_movements ?? 0)} label="TOTAL MOVEMENTS" />
        <StatBox value={String(content.total_vehicles_in_transit ?? 0)} label="VEHICLES IN TRANSIT" />
        <StatBox value={String(content.total_personnel_in_transit ?? 0)} label="PERSONNEL IN TRANSIT" />
        <StatBox
          value={String(content.status_counts?.EN_ROUTE ?? 0)}
          label="EN ROUTE"
        />
      </div>

      {content.status_counts && (
        <div>
          <div style={sectionTitleStyle}>MOVEMENT STATUS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {Object.entries(content.status_counts).map(([status, count]) => (
              <StatBox key={status} value={String(count)} label={status.replace(/_/g, ' ')} />
            ))}
          </div>
        </div>
      )}

      {content.recent_completions && content.recent_completions.length > 0 && (
        <div>
          <div style={sectionTitleStyle}>RECENT COMPLETIONS</div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>CONVOY</th>
                <th style={thStyle}>ORIGIN</th>
                <th style={thStyle}>DEST</th>
                <th style={thStyle}>VEHICLES</th>
                <th style={thStyle}>ARRIVAL</th>
              </tr>
            </thead>
            <tbody>
              {content.recent_completions.map((c, i) => (
                <tr key={i}>
                  <td style={tdStyle}>{c.convoy_id || 'N/A'}</td>
                  <td style={tdStyle}>{c.origin}</td>
                  <td style={tdStyle}>{c.destination}</td>
                  <td style={tdStyle}>{c.vehicle_count}</td>
                  <td style={tdStyle}>{c.arrival ? formatDate(c.arrival) : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// --- PERSONNEL_STRENGTH ---
function PersonnelSection({ content }: { content: ReportContent }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <StatBox value={String(content.total_assigned ?? 0)} label="TOTAL ASSIGNED" />
        <StatBox value={String(content.total_active ?? 0)} label="ACTIVE" color={statusColor('GREEN')} />
        <StatBox
          value={String((content.total_assigned ?? 0) - (content.total_active ?? 0))}
          label="INACTIVE"
        />
      </div>

      {content.status_breakdown && (
        <div>
          <div style={sectionTitleStyle}>STATUS BREAKDOWN</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {Object.entries(content.status_breakdown).map(([status, count]) => (
              <StatBox key={status} value={String(count)} label={status} />
            ))}
          </div>
        </div>
      )}

      {content.rank_breakdown && Object.keys(content.rank_breakdown).length > 0 && (
        <div>
          <div style={sectionTitleStyle}>BY RANK</div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>RANK</th>
                <th style={thStyle}>COUNT</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(content.rank_breakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([rank, count]) => (
                  <tr key={rank}>
                    <td style={tdStyle}>{rank}</td>
                    <td style={tdStyle}>{count}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {content.mos_breakdown && Object.keys(content.mos_breakdown).length > 0 && (
        <div>
          <div style={sectionTitleStyle}>BY MOS</div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>MOS</th>
                <th style={thStyle}>COUNT</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(content.mos_breakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([mos, count]) => (
                  <tr key={mos}>
                    <td style={tdStyle}>{mos}</td>
                    <td style={tdStyle}>{count}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// --- StatBox helper ---
function StatBox({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div style={statBoxStyle}>
      <div style={{ ...statValueStyle, color: color || statValueStyle.color, fontSize: value.length > 4 ? 16 : 20 }}>
        {value}
      </div>
      <div style={statLabelStyle}>{label}</div>
    </div>
  );
}
