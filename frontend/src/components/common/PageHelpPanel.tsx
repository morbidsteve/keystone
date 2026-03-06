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
      style={{
        position: 'fixed',
        bottom: 40,
        right: 20,
        zIndex: 1040,
        width: expanded ? 320 : 140,
        transition: 'width 0.2s ease',
      }}
    >
      {/* Collapsed bar / header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '8px 12px',
          backgroundColor: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: expanded
            ? 'var(--radius) var(--radius) 0 0'
            : 'var(--radius)',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <HelpCircle size={14} style={{ color: 'var(--color-accent)' }} />
          <span>Page Help</span>
        </div>
        {expanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderTop: 'none',
            borderRadius: '0 0 var(--radius) var(--radius)',
            overflow: 'hidden',
          }}
        >
          {/* Title */}
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-bright)',
                marginBottom: 6,
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                lineHeight: 1.5,
                color: 'var(--color-text)',
              }}
            >
              {description}
            </div>
          </div>

          {/* Actions */}
          {actions.length > 0 && (
            <div
              style={{
                padding: '10px 14px',
                borderBottom:
                  relatedPages.length > 0
                    ? '1px solid var(--color-border)'
                    : undefined,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                }}
              >
                Actions
              </span>
              {actions.map((action, i) => (
                <button
                  key={i}
                  onClick={action.onClick}
                  style={{
                    padding: '6px 10px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    letterSpacing: '0.5px',
                    border: '1px solid var(--color-accent)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'transparent',
                    color: 'var(--color-accent)',
                    cursor: 'pointer',
                    transition: 'background-color var(--transition)',
                    textAlign: 'left',
                  }}
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
              style={{
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                }}
              >
                Related Pages
              </span>
              {relatedPages.map((page, i) => (
                <a
                  key={i}
                  href={page.link}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--color-accent)',
                    textDecoration: 'none',
                  }}
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
