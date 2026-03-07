import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import Card from '@/components/ui/Card';

// Mock position dots for the placeholder map
const POSITIONS = [
  { x: 30, y: 35, label: 'CP', color: 'var(--color-accent)' },
  { x: 65, y: 55, label: 'FSB', color: 'var(--color-success)' },
  { x: 50, y: 25, label: 'MSR', color: 'var(--color-warning)' },
  { x: 80, y: 70, label: 'LOG', color: 'var(--color-accent)' },
];

export default function MiniMapWidget() {
  return (
    <Card
      title="OPERATIONAL MAP"
      headerRight={
        <Link
          to="/map"
          className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1px] text-[var(--color-accent)] hover:underline no-underline"
        >
          VIEW FULL MAP &rarr;
        </Link>
      }
    >
      <div
        className="relative rounded overflow-hidden"
        style={{
          height: 160,
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          backgroundImage:
            'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {/* Mock position dots */}
        {POSITIONS.map((pos) => (
          <div
            key={pos.label}
            className="absolute flex flex-col items-center"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <MapPin size={14} style={{ color: pos.color }} />
            <span
              className="font-[var(--font-mono)] text-[8px] font-bold tracking-[0.5px] mt-0.5"
              style={{ color: pos.color }}
            >
              {pos.label}
            </span>
          </div>
        ))}

        {/* Grid overlay label */}
        <div
          className="absolute bottom-1.5 left-2 font-[var(--font-mono)] text-[8px] tracking-[1px] text-[var(--color-text-muted)] opacity-50"
        >
          MGRS 11S NT 00000 00000
        </div>
      </div>
    </Card>
  );
}
