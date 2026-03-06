import { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import { exportToCSV, exportToPDF } from '@/lib/export';

interface ExportMenuProps {
  data: Record<string, unknown>[];
  filename: string;
  title: string;
  columns?: { key: string; header: string }[];
}

export default function ExportMenu({ data, filename, title, columns }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleCSV = () => {
    exportToCSV(data, filename, columns);
    setOpen(false);
  };

  const handlePDF = () => {
    exportToPDF(data, filename, title, columns);
    setOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 py-1.5 px-2.5 font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] uppercase bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] cursor-pointer text-[var(--color-text-muted)]"
        style={{ transition: 'all var(--transition)' }}
        title="Export data"
      >
        <Download size={12} />
        EXPORT
      </button>
      {open && (
        <div
          className="absolute top-full right-0 mt-1 w-[140px] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden z-50"
          style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
        >
          <button
            onClick={handleCSV}
            className="w-full py-2 px-3 text-left font-[var(--font-mono)] text-[10px] tracking-[1px] text-[var(--color-text)] bg-transparent border-none cursor-pointer"
            style={{ transition: 'background-color var(--transition)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Export CSV
          </button>
          <button
            onClick={handlePDF}
            className="w-full py-2 px-3 text-left font-[var(--font-mono)] text-[10px] tracking-[1px] text-[var(--color-text)] bg-transparent border-none cursor-pointer border-t border-t-[var(--color-border)]"
            style={{ transition: 'background-color var(--transition)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
}
