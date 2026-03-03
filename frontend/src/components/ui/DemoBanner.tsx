import { isDemoMode } from '@/api/mockClient';

export default function DemoBanner() {
  if (!isDemoMode) return null;

  return (
    <div
      style={{
        width: '100%',
        height: 28,
        backgroundColor: 'rgba(255, 193, 7, 0.15)',
        borderBottom: '1px solid rgba(255, 193, 7, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '2px',
          color: '#ffc107',
          textTransform: 'uppercase',
        }}
      >
        DEMO MODE — Using simulated data
      </span>
    </div>
  );
}
