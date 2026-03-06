// =============================================================================
// GlobalModals — Renders modals based on the global modal store
// =============================================================================

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useModalStore } from '@/stores/modalStore';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useToast } from '@/hooks/useToast';
import CreateRequisitionModal from '@/components/requisitions/CreateRequisitionModal';
import CreateWorkOrderModal from '@/components/equipment/CreateWorkOrderModal';
import RoutePlannerModal from '@/components/transportation/RoutePlannerModal';
import type { Movement } from '@/lib/types';

export default function GlobalModals() {
  const { activeModal, closeModal } = useModalStore();
  const selectedUnitId = useDashboardStore((s) => s.selectedUnitId);
  const queryClient = useQueryClient();
  const toast = useToast();

  const numericUnitId = useMemo(() => {
    if (!selectedUnitId) return 1;
    const parsed = parseInt(selectedUnitId, 10);
    return isNaN(parsed) ? 1 : parsed;
  }, [selectedUnitId]);

  const handleWorkOrderCreate = () => {
    queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    toast.success('Work order created successfully');
  };

  const handleSaveRoute = (_movement: Partial<Movement>) => {
    queryClient.invalidateQueries({ queryKey: ['movements'] });
    toast.success('Convoy route planned successfully');
    closeModal();
  };

  return (
    <>
      <CreateRequisitionModal
        isOpen={activeModal === 'create-requisition'}
        onClose={closeModal}
        unitId={numericUnitId}
      />

      <CreateWorkOrderModal
        isOpen={activeModal === 'create-work-order'}
        onClose={closeModal}
        onCreate={handleWorkOrderCreate}
      />

      <RoutePlannerModal
        isOpen={activeModal === 'plan-convoy'}
        onClose={closeModal}
        onSaveRoute={handleSaveRoute}
      />
    </>
  );
}
