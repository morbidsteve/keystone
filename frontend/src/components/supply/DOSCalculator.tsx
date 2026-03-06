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
      headerRight={<Calculator size={14} className="text-[var(--color-text-muted)]" />}
    >
      <div className="flex flex-col gap-3">
        <div>
          <label
            className="font-[var(--font-mono)] text-[9px] uppercase tracking-[1.5px] text-[var(--color-text-muted)] block mb-1"
          >
            ON HAND QUANTITY
          </label>
          <input
            type="number"
            value={onHand || ''}
            onChange={(e) => setOnHand(Number(e.target.value))}
            placeholder="0"
            className="w-full py-2 px-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] font-[var(--font-mono)] text-[13px] text-[var(--color-text)]"
          />
        </div>

        <div>
          <label
            className="font-[var(--font-mono)] text-[9px] uppercase tracking-[1.5px] text-[var(--color-text-muted)] block mb-1"
          >
            DAILY CONSUMPTION RATE
          </label>
          <input
            type="number"
            value={rate || ''}
            onChange={(e) => setRate(Number(e.target.value))}
            placeholder="0"
            className="w-full py-2 px-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] font-[var(--font-mono)] text-[13px] text-[var(--color-text)]"
          />
        </div>

        <div
          className="bg-[var(--color-bg-surface)] rounded-[var(--radius)] text-center" style={{ padding: '12px', border: `1px solid ${color}` }}
        >
          <div className="section-header mb-1.5">
            PROJECTED DAYS OF SUPPLY
          </div>
          <div
            className="font-[var(--font-mono)] text-[32px] font-bold leading-none" style={{ color: color }}
          >
            {dos}D
          </div>
          {exhaustionDate && onHand > 0 && rate > 0 && (
            <div
              className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mt-1.5"
            >
              EXHAUSTION: {format(exhaustionDate, 'dd MMM yyyy')}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
