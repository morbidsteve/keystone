import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'danger';
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${++counter}`;
    const duration = toast.duration ?? 5000;

    set((state) => {
      const next = [...state.toasts, { ...toast, id }];
      // Max 5 visible — remove oldest if exceeding
      if (next.length > 5) {
        return { toasts: next.slice(next.length - 5) };
      }
      return { toasts: next };
    });

    // Auto-dismiss after duration
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
