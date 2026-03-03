import { useState } from 'react';
import { Calculator } from 'lucide-react';
import Card from '@/components/ui/Card';
import { format, addDays } from 'date-fns';
import { getStatusColor, getDOSStatus } from '@/lib/utils';

export default function DOSCalculator() {
  const [onHand, setOnHand] = useState<number>(0);
  const [rate, setRate] = useState<number>(1);

  const dos = rate > 0 ? Math.floor(onHand / rate) : 0;
  const exhaustionDate = rate > 0 ? addDays(new Date(), dos) : null;
  const status = getDOSStatus(dos);
  const color = getStatusColor(status);

  return (
    <Card
      title="DOS CALCULATOR"
      headerRight={<Calculator size={14} style={{ color: 'var(--color-text-muted)' }} />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--color-text-muted)',
              display: 'block',
              marginBottom: 4,
            }}
          >
            ON HAND QUANTITY
          </label>
          <input
            type="number"
            value={onHand || ''}
            onChange={(e) => setOnHand(Number(e.target.value))}
            placeholder="0"
            style={{
              width: '100%',
              padding: '8px 10px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--color-text)',
            }}
          />
        </div>

        <div>
          <label
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--color-text-muted)',
              display: 'block',
              marginBottom: 4,
            }}
          >
            DAILY CONSUMPTION RATE
          </label>
          <input
            type="number"
            value={rate || ''}
            onChange={(e) => setRate(Number(e.target.value))}
            placeholder="0"
            style={{
              width: '100%',
              padding: '8px 10px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--color-text)',
            }}
          />
        </div>

        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--color-bg-surface)',
            border: `1px solid ${color}`,
            borderRadius: 'var(--radius)',
            textAlign: 'center',
          }}
        >
          <div className="section-header" style={{ marginBottom: 6 }}>
            PROJECTED DAYS OF SUPPLY
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 32,
              fontWeight: 700,
              color: color,
              lineHeight: 1,
            }}
          >
            {dos}D
          </div>
          {exhaustionDate && onHand > 0 && rate > 0 && (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-text-muted)',
                marginTop: 6,
              }}
            >
              EXHAUSTION: {format(exhaustionDate, 'dd MMM yyyy')}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
