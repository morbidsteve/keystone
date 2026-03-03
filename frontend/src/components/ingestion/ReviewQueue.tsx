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
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--color-warning)',
          }}
        >
          {demoRecords.length} PENDING
        </span>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {demoRecords.map((record) => (
          <div
            key={record.id}
            style={{
              padding: '12px',
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
            }}
          >
            {/* Confidence + Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="section-header">CONFIDENCE</span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: getConfidenceColor(record.confidence),
                  }}
                >
                  {Math.round(record.confidence * 100)}%
                </span>
                {/* Confidence bar */}
                <div
                  style={{
                    width: 60,
                    height: 4,
                    backgroundColor: 'var(--color-bg)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${record.confidence * 100}%`,
                      height: '100%',
                      backgroundColor: getConfidenceColor(record.confidence),
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--color-success)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--color-success)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    letterSpacing: '1px',
                    cursor: 'pointer',
                  }}
                >
                  <Check size={10} /> APPROVE
                </button>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--color-accent)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--color-accent)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    letterSpacing: '1px',
                    cursor: 'pointer',
                  }}
                >
                  <Edit3 size={10} /> EDIT
                </button>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--color-danger)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--color-danger)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    letterSpacing: '1px',
                    cursor: 'pointer',
                  }}
                >
                  <X size={10} /> REJECT
                </button>
              </div>
            </div>

            {/* Two columns: Original and Parsed */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div className="section-header" style={{ marginBottom: 4 }}>
                  ORIGINAL TEXT
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                    padding: '8px',
                    backgroundColor: 'var(--color-bg)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--color-border)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.4,
                  }}
                >
                  {record.originalText}
                </div>
              </div>
              <div>
                <div className="section-header" style={{ marginBottom: 4 }}>
                  PARSED FIELDS
                </div>
                <div
                  style={{
                    padding: '8px',
                    backgroundColor: 'var(--color-bg)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {Object.entries(record.parsedFields).map(([key, value]) => (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '2px 0',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                      }}
                    >
                      <span style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.5px' }}>
                        {key}
                      </span>
                      <span style={{ color: 'var(--color-text-bright)' }}>
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
