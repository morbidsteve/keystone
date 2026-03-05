import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import type { SupplyCatalogItem } from '@/lib/types';
import { searchSupplyCatalog, getSupplyClasses } from '@/api/catalog';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SupplySelectorProps {
  value?: SupplyCatalogItem | null;
  onChange: (item: SupplyCatalogItem | null) => void;
  supplyClassFilter?: string;
  placeholder?: string;
  style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Styles — inline CSS custom properties only (no Tailwind)
// ---------------------------------------------------------------------------

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px 8px 30px',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  color: 'var(--color-text-muted)',
  marginBottom: 4,
  display: 'block',
};

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  marginTop: 2,
  maxHeight: 320,
  overflowY: 'auto',
  backgroundColor: 'var(--color-bg-card)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  zIndex: 9999,
};

const resultItemStyle: React.CSSProperties = {
  padding: '6px 10px',
  cursor: 'pointer',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  color: 'var(--color-text)',
  borderBottom: '1px solid var(--color-border)',
};

const classHeaderStyle: React.CSSProperties = {
  padding: '4px 10px',
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  color: 'var(--color-accent)',
  backgroundColor: 'var(--color-bg)',
  borderBottom: '1px solid var(--color-border)',
  position: 'sticky',
  top: 0,
};

const selectedInfoStyle: React.CSSProperties = {
  marginTop: 6,
  padding: '6px 10px',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: 'var(--color-text-muted)',
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '2px 12px',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '1px 5px',
  borderRadius: 3,
  fontSize: 8,
  fontWeight: 700,
  letterSpacing: '0.5px',
  backgroundColor: 'var(--color-accent)',
  color: 'var(--color-bg)',
  marginLeft: 6,
  verticalAlign: 'middle',
};

const filterSelectStyle: React.CSSProperties = {
  padding: '4px 24px 4px 6px',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 6px center',
  outline: 'none',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SupplySelector({
  value,
  onChange,
  supplyClassFilter: externalClassFilter,
  placeholder = 'Search supply by NSN, nomenclature, DODIC...',
  style,
}: SupplySelectorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SupplyCatalogItem[]>([]);
  const [supplyClasses, setSupplyClasses] = useState<{ code: string; name: string }[]>([]);
  const [classFilter, setClassFilter] = useState(externalClassFilter || '');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load supply classes on mount
  useEffect(() => {
    getSupplyClasses().then(setSupplyClasses);
  }, []);

  // Sync external filter
  useEffect(() => {
    if (externalClassFilter !== undefined) {
      setClassFilter(externalClassFilter);
    }
  }, [externalClassFilter]);

  // Debounced search
  const doSearch = useCallback(
    (q: string, cls: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const items = await searchSupplyCatalog(q, cls || undefined, 30);
          setResults(items);
          setHighlightIndex(-1);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    },
    [],
  );

  // Trigger search when query or filter changes
  useEffect(() => {
    if (isOpen) {
      doSearch(query, classFilter);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, classFilter, isOpen, doSearch]);

  // Group results by supply class
  const grouped = results.reduce<Record<string, SupplyCatalogItem[]>>((acc, item) => {
    const key = `CL ${item.supplyClass}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  // Flat list for keyboard navigation
  const flatResults: SupplyCatalogItem[] = [];
  for (const key of Object.keys(grouped).sort()) {
    flatResults.push(...grouped[key]);
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard handling
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlightIndex >= 0 && highlightIndex < flatResults.length) {
      e.preventDefault();
      handleSelect(flatResults[highlightIndex]);
    }
  };

  const handleSelect = (item: SupplyCatalogItem) => {
    onChange(item);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (results.length === 0) {
      doSearch(query, classFilter);
    }
  };

  // Resolve supply class name
  const classNameMap = Object.fromEntries(supplyClasses.map((c) => [c.code, c.name]));

  return (
    <div ref={containerRef} style={{ position: 'relative', ...style }}>
      {/* Supply class filter (only show if no external filter) */}
      {externalClassFilter === undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>SUPPLY ITEM</label>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            style={filterSelectStyle}
          >
            <option value="">All Classes</option>
            {supplyClasses.map((c) => (
              <option key={c.code} value={c.code}>
                CL {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Search input */}
      {!value ? (
        <div style={{ position: 'relative' }}>
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={inputStyle}
          />
          {isLoading && (
            <Loader2
              size={13}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-accent)',
                animation: 'spin 1s linear infinite',
              }}
            />
          )}
        </div>
      ) : (
        /* Selected item display */
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 10px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-accent)',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text-bright)',
            }}
          >
            <span style={{ flex: 1 }}>
              {(value.nsn || value.dodic) && (
                <span style={{ fontWeight: 700, marginRight: 8 }}>
                  {value.nsn || value.dodic}
                </span>
              )}
              {value.commonName || value.nomenclature}
              <span style={badgeStyle}>CL {value.supplyClass}</span>
              <span
                style={{
                  ...badgeStyle,
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {value.unitOfIssue}
              </span>
            </span>
            <button
              onClick={handleClear}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: 2,
              }}
            >
              <X size={13} />
            </button>
          </div>
          <div style={selectedInfoStyle}>
            <span>NSN: {value.nsn || '--'}</span>
            <span>DODIC: {value.dodic || '--'}</span>
            <span>NOMENCLATURE: {value.nomenclature}</span>
            <span>U/I: {value.unitOfIssue} ({value.unitOfIssueDesc || '--'})</span>
          </div>
        </div>
      )}

      {/* Dropdown results */}
      {isOpen && !value && (
        <div style={dropdownStyle}>
          {flatResults.length === 0 && !isLoading && (
            <div
              style={{
                padding: '16px 10px',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-text-muted)',
                textAlign: 'center',
              }}
            >
              {query ? 'No results found' : 'Type to search supply catalog'}
            </div>
          )}
          {isLoading && flatResults.length === 0 && (
            <div
              style={{
                padding: '16px 10px',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-text-muted)',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Loader2
                size={13}
                style={{ animation: 'spin 1s linear infinite' }}
              />
              Searching...
            </div>
          )}
          {Object.keys(grouped)
            .sort()
            .map((classKey) => (
              <div key={classKey}>
                <div style={classHeaderStyle}>
                  {classKey}
                  {classNameMap[classKey.replace('CL ', '')] && (
                    <span style={{ fontWeight: 400, marginLeft: 6 }}>
                      {classNameMap[classKey.replace('CL ', '')]}
                    </span>
                  )}
                </div>
                {grouped[classKey].map((item) => {
                  const flatIdx = flatResults.indexOf(item);
                  const isHighlighted = flatIdx === highlightIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setHighlightIndex(flatIdx)}
                      style={{
                        ...resultItemStyle,
                        backgroundColor: isHighlighted
                          ? 'var(--color-bg-hover, rgba(77,171,247,0.1))'
                          : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-text-bright)', minWidth: 120 }}>
                          {item.nsn || item.dodic || '--'}
                        </span>
                        <span style={{ flex: 1 }}>{item.nomenclature}</span>
                        <span style={badgeStyle}>{item.unitOfIssue}</span>
                      </div>
                      {item.commonName && (
                        <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 1 }}>
                          {item.commonName}
                          {item.isHazmat && (
                            <span
                              style={{
                                marginLeft: 6,
                                padding: '0 4px',
                                borderRadius: 2,
                                fontSize: 8,
                                fontWeight: 700,
                                backgroundColor: 'var(--color-danger, #ef4444)',
                                color: '#fff',
                              }}
                            >
                              HAZMAT
                            </span>
                          )}
                          {item.isControlled && (
                            <span
                              style={{
                                marginLeft: 4,
                                padding: '0 4px',
                                borderRadius: 2,
                                fontSize: 8,
                                fontWeight: 700,
                                backgroundColor: 'var(--color-warning, #f59e0b)',
                                color: '#000',
                              }}
                            >
                              CTRL
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
        </div>
      )}

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { from { transform: translateY(-50%) rotate(0deg); } to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </div>
  );
}
