import type { ReactNode } from 'react';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: TooltipPosition;
}

const positionClasses: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export default function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  return (
    <span className="relative inline-flex group">
      {children}
      <span
        role="tooltip"
        className={`
          absolute z-50 pointer-events-none
          opacity-0 group-hover:opacity-100
          transition-opacity duration-[var(--transition)]
          font-[var(--font-mono)] text-[10px] leading-tight
          whitespace-nowrap
          bg-[var(--color-text-bright)] text-[var(--color-bg)]
          py-1 px-2 rounded-[var(--radius)]
          ${positionClasses[position]}
        `}
      >
        {content}
      </span>
    </span>
  );
}
