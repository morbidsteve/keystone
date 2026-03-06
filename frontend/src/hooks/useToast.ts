import { useToastStore } from '@/stores/toastStore';

export const useToast = () => {
  const addToast = useToastStore((s) => s.addToast);
  return {
    success: (message: string) => addToast({ message, severity: 'success' }),
    info: (message: string) => addToast({ message, severity: 'info' }),
    warning: (message: string) => addToast({ message, severity: 'warning' }),
    danger: (message: string) => addToast({ message, severity: 'danger' }),
  };
};
