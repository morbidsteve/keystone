import { AlertTriangle, Check, Save } from 'lucide-react';
import type { MappingPreviewRow } from '@/api/schemaMapping';
import type { ColumnMapping } from './types';
import { thStyle, tdStyle, primaryBtnStyle, secondaryBtnStyle } from './types';

interface DataPreviewProps {
  previewRows: MappingPreviewRow[];
  stats: { total: number; success: number; errors: number };
  mappings: ColumnMapping[];
  onBack: () => void;
  onNext: () => void;
}

export default function DataPreview({
  previewRows,
  stats,
  mappings,
  onBack,
  onNext,
}: DataPreviewProps) {
  return (
    <div>
      {/* Stats */}
      <div
        className="grid gap-3 mb-4 grid-cols-3"
      >
        {[
          { label: 'TOTAL ROWS', value: stats.total, color: 'var(--color-text-bright)' },
          { label: 'SUCCESSFUL', value: stats.success, color: 'var(--color-success)' },
          { label: 'ERRORS', value: stats.errors, color: stats.errors > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)' },
        ].map((s) => (
          <div key={s.label} className="text-center bg-[var(--color-bg-surface)] rounded-[var(--radius)] border border-[var(--color-border)]" style={{ padding: '10px' }}>
            <div className="section-header mb-1">{s.label}</div>
            <div className="font-[var(--font-mono)] text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Preview table */}
      <div className="overflow-x-auto mb-4">
        <table
          className="w-full border-collapse font-[var(--font-mono)] text-[10px]"
        >
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 30 }}>#</th>
              {mappings.map((m) => (
                <th key={m.sourceColumn} style={thStyle}>
                  <div className="text-[var(--color-text-muted)] mb-0.5">{m.sourceColumn}</div>
                  <div className="text-[var(--color-accent)] text-[9px]">
                    {m.targetField}
                  </div>
                </th>
              ))}
              <th style={thStyle}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {previewRows.slice(0, 10).map((row, idx) => (
              <tr key={idx}>
                <td style={tdStyle}>{idx + 1}</td>
                {mappings.map((m) => {
                  const mappedKey = `${m.targetEntity}.${m.targetField}`;
                  const value = row.mapped[mappedKey];
                  return (
                    <td key={m.sourceColumn} style={tdStyle}>
                      <span className="text-[var(--color-text-bright)]">
                        {value !== undefined && value !== null ? String(value) : '-'}
                      </span>
                    </td>
                  );
                })}
                <td style={tdStyle}>
                  {row.errors.length > 0 ? (
                    <span className="text-[var(--color-danger)]">
                      <AlertTriangle size={10} className="align-middle mr-[3px]" />
                      {row.errors[0]}
                    </span>
                  ) : (
                    <Check size={10} className="text-[var(--color-success)]" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button onClick={onBack} style={secondaryBtnStyle}>BACK TO MAPPING</button>
        <button onClick={onNext} style={primaryBtnStyle}>
          <Save size={12} /> SAVE AS TEMPLATE
        </button>
      </div>
    </div>
  );
}
