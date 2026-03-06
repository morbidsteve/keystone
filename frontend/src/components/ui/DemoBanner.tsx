import { isDemoMode } from '@/api/mockClient';

export default function DemoBanner() {
  if (!isDemoMode) return null;

  return (
    <div
      role="alert"
      aria-label="Demo mode active"
      className="w-full h-[28px] bg-[rgba(255,193,7,0.15)] flex items-center justify-center shrink-0" style={{ borderBottom: '1px solid rgba(255, 193, 7, 0.3)' }}
    >
      <span
        className="font-[var(--font-mono)] text-[10px] font-semibold tracking-[2px] text-[#ffc107] uppercase"
      >
        DEMO MODE — Using simulated data
      </span>
    </div>
  );
}
