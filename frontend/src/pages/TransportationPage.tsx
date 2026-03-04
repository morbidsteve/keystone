import { useState, useEffect } from 'react';
import ConvoyMap from '@/components/transportation/ConvoyMap';
import MovementTracker from '@/components/transportation/MovementTracker';
import ThroughputChart from '@/components/transportation/ThroughputChart';
import RoutePlannerModal from '@/components/transportation/RoutePlannerModal';
import MovementDetailModal from '@/components/transportation/MovementDetailModal';
import { mockApi } from '@/api/mockClient';
import type { Movement } from '@/lib/types';
import { useDashboardStore } from '@/stores/dashboardStore';

export default function TransportationPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [selectedConvoyId, setSelectedConvoyId] = useState<string | null>(null);
  const [routePlannerOpen, setRoutePlannerOpen] = useState(false);
  const [detailMovement, setDetailMovement] = useState<Movement | null>(null);
  const selectedUnitId = useDashboardStore((s) => s.selectedUnitId);

  useEffect(() => {
    mockApi.getMovements({ unitId: selectedUnitId ?? undefined }).then(setMovements);
  }, [selectedUnitId]);

  const handleSaveRoute = async (data: Partial<Movement>) => {
    await mockApi.createMovement(data);
    const updated = await mockApi.getMovements({ unitId: selectedUnitId ?? undefined });
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
        onViewDetail={(mov) => setDetailMovement(mov)}
        height="50vh"
      />

      {/* Bottom section - 2 columns */}
      <div className="grid-responsive-2col">
        <MovementTracker
          movements={movements}
          selectedConvoyId={selectedConvoyId}
          onSelectConvoy={setSelectedConvoyId}
          onViewDetail={(mov) => setDetailMovement(mov)}
        />
        <ThroughputChart />
      </div>

      {/* Route Planner Modal */}
      <RoutePlannerModal
        isOpen={routePlannerOpen}
        onClose={() => setRoutePlannerOpen(false)}
        onSaveRoute={handleSaveRoute}
      />

      {/* Movement Detail Modal */}
      <MovementDetailModal
        movement={detailMovement}
        onClose={() => setDetailMovement(null)}
      />
    </div>
  );
}
