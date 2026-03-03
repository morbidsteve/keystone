import MovementTracker from '@/components/transportation/MovementTracker';
import ThroughputChart from '@/components/transportation/ThroughputChart';

export default function TransportationPage() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <MovementTracker />
        <ThroughputChart />
      </div>
    </div>
  );
}
