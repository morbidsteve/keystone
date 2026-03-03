import { useState } from 'react';
import { FileText, Loader } from 'lucide-react';
import Card from '@/components/ui/Card';
import { ReportType } from '@/lib/types';

const reportTypes = [
  { value: ReportType.LOGSTAT, label: 'LOGSTAT' },
  { value: ReportType.READINESS, label: 'READINESS REPORT' },
  { value: ReportType.SUPPLY_STATUS, label: 'SUPPLY STATUS' },
  { value: ReportType.EQUIPMENT_STATUS, label: 'EQUIPMENT STATUS' },
  { value: ReportType.MOVEMENT_SUMMARY, label: 'MOVEMENT SUMMARY' },
  { value: ReportType.CUSTOM, label: 'CUSTOM REPORT' },
];

const units = [
  { value: '1mar', label: '1ST MAR' },
  { value: '1-1', label: '1/1 BN' },
  { value: '2-1', label: '2/1 BN' },
  { value: '3-1', label: '3/1 BN' },
  { value: 'clb-1', label: 'CLB-1' },
];

export default function ReportGenerator() {
  const [reportType, setReportType] = useState(ReportType.LOGSTAT);
  const [unitId, setUnitId] = useState('1mar');
  const [startDate, setStartDate] = useState('2026-03-01');
  const [endDate, setEndDate] = useState('2026-03-03');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate generation
    setTimeout(() => setIsGenerating(false), 2000);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--color-text)',
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
