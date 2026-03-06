import { create } from 'zustand';

export type ModalType = 'create-requisition' | 'create-work-order' | 'plan-convoy' | null;

interface ModalStore {
  activeModal: ModalType;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  activeModal: null,
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
}));
