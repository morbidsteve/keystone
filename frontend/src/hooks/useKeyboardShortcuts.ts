import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const NAV_SHORTCUTS: Record<string, string> = {
  'd': '/dashboard',
  'm': '/map',
  's': '/supply',
  'e': '/equipment',
  'r': '/readiness',
  't': '/transportation',
  'p': '/personnel',
  'a': '/alerts',
};

const SEQUENCE_TIMEOUT = 1500;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false);
  const navigate = useNavigate();
  const pendingKeyRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPending = useCallback(() => {
    pendingKeyRef.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return;

      // Close help on Escape
      if (e.key === 'Escape') {
        setShowHelp(false);
        clearPending();
        return;
      }

      // Show help on ?
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        clearPending();
        return;
      }

      // Start "g" sequence
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (pendingKeyRef.current === 'g') {
          // Already pending, ignore double-g
          clearPending();
          return;
        }
        pendingKeyRef.current = 'g';
        timeoutRef.current = setTimeout(clearPending, SEQUENCE_TIMEOUT);
        return;
      }

      // Handle second key of g-sequence
      if (pendingKeyRef.current === 'g') {
        const destination = NAV_SHORTCUTS[e.key.toLowerCase()];
        if (destination) {
          e.preventDefault();
          navigate(destination);
          setShowHelp(false);
        }
        clearPending();
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [navigate, clearPending]);

  return { showHelp, setShowHelp };
}
