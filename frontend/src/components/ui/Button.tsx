import type { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-accent)] text-[var(--color-bg)] border-[var(--color-accent)] hover:brightness-110',
  secondary:
    'bg-transparent text-[var(--color-text)] border-[var(--color-border-strong)] hover:bg-[var(--color-bg-hover)]',
  danger:
    'bg-[var(--color-danger)] text-white border-[var(--color-danger)] hover:brightness-110',
  ghost:
    'bg-transparent text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-[9px] py-1 px-2.5 tracking-[1px]',
  md: 'text-[10px] py-1.5 px-3.5 tracking-[1.5px]',
  lg: 'text-[11px] py-2 px-5 tracking-[1.5px]',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-1.5
        font-[var(--font-mono)] font-semibold uppercase
        border rounded-[var(--radius)] cursor-pointer
        transition-all duration-[var(--transition)]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...rest}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {children}
    </button>
  );
}
