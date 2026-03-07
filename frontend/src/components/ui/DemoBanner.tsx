import { useState } from 'react';
import { X } from 'lucide-react';
import { isDemoMode } from '@/api/mockClient';

const STORAGE_KEY = 'keystone_demo_banner_dismissed';

export default function DemoBanner() {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) === 'true',
  );

  if (!isDemoMode || dismissed) return null;

  return (
    <div
      role="alert"
      aria-label="Demo mode active"
      className="w-full h-[28px] bg-[rgba(255,193,7,0.15)] flex items-center justify-center shrink-0 relative"
      style={{ borderBottom: '1px solid rgba(255, 193, 7, 0.3)' }}
    >
      <span
        className="font-[var(--font-mono)] text-[10px] font-semibold tracking-[2px] text-[#ffc107] uppercase"
      >
        DEMO MODE — Using simulated data
      </span>
      <button
        onClick={() => {
          sessionStorage.setItem(STORAGE_KEY, 'true');
          setDismissed(true);
        }}
        aria-label="Dismiss demo mode banner"
        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center bg-transparent border-none cursor-pointer text-[#ffc107] p-0.5 rounded hover:bg-[rgba(255,193,7,0.2)]"
        style={{ transition: 'background-color 150ms ease' }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
