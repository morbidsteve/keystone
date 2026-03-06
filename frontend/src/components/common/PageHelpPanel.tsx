import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface PageHelpAction {
  label: string;
  onClick: () => void;
}

interface PageHelpLink {
  label: string;
  link: string;
}

interface PageHelpPanelProps {
  title: string;
  description: string;
  actions?: PageHelpAction[];
  relatedPages?: PageHelpLink[];
}

export default function PageHelpPanel({
  title,
  description,
  actions = [],
  relatedPages = [],
}: PageHelpPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="fixed bottom-10 right-5 z-[1040]" style={{ width: expanded ? 320 : 140, transition: 'width 0.2s ease' }}
    >
      {/* Collapsed bar / header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-2 py-2 px-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] cursor-pointer font-[var(--font-mono)] text-[10px] font-semibold tracking-[1.5px] uppercase text-[var(--color-text-muted)]" style={{ borderRadius: expanded
            ? 'var(--radius) var(--radius) 0 0'
            : 'var(--radius)' }}
      >
        <div className="flex items-center gap-1.5">
          <HelpCircle size={14} className="text-[var(--color-accent)]" />
          <span>Page Help</span>
        </div>
        {expanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div
          className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[0 0 var(--radius) var(--radius)] overflow-hidden border-t-0"
        >
          {/* Title */}
          <div
            className="py-3 px-3.5 border-b border-b-[var(--color-border)]"
          >
            <div
              className="font-[var(--font-mono)] text-xs font-semibold text-[var(--color-text-bright)] mb-1.5"
            >
              {title}
            </div>
            <div
              className="font-[var(--font-mono)] text-[11px] leading-normal text-[var(--color-text)]"
            >
              {description}
            </div>
          </div>

          {/* Actions */}
          {actions.length > 0 && (
            <div
              className="py-2.5 px-3.5 flex flex-col gap-1.5" style={{ borderBottom: relatedPages.length > 0
                    ? '1px solid var(--color-border)'
                    : undefined }}
            >
              <span
                className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] uppercase text-[var(--color-text-muted)]"
              >
                Actions
              </span>
              {actions.map((action, i) => (
                <button
                  key={i}
                  onClick={action.onClick}
                  className="py-1.5 px-2.5 font-[var(--font-mono)] text-[10px] tracking-[0.5px] border border-[var(--color-accent)] rounded-[var(--radius)] bg-transparent text-[var(--color-accent)] cursor-pointer text-left transition-colors duration-[var(--transition)]"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      'rgba(77, 171, 247, 0.1)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'transparent')
                  }
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Related Pages */}
          {relatedPages.length > 0 && (
            <div
              className="py-2.5 px-3.5 flex flex-col gap-1.5"
            >
              <span
                className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] uppercase text-[var(--color-text-muted)]"
              >
                Related Pages
              </span>
              {relatedPages.map((page, i) => (
                <a
                  key={i}
                  href={page.link}
                  className="flex items-center gap-1.5 font-[var(--font-mono)] text-[11px] text-[var(--color-accent)] no-underline"
                >
                  <ExternalLink size={10} />
                  {page.label}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
