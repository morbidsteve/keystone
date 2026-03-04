import { useState, useEffect } from 'react';
import ConvoyMap from '@/components/transportation/ConvoyMap';
import MovementTracker from '@/components/transportation/MovementTracker';
import ThroughputChart from '@/components/transportation/ThroughputChart';
import RoutePlannerModal from '@/components/transportation/RoutePlannerModal';
import { mockApi } from '@/api/mockClient';
import type { Movement } from '@/lib/types';

export default function TransportationPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [selectedConvoyId, setSelectedConvoyId] = useState<string | null>(null);
  const [routePlannerOpen, setRoutePlannerOpen] = useState(false);

  useEffect(() => {
    mockApi.getMovements().then(setMovements);
  }, []);

  const handleSaveRoute = async (data: Partial<Movement>) => {
    await mockApi.createMovement(data);
    const updated = await mockApi.getMovements();
    setMovements(updated);
    setRoutePlannerOpen(false);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Convoy Map - full width */}
      <ConvoyMap
        movements={movements}
        selectedConvoyId={selectedConvoyId}
        onSelectConvoy={setSelectedConvoyId}
        onOpenRoutePlanner={() => setRoutePlannerOpen(true)}
        height="50vh"
      />

      {/* Bottom section - 2 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <MovementTracker
          movements={movements}
          selectedConvoyId={selectedConvoyId}
          onSelectConvoy={setSelectedConvoyId}
        />
        <ThroughputChart />
      </div>

      {/* Route Planner Modal */}
      <RoutePlannerModal
        isOpen={routePlannerOpen}
        onClose={() => setRoutePlannerOpen(false)}
        onSaveRoute={handleSaveRoute}
      />
    </div>
  );
}
