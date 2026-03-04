import { useState, useCallback } from 'react';
import { FileText, Loader } from 'lucide-react';
import Card from '@/components/ui/Card';
import { ReportType } from '@/lib/types';
import type { GenerateReportParams, ReportContent } from '@/lib/types';
import { generateReport } from '@/api/reports';
import { useReportStore } from '@/stores/reportStore';

const reportTypes = [
  { value: ReportType.LOGSTAT, label: 'LOGSTAT', desc: 'Supply, equipment, maintenance, movements, personnel' },
  { value: ReportType.READINESS, label: 'READINESS', desc: 'MC/NMC rates, individual status, deadlined items' },
  { value: ReportType.SUPPLY_STATUS, label: 'SUPPLY STATUS', desc: 'All classes with on-hand, DOS, critical items' },
  { value: ReportType.EQUIPMENT_STATUS, label: 'EQUIPMENT STATUS', desc: 'Fleet readiness, FMC/NMC breakdown, top faults' },
  { value: ReportType.MAINTENANCE_SUMMARY, label: 'MAINTENANCE', desc: 'WO counts, avg completion, parts, labor hours' },
  { value: ReportType.MOVEMENT_SUMMARY, label: 'MOVEMENTS', desc: 'Active/planned/completed, vehicles in transit' },
  { value: ReportType.PERSONNEL_STRENGTH, label: 'PERSONNEL', desc: 'Assigned vs active, by rank and MOS' },
];

const units = [
  { value: '1', label: 'I MEF' },
  { value: '2', label: '1ST MARDIV' },
  { value: '3', label: '1ST MARINES' },
  { value: '4', label: '1/1 BN' },
  { value: '5', label: '2/1 BN' },
  { value: '6', label: '3/1 BN' },
];

export default function ReportGenerator() {
  const [reportType, setReportType] = useState(ReportType.LOGSTAT);
  const [unitId, setUnitId] = useState('3');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setSelectedReport, addReport } = useReportStore();

  const selectedTypeInfo = reportTypes.find((rt) => rt.value === reportType);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      const params: GenerateReportParams = {
        type: reportType,
        unitId,
        dateRange: {
          start: startDate || weekAgo.toISOString(),
          end: endDate || now.toISOString(),
        },
      };
      const report = await generateReport(params);
      // Parse content string into structured object if needed
      if (report.content && !report.parsedContent) {
        try {
          report.parsedContent = JSON.parse(report.content) as ReportContent;
        } catch {
          // content is plaintext, leave as-is
        }
      }
      addReport(report);
      setSelectedReport(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  }, [reportType, unitId, startDate, endDate, setSelectedReport, addReport]);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--color-text)',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: 'var(--color-text-muted)',
    display: 'block',
    marginBottom: 4,
  };

  return (
    <Card
      title="GENERATE REPORT"
      headerRight={<FileText size={14} style={{ color: 'var(--color-text-muted)' }} />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>REPORT TYPE</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            style={inputStyle}
          >
            {reportTypes.map((rt) => (
              <option key={rt.value} value={rt.value}>
                {rt.label}
              </option>
            ))}
          </select>
          {selectedTypeInfo && (
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--color-text-muted)',
              marginTop: 4,
              lineHeight: 1.4,
            }}>
              {selectedTypeInfo.desc}
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>UNIT</label>
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            style={inputStyle}
          >
            {units.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>START DATE</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>END DATE</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {error && (
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--color-red, #ff4444)',
            padding: '6px 8px',
            backgroundColor: 'rgba(255,68,68,0.08)',
            borderRadius: 'var(--radius)',
            border: '1px solid rgba(255,68,68,0.2)',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: isGenerating ? 'var(--color-muted)' : 'var(--color-accent)',
            border: 'none',
            borderRadius: 'var(--radius)',
            color: 'var(--color-bg)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'opacity var(--transition)',
          }}
        >
          {isGenerating ? (
            <>
              <Loader size={14} className="animate-spin" />
              GENERATING...
            </>
          ) : (
            'GENERATE REPORT'
          )}
        </button>
      </div>
    </Card>
  );
}
