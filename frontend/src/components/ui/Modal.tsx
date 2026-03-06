import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
  footer?: React.ReactNode;
}

export default function Modal({ title, onClose, children, maxWidth = 600, footer }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store previously focused element and focus the dialog on mount
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    // Focus the dialog container
    dialogRef.current?.focus();

    return () => {
      // Restore focus on unmount
      previousFocusRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Focus trap: keep Tab cycling within the modal
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableElements = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusableElements.length === 0) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed z-[3000] flex items-center justify-center bg-[rgba(0,0,0,0.85)]" style={{ inset: 0, animation: 'modalFadeIn 0.15s ease-out' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
    >
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-[90%] bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] rounded-[var(--radius)] flex flex-col overflow-hidden outline-none" style={{ maxWidth,
          maxHeight: '90vh' }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center py-3.5 px-4 border-b border-b-[var(--color-border)]"
        >
          <span
            id="modal-title"
            className="font-[var(--font-mono)] text-xs font-bold tracking-[1.5px] text-[var(--color-text-bright)] uppercase"
          >
            {title}
          </span>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="flex items-center justify-center bg-transparent border-0 text-[var(--color-text-muted)] cursor-pointer p-1"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div
          className="flex-1 overflow-y-auto p-4"
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="flex justify-end gap-2 py-3 px-4 border-t border-t-[var(--color-border)]"
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
