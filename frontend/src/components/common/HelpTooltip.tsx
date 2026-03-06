import { useState, useRef, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';
import { useHelpMode } from '@/hooks/useHelpMode';

interface HelpTooltipProps {
  content: string;
  children: ReactNode;
  icon?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function HelpTooltip({
  content,
  children,
  icon = false,
  position = 'top',
}: HelpTooltipProps) {
  const { isHelpMode } = useHelpMode();
  const [visible, setVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const gap = 8;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top - gap;
        left = rect.left + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - gap;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + gap;
        break;
    }

    setTooltipPos({ top, left });
  }, [position]);

  const handleMouseEnter = () => {
    if (!isHelpMode) return;
    calculatePosition();
    setVisible(true);
  };

  const handleMouseLeave = () => {
    setVisible(false);
  };

  const getTransformOrigin = (): string => {
    switch (position) {
      case 'top':
        return 'translateX(-50%) translateY(-100%)';
      case 'bottom':
        return 'translateX(-50%)';
      case 'left':
        return 'translateX(-100%) translateY(-50%)';
      case 'right':
        return 'translateY(-50%)';
      default:
        return '';
    }
  };

  const tooltip =
    visible && isHelpMode
      ? createPortal(
          <div
            style={{
              position: 'fixed',
              top: tooltipPos.top,
              left: tooltipPos.left,
              transform: getTransformOrigin(),
              zIndex: 10000,
              maxWidth: 280,
              padding: '8px 12px',
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-accent)',
              borderRadius: 'var(--radius)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              lineHeight: 1.5,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              pointerEvents: 'none',
            }}
          >
            {content}
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        position: 'relative',
        outline: isHelpMode ? '1px dashed rgba(77, 171, 247, 0.3)' : undefined,
        borderRadius: isHelpMode ? 'var(--radius)' : undefined,
        cursor: isHelpMode ? 'help' : undefined,
      }}
    >
      {children}
      {icon && isHelpMode && (
        <HelpCircle
          size={12}
          style={{ color: 'var(--color-accent)', flexShrink: 0 }}
        />
      )}
      {tooltip}
    </div>
  );
}
