import { useState, useCallback } from 'react';
import { Zap, Loader, FileText } from 'lucide-react';
import Card from '@/components/ui/Card';
import { ReportType } from '@/lib/types';
import type { Report, ReportContent, GenerateReportParams } from '@/lib/types';
import {
  generateReport,
  generateSitrep,
  generatePerstat,
  generateSpotrep,
  generateRollup,
} from '@/api/reports';
import { useReportStore } from '@/stores/reportStore';

type QuickReportType =
  | 'LOGSTAT'
  | 'SITREP'
  | 'PERSTAT'
  | 'SPOTREP'
  | 'EQUIPMENT'
  | 'MAINTENANCE'
  | 'ROLLUP';

const QUICK_REPORT_TYPES: { type: QuickReportType; label: string; desc: string }[] = [
  { type: 'LOGSTAT', label: 'LOGSTAT', desc: 'Supply, equipment, maintenance summary' },
  { type: 'SITREP', label: 'SITREP', desc: 'Situation report with all sections' },
  { type: 'PERSTAT', label: 'PERSTAT', desc: 'Personnel status and strength' },
  { type: 'SPOTREP', label: 'SPOTREP', desc: 'Spot report for immediate events' },
  { type: 'EQUIPMENT', label: 'EQUIPMENT', desc: 'Fleet readiness and NMC breakdown' },
  { type: 'MAINTENANCE', label: 'MAINTENANCE', desc: 'Work orders, labor, parts status' },
  { type: 'ROLLUP', label: 'ROLLUP', desc: 'Aggregate subordinate unit reports' },
];

const UNIT_OPTIONS = [
  { value: 1, label: 'I MEF' },
  { value: 2, label: '1ST MARDIV' },
  { value: 3, label: '1ST MARINES' },
  { value: 4, label: '1/1 BN' },
  { value: 5, label: '2/1 BN' },
  { value: 6, label: '3/1 BN' },
];

const ROLLUP_TYPE_OPTIONS = [
  { value: 'SITREP', label: 'SITREP' },
  { value: 'LOGSTAT', label: 'LOGSTAT' },
  { value: 'PERSTAT', label: 'PERSTAT' },
];

export default function QuickGeneratePanel() {
  const [selectedType, setSelectedType] = useState<QuickReportType>('SITREP');
  const [unitId, setUnitId] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  // SPOTREP fields
  const [spotrepTitle, setSpotrepTitle] = useState('');
  const [spotrepSituation, setSpotrepSituation] = useState('');

  // ROLLUP fields
  const [rollupType, setRollupType] = useState('SITREP');

  const { addReport, setSelectedReport } = useReportStore();

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedContent(null);
    try {
      let report: Report;

      switch (selectedType) {
        case 'SITREP':
          report = await generateSitrep(unitId, 24);
          break;
        case 'PERSTAT':
          report = await generatePerstat(unitId);
          break;
        case 'SPOTREP':
          if (!spotrepTitle || !spotrepSituation) {
            setError('SPOTREP requires title and situation text');
            setIsGenerating(false);
            return;
          }
          report = await generateSpotrep(unitId, {
            title: spotrepTitle,
            situation_text: spotrepSituation,
          });
          break;
        case 'ROLLUP':
          report = await generateRollup(unitId, rollupType);
          break;
        default: {
          // Use the standard generate API for LOGSTAT, EQUIPMENT, MAINTENANCE
          const typeMap: Record<string, ReportType> = {
            LOGSTAT: ReportType.LOGSTAT,
            EQUIPMENT: ReportType.EQUIPMENT_STATUS,
            MAINTENANCE: ReportType.MAINTENANCE_SUMMARY,
          };
          const now = new Date();
          const weekAgo = new Date(now.getTime() - 7 * 86400000);
          const params: GenerateReportParams = {
            type: typeMap[selectedType] || ReportType.LOGSTAT,
            unitId: String(unitId),
            dateRange: {
              start: weekAgo.toISOString(),
              end: now.toISOString(),
            },
          };
          report = await generateReport(params);
          // Parse content if needed
          if (report.content && !report.parsedContent) {
            try {
              report.parsedContent = JSON.parse(report.content) as ReportContent;
            } catch {
              // content is plaintext
            }
          }
          break;
        }
      }

      addReport(report);
      setSelectedReport(report);
      setGeneratedContent(report.content || JSON.stringify(report.parsedContent, null, 2) || 'Report generated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedType, unitId, spotrepTitle, spotrepSituation, rollupType, addReport, setSelectedReport]);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--color-text)',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: 'var(--color-text-muted)',
    display: 'block',
    marginBottom: 3,
  };

  return (
    <Card
      title="QUICK GENERATE"
      headerRight={<Zap size={14} className="text-[var(--color-amber, #f59e0b)]" />}
    >
      <div className="flex flex-col gap-3.5">
        {/* Report type grid */}
        <div>
          <label style={labelStyle}>REPORT TYPE</label>
          <div
            className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}
          >
            {QUICK_REPORT_TYPES.map((rt) => (
              <button
                key={rt.type}
                onClick={() => setSelectedType(rt.type)}
                className="py-2 px-2.5 rounded-[var(--radius)] cursor-pointer text-left" style={{ backgroundColor: selectedType === rt.type
                      ? 'rgba(59,130,246,0.12)'
                      : 'var(--color-bg)', border: selectedType === rt.type
                      ? '1px solid var(--color-accent)'
                      : '1px solid var(--color-border)', transition: 'all var(--transition)' }}
              >
                <div
                  className="font-[var(--font-mono)] text-[10px] font-bold tracking-[1px]" style={{ color: selectedType === rt.type
                        ? 'var(--color-accent)'
                        : 'var(--color-text-bright)' }}
                >
                  {rt.label}
                </div>
                <div
                  className="font-[var(--font-mono)] text-[8px] text-[var(--color-text-muted)] mt-0.5 leading-[1.3]"
                >
                  {rt.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Unit selector */}
        <div>
          <label style={labelStyle}>UNIT</label>
          <select
            value={unitId}
            onChange={(e) => setUnitId(Number(e.target.value))}
            style={inputStyle}
          >
            {UNIT_OPTIONS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        {/* SPOTREP fields */}
        {selectedType === 'SPOTREP' && (
          <>
            <div>
              <label style={labelStyle}>SPOTREP TITLE</label>
              <input
                value={spotrepTitle}
                onChange={(e) => setSpotrepTitle(e.target.value)}
                placeholder="Brief title for the spot report"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>SITUATION TEXT</label>
              <textarea
                value={spotrepSituation}
                onChange={(e) => setSpotrepSituation(e.target.value)}
                placeholder="Describe the situation..."
                rows={3}
                className="min-h-[50px]"
              />
            </div>
          </>
        )}

        {/* ROLLUP type selector */}
        {selectedType === 'ROLLUP' && (
          <div>
            <label style={labelStyle}>ROLLUP REPORT TYPE</label>
            <select
              value={rollupType}
              onChange={(e) => setRollupType(e.target.value)}
              style={inputStyle}
            >
              {ROLLUP_TYPE_OPTIONS.map((rt) => (
                <option key={rt.value} value={rt.value}>
                  {rt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="font-[var(--font-mono)] text-[10px] text-[var(--color-red, #ff4444)] py-1.5 px-2 bg-[rgba(255,68,68,0.08)] rounded-[var(--radius)] border border-[rgba(255,68,68,0.2)]"
          >
            {error}
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full border-0 rounded-[var(--radius)] text-[var(--color-bg)] font-[var(--font-mono)] text-xs font-semibold tracking-[2px] uppercase flex items-center justify-center gap-2" style={{ padding: '10px', backgroundColor: isGenerating ? 'var(--color-muted)' : 'var(--color-accent)', cursor: isGenerating ? 'not-allowed' : 'pointer', transition: 'opacity var(--transition)' }}
        >
          {isGenerating ? (
            <>
              <Loader size={14} className="animate-spin" />
              GENERATING...
            </>
          ) : (
            <>
              <Zap size={14} />
              GENERATE {selectedType}
            </>
          )}
        </button>

        {/* Generated content preview */}
        {generatedContent && (
          <div>
            <div
              className="flex items-center gap-1.5 mb-1.5"
            >
              <FileText size={12} className="text-[var(--color-green, #22c55e)]" />
              <span
                className="font-[var(--font-mono)] text-[9px] font-semibold text-[var(--color-green, #22c55e)] tracking-[1px] uppercase"
              >
                REPORT GENERATED - VIEW IN REPORTS TAB
              </span>
            </div>
            <pre
              className="font-[var(--font-mono)] text-[10px] leading-normal text-[var(--color-text)] whitespace-pre-wrap p-2.5 bg-[var(--color-bg)] rounded-[var(--radius)] border border-[var(--color-border)] max-h-[300px] overflow-auto"
            >
              {generatedContent}
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
}
