import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, ChevronDown } from 'lucide-react';
import type { EquipmentCatalogItem } from '@/lib/types';
import { searchEquipmentCatalog, getEquipmentCategories } from '@/api/catalog';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EquipmentSelectorProps {
  value?: EquipmentCatalogItem | null;
  onChange: (item: EquipmentCatalogItem | null) => void;
  categoryFilter?: string;
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

const categoryHeaderStyle: React.CSSProperties = {
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

export default function EquipmentSelector({
  value,
  onChange,
  categoryFilter: externalCategoryFilter,
  placeholder = 'Search equipment by TAMCN, nomenclature, name...',
  style,
}: EquipmentSelectorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EquipmentCatalogItem[]>([]);
  const [categories, setCategories] = useState<{ category: string; subcategories: string[] }[]>([]);
  const [categoryFilter, setCategoryFilter] = useState(externalCategoryFilter || '');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flatResultsRef = useRef<EquipmentCatalogItem[]>([]);

  // Load categories on mount
  useEffect(() => {
    getEquipmentCategories().then(setCategories);
  }, []);

  // Sync external category filter
  useEffect(() => {
    if (externalCategoryFilter !== undefined) {
      setCategoryFilter(externalCategoryFilter);
    }
  }, [externalCategoryFilter]);

  // Debounced search
  const doSearch = useCallback(
    (q: string, cat: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const items = await searchEquipmentCatalog(q, cat || undefined, 30);
          setResults(items);
          setHighlightIndex(-1);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    },
    [],
  );

  // Trigger search when query or category changes
  useEffect(() => {
    if (isOpen) {
      doSearch(query, categoryFilter);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, categoryFilter, isOpen, doSearch]);

  // Group results by category
  const grouped = results.reduce<Record<string, EquipmentCatalogItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  // Flat list for keyboard navigation
  const flatResults: EquipmentCatalogItem[] = [];
  for (const cat of Object.keys(grouped).sort()) {
    flatResults.push(...grouped[cat]);
  }
  flatResultsRef.current = flatResults;

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

  const handleSelect = (item: EquipmentCatalogItem) => {
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
      doSearch(query, categoryFilter);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Category filter (only show if no external filter locks it) */}
      {externalCategoryFilter === undefined && (
        <div className="flex items-center gap-2 mb-1">
          <label style={{ ...labelStyle, marginBottom: 0 }}>EQUIPMENT</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={filterSelectStyle}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.category} value={c.category}>
                {c.category}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Search input */}
      {!value ? (
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 text-[var(--color-text-muted)] top-1/2 -translate-y-1/2 pointer-events-none"
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
              className="absolute right-2.5 text-[var(--color-accent)]" style={{ top: '50%', transform: 'translateY(-50%)', animation: 'spin 1s linear infinite' }}
            />
          )}
        </div>
      ) : (
        /* Selected item display */
        <div>
          <div
            className="flex items-center gap-2 py-1.5 px-2.5 bg-[var(--color-bg)] border border-[var(--color-accent)] rounded-[var(--radius)] font-[var(--font-mono)] text-[11px] text-[var(--color-text-bright)]"
          >
            <span className="flex-1">
              {value.tamcn && (
                <span className="font-bold mr-2">{value.tamcn}</span>
              )}
              {value.commonName || value.nomenclature}
            </span>
            <button
              onClick={handleClear}
              type="button"
              className="flex items-center justify-center bg-transparent border-0 text-[var(--color-text-muted)] cursor-pointer p-0.5"
            >
              <X size={13} />
            </button>
          </div>
          <div style={selectedInfoStyle}>
            <span>TAMCN: {value.tamcn || '--'}</span>
            <span>NSN: {value.nsn || '--'}</span>
            <span>NOMENCLATURE: {value.nomenclature}</span>
            <span>MFR: {value.manufacturer || '--'}</span>
          </div>
        </div>
      )}

      {/* Dropdown results */}
      {isOpen && !value && (
        <div style={dropdownStyle}>
          {flatResults.length === 0 && !isLoading && (
            <div
              className="py-4 px-2.5 font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)] text-center"
            >
              {query ? 'No results found' : 'Type to search equipment catalog'}
            </div>
          )}
          {isLoading && flatResults.length === 0 && (
            <div
              className="py-4 px-2.5 font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)] text-center flex items-center justify-center gap-2"
            >
              <Loader2
                size={13}
                className="animate-spin"
              />
              Searching...
            </div>
          )}
          {Object.keys(grouped)
            .sort()
            .map((cat) => (
              <div key={cat}>
                <div style={categoryHeaderStyle}>{cat}</div>
                {grouped[cat].map((item) => {
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
                      <div className="flex items-baseline gap-1.5">
                        {item.tamcn && (
                          <span className="font-bold text-[var(--color-text-bright)] min-w-[48px]">
                            {item.tamcn}
                          </span>
                        )}
                        <span>{item.nomenclature}</span>
                      </div>
                      {item.commonName && (
                        <div className="text-[9px] text-[var(--color-text-muted)] mt-px">
                          {item.commonName}
                          {item.nsn && <span className="ml-2">NSN: {item.nsn}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
        </div>
      )}

      {/* Spinner keyframe (injected once) */}
      <style>{`@keyframes spin { from { transform: translateY(-50%) rotate(0deg); } to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </div>
  );
}
