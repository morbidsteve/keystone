import { Check, X, Edit3 } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { ParsedRecord } from '@/lib/types';

const demoRecords: ParsedRecord[] = [
  {
    id: '1',
    rawDataId: 'raw-1',
    originalText: '<13:42:15> S4_OPS: 1/1 LOGSTAT - CL I on hand 2400 cases MRE, auth 3000, consuming 300/day',
    parsedFields: {
      unit: '1/1 BN',
      supplyClass: 'I',
      item: 'MRE',
      onHand: 2400,
      authorized: 3000,
      consumptionRate: 300,
    },
    confidence: 0.72,
    status: 'PENDING',
  },
  {
    id: '2',
    rawDataId: 'raw-1',
    originalText: '<13:43:01> S4_OPS: CL III - JP8 12K gal on hand, 20K auth, burning 3K/day, resupply ETA 48h',
    parsedFields: {
      unit: '1/1 BN',
      supplyClass: 'III',
      item: 'JP-8',
      onHand: 12000,
      authorized: 20000,
      consumptionRate: 3000,
    },
    confidence: 0.65,
    status: 'PENDING',
  },
  {
    id: '3',
    rawDataId: 'raw-2',
    originalText: '2/1 BN - 5.56 ball 45K rds on hand, 100K auth. Rate 22.5K/day. CRITICAL',
    parsedFields: {
      unit: '2/1 BN',
      supplyClass: 'V',
      item: '5.56mm Ball',
      onHand: 45000,
      authorized: 100000,
      consumptionRate: 22500,
    },
    confidence: 0.78,
    status: 'PENDING',
  },
];

function getConfidenceColor(conf: number) {
  if (conf >= 0.8) return 'var(--color-success)';
  if (conf >= 0.6) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

export default function ReviewQueue() {
  return (
    <Card
      title="REVIEW QUEUE"
      headerRight={
        <span
          className="font-[var(--font-mono)] text-[10px] text-[var(--color-warning)]"
        >
          {demoRecords.length} PENDING
        </span>
      }
    >
      <div className="flex flex-col gap-2">
        {demoRecords.map((record) => (
          <div
            key={record.id}
            className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius)] p-3"
          >
            {/* Confidence + Actions */}
            <div
              className="flex justify-between items-center mb-2"
            >
              <div className="flex items-center gap-2">
                <span className="section-header">CONFIDENCE</span>
                <span
                  className="font-[var(--font-mono)] text-xs font-bold" style={{ color: getConfidenceColor(record.confidence) }}
                >
                  {Math.round(record.confidence * 100)}%
                </span>
                {/* Confidence bar */}
                <div
                  className="w-[60px] h-[4px] bg-[var(--color-bg)] rounded-[2px] overflow-hidden"
                >
                  <div
                    className="h-full rounded-[2px]" style={{ width: `${record.confidence * 100}%`, backgroundColor: getConfidenceColor(record.confidence) }}
                  />
                </div>
              </div>

              <div className="flex gap-1.5">
                <button
                  className="flex items-center gap-1 py-1 px-2.5 bg-transparent border border-[var(--color-success)] rounded-[var(--radius)] text-[var(--color-success)] font-[var(--font-mono)] text-[9px] tracking-[1px] cursor-pointer"
                >
                  <Check size={10} /> APPROVE
                </button>
                <button
                  className="flex items-center gap-1 py-1 px-2.5 bg-transparent border border-[var(--color-accent)] rounded-[var(--radius)] text-[var(--color-accent)] font-[var(--font-mono)] text-[9px] tracking-[1px] cursor-pointer"
                >
                  <Edit3 size={10} /> EDIT
                </button>
                <button
                  className="flex items-center gap-1 py-1 px-2.5 bg-transparent border border-[var(--color-danger)] rounded-[var(--radius)] text-[var(--color-danger)] font-[var(--font-mono)] text-[9px] tracking-[1px] cursor-pointer"
                >
                  <X size={10} /> REJECT
                </button>
              </div>
            </div>

            {/* Two columns: Original and Parsed */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="section-header mb-1">
                  ORIGINAL TEXT
                </div>
                <div
                  className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)] bg-[var(--color-bg)] rounded-[var(--radius)] border border-[var(--color-border)] whitespace-pre-wrap leading-[1.4] p-2"
                >
                  {record.originalText}
                </div>
              </div>
              <div>
                <div className="section-header mb-1">
                  PARSED FIELDS
                </div>
                <div
                  className="bg-[var(--color-bg)] rounded-[var(--radius)] border border-[var(--color-border)] p-2"
                >
                  {Object.entries(record.parsedFields).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between py-0.5 px-0 font-[var(--font-mono)] text-[11px]"
                    >
                      <span className="text-[var(--color-text-muted)] uppercase text-[9px] tracking-[0.5px]">
                        {key}
                      </span>
                      <span className="text-[var(--color-text-bright)]">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
