import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

/* ---------- FormField wrapper ---------- */

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
}

export function FormField({ label, htmlFor, required, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="font-[var(--font-mono)] text-[9px] font-medium uppercase tracking-[1.5px] text-[var(--color-text-muted)]"
      >
        {label}
        {required && <span className="text-[var(--color-danger)] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ---------- Shared input classes ---------- */

const inputBase = `
  w-full font-[var(--font-mono)] text-[13px]
  bg-[var(--color-bg)] text-[var(--color-text-bright)]
  border border-[var(--color-border)] rounded-[var(--radius)]
  py-2 px-3
  transition-colors duration-[var(--transition)]
  placeholder:text-[var(--color-text-muted)] placeholder:opacity-60
  focus:outline-none focus:border-[var(--color-accent)]
  disabled:opacity-50 disabled:cursor-not-allowed
`;

/* ---------- FormInput ---------- */

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function FormInput({ className = '', ...rest }: FormInputProps) {
  return (
    <input
      className={`${inputBase} ${className}`}
      {...rest}
    />
  );
}

/* ---------- FormSelect ---------- */

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  children: ReactNode;
}

export function FormSelect({ className = '', children, ...rest }: FormSelectProps) {
  return (
    <select
      className={`${inputBase} ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

/* ---------- FormTextarea ---------- */

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export function FormTextarea({ className = '', ...rest }: FormTextareaProps) {
  return (
    <textarea
      className={`${inputBase} min-h-[80px] resize-y ${className}`}
      {...rest}
    />
  );
}
