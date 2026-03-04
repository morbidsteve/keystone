import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ChevronRight, ChevronDown, Search, Building2 } from 'lucide-react';
import { ECHELON_ABBREVIATIONS } from '@/lib/constants';
import { mockApi, isDemoMode } from '@/api/mockClient';
import apiClient from '@/api/client';
import type { Unit } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UnitSelectorProps {
  selectedUnitId: string | null;
  onSelectUnit: (unitId: string | null) => void;
  className?: string;
}

interface TreeNode {
  id: string;
  name: string;
  abbreviation?: string;
  echelon: string;
  parentId?: string | null;
  uic: string;
  childNodes: TreeNode[];
  depth: number;
}

// ---------------------------------------------------------------------------
// Echelon badge colors (inline CSS to match existing sidebar style patterns)
// ---------------------------------------------------------------------------

const ECHELON_BADGE_STYLES: Record<string, React.CSSProperties> = {
  HQMC: { backgroundColor: 'rgba(100, 116, 139, 0.9)', color: '#fff' },
  MEF: { backgroundColor: 'rgba(37, 99, 235, 0.9)', color: '#fff' },
  DIVISION: { backgroundColor: 'rgba(79, 70, 229, 0.9)', color: '#fff' },
  DIV: { backgroundColor: 'rgba(79, 70, 229, 0.9)', color: '#fff' },
  WING: { backgroundColor: 'rgba(2, 132, 199, 0.9)', color: '#fff' },
  GRP: { backgroundColor: 'rgba(124, 58, 237, 0.9)', color: '#fff' },
  REGIMENT: { backgroundColor: 'rgba(147, 51, 234, 0.9)', color: '#fff' },
  REGT: { backgroundColor: 'rgba(147, 51, 234, 0.9)', color: '#fff' },
  BATTALION: { backgroundColor: 'rgba(22, 163, 74, 0.9)', color: '#fff' },
  BN: { backgroundColor: 'rgba(22, 163, 74, 0.9)', color: '#fff' },
  SQDN: { backgroundColor: 'rgba(8, 145, 178, 0.9)', color: '#fff' },
  COMPANY: { backgroundColor: 'rgba(217, 119, 6, 0.9)', color: '#fff' },
  CO: { backgroundColor: 'rgba(217, 119, 6, 0.9)', color: '#fff' },
  PLATOON: { backgroundColor: 'rgba(202, 138, 4, 0.9)', color: '#000' },
  PLT: { backgroundColor: 'rgba(202, 138, 4, 0.9)', color: '#000' },
  SQUAD: { backgroundColor: 'rgba(234, 88, 12, 0.9)', color: '#fff' },
  SQD: { backgroundColor: 'rgba(234, 88, 12, 0.9)', color: '#fff' },
  FIRE_TEAM: { backgroundColor: 'rgba(220, 38, 38, 0.9)', color: '#fff' },
  FT: { backgroundColor: 'rgba(220, 38, 38, 0.9)', color: '#fff' },
  INDIVIDUAL: { backgroundColor: 'rgba(107, 114, 128, 0.9)', color: '#fff' },
  INDV: { backgroundColor: 'rgba(107, 114, 128, 0.9)', color: '#fff' },
  CUSTOM: { backgroundColor: 'rgba(156, 163, 175, 0.9)', color: '#fff' },
};

function getBadgeStyle(echelon: string): React.CSSProperties {
  return ECHELON_BADGE_STYLES[echelon] ?? { backgroundColor: 'rgba(107, 114, 128, 0.7)', color: '#fff' };
}

// ---------------------------------------------------------------------------
// Tree building helpers
// ---------------------------------------------------------------------------

function buildTree(units: Unit[]): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  for (const u of units) {
    byId.set(u.id, {
      id: u.id,
      name: u.name,
      abbreviation: u.abbreviation,
      echelon: u.echelon,
      parentId: u.parentId,
      uic: u.uic,
      childNodes: [],
      depth: 0,
    });
  }

  const roots: TreeNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.childNodes.push(node);
    } else {
      roots.push(node);
    }
  }

  function assignDepth(node: TreeNode, depth: number) {
    node.depth = depth;
    for (const child of node.childNodes) {
      assignDepth(child, depth + 1);
    }
  }
  for (const root of roots) {
    assignDepth(root, 0);
  }

  return roots;
}

/** Collect all ancestor IDs for a given unit ID */
function getAncestorIds(unitId: string, units: Unit[]): string[] {
  const byId = new Map<string, Unit>();
  for (const u of units) byId.set(u.id, u);

  const ancestors: string[] = [];
  let current = byId.get(unitId);
  while (current?.parentId) {
    ancestors.push(current.parentId);
    current = byId.get(current.parentId);
  }
  return ancestors;
}

/** Find all node IDs that match search, plus their ancestor chains */
function getMatchingIdsWithAncestors(
  search: string,
  units: Unit[],
): Set<string> {
  const q = search.toLowerCase();
  const matching = new Set<string>();

  for (const u of units) {
    const searchable = `${u.name} ${u.abbreviation ?? ''} ${u.uic}`.toLowerCase();
    if (searchable.includes(q)) {
      matching.add(u.id);
      // Add all ancestors so the path to this node is visible
      for (const aid of getAncestorIds(u.id, units)) {
        matching.add(aid);
      }
    }
  }
  return matching;
}

/** Collect all descendant IDs from a tree */
function collectAllIds(nodes: TreeNode[]): string[] {
  const ids: string[] = [];
  function walk(node: TreeNode) {
    ids.push(node.id);
    for (const child of node.childNodes) walk(child);
  }
  for (const node of nodes) walk(node);
  return ids;
}

// ---------------------------------------------------------------------------
// UnitSelector component
// ---------------------------------------------------------------------------

export default function UnitSelector({
  selectedUnitId,
  onSelectUnit,
  className,
}: UnitSelectorProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch units on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchUnits() {
      try {
        let data: Unit[];
        if (isDemoMode) {
          data = await mockApi.getUnits();
        } else {
          const res = await apiClient.get<Unit[]>('/units');
          data = res.data;
        }
        if (!cancelled) {
          setUnits(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch units:', err);
        if (!cancelled) setLoading(false);
      }
    }

    fetchUnits();
    return () => { cancelled = true; };
  }, []);

  // Build tree
  const tree = useMemo(() => buildTree(units), [units]);

  // When units load, set default expansion: expand I MEF (first root) and auto-expand to selected
  useEffect(() => {
    if (units.length === 0) return;
    const initial = new Set<string>();
    // Expand first root (I MEF typically)
    if (tree.length > 0) {
      initial.add(tree[0].id);
    }
    // Expand to selected unit
    if (selectedUnitId) {
      for (const aid of getAncestorIds(selectedUnitId, units)) {
        initial.add(aid);
      }
    }
    setExpandedIds(initial);
  }, [units, tree, selectedUnitId]);

  // Filter tree when searching
  const visibleIds = useMemo(() => {
    if (!search.trim()) return null; // null = show all
    return getMatchingIdsWithAncestors(search.trim(), units);
  }, [search, units]);

  // When searching, expand all matching ancestors
  useEffect(() => {
    if (visibleIds) {
      setExpandedIds(new Set(visibleIds));
    }
  }, [visibleIds]);

  // Build flat visible rows list for keyboard navigation
  const visibleRows = useMemo(() => {
    const rows: { id: string; node: TreeNode }[] = [];

    function walk(node: TreeNode) {
      // If searching, skip nodes not in the visible set
      if (visibleIds && !visibleIds.has(node.id)) return;
      rows.push({ id: node.id, node });
      if (expandedIds.has(node.id)) {
        for (const child of node.childNodes) {
          walk(child);
        }
      }
    }

    for (const root of tree) walk(root);
    return rows;
  }, [tree, expandedIds, visibleIds]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
        setFocusedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [isOpen]);

  const toggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback((unitId: string | null) => {
    onSelectUnit(unitId);
    setIsOpen(false);
    setSearch('');
    setFocusedIndex(-1);
  }, [onSelectUnit]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // total rows = 1 (All Units) + visibleRows
    const totalItems = 1 + visibleRows.length;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, totalItems - 1));
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (focusedIndex === 0) {
          handleSelect(null);
        } else if (focusedIndex > 0 && focusedIndex <= visibleRows.length) {
          const row = visibleRows[focusedIndex - 1];
          handleSelect(row.id);
        }
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        if (focusedIndex > 0 && focusedIndex <= visibleRows.length) {
          const row = visibleRows[focusedIndex - 1];
          if (row.node.childNodes.length > 0 && !expandedIds.has(row.id)) {
            toggle(row.id);
          }
        }
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        if (focusedIndex > 0 && focusedIndex <= visibleRows.length) {
          const row = visibleRows[focusedIndex - 1];
          if (expandedIds.has(row.id)) {
            toggle(row.id);
          }
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        setIsOpen(false);
        setSearch('');
        setFocusedIndex(-1);
        break;
      }
    }
  }, [focusedIndex, visibleRows, expandedIds, handleSelect, toggle]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-unit-row]');
      items[focusedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  // Find display name for currently selected unit
  const selectedLabel = useMemo(() => {
    if (!selectedUnitId) return 'ALL UNITS';
    const unit = units.find((u) => u.id === selectedUnitId);
    return unit?.abbreviation || unit?.name || 'ALL UNITS';
  }, [selectedUnitId, units]);

  // ---------- Render ----------

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative' }}
      className={className}
    >
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '8px 10px',
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          color: 'var(--color-text)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 6,
          transition: 'border-color var(--transition)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <Building2 size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {loading ? 'Loading...' : selectedLabel}
          </span>
        </span>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--color-text-muted)',
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 150ms',
          }}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius)',
            zIndex: 50,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 360,
          }}
          onKeyDown={handleKeyDown}
        >
          {/* Search input */}
          <div style={{ padding: '8px 8px 4px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={12}
                style={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search units..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setFocusedIndex(-1);
                }}
                style={{
                  width: '100%',
                  padding: '6px 8px 6px 26px',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Scrollable list */}
          <div
            ref={listRef}
            style={{
              overflowY: 'auto',
              flex: 1,
              minHeight: 0,
            }}
          >
            {loading ? (
              <div
                style={{
                  padding: 16,
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--color-text-muted)',
                }}
              >
                Loading units...
              </div>
            ) : (
              <>
                {/* "All Units" option */}
                <button
                  data-unit-row
                  onClick={() => handleSelect(null)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    backgroundColor:
                      selectedUnitId === null
                        ? 'var(--color-bg-hover)'
                        : focusedIndex === 0
                          ? 'rgba(77, 171, 247, 0.08)'
                          : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-bright)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'background-color 100ms',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedUnitId !== null)
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedUnitId !== null && focusedIndex !== 0)
                      e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Building2 size={11} style={{ color: 'var(--color-accent)' }} />
                  ALL UNITS
                </button>

                {/* Tree rows */}
                {visibleRows.map((row, idx) => {
                  const node = row.node;
                  const hasChildren = node.childNodes.length > 0;
                  const expanded = expandedIds.has(node.id);
                  const isSelected = selectedUnitId === node.id;
                  const isFocused = focusedIndex === idx + 1;
                  const indent = node.depth * 14 + 8;
                  const abbrev = ECHELON_ABBREVIATIONS[node.echelon] ?? node.echelon.slice(0, 3).toUpperCase();
                  const badgeStyle = getBadgeStyle(node.echelon);

                  // Determine if this node directly matches search (not just an ancestor)
                  const isDirectMatch =
                    search.trim() &&
                    `${node.name} ${node.abbreviation ?? ''} ${node.uic}`
                      .toLowerCase()
                      .includes(search.trim().toLowerCase());

                  return (
                    <div
                      key={node.id}
                      data-unit-row
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: indent,
                        paddingRight: 8,
                        paddingTop: 4,
                        paddingBottom: 4,
                        backgroundColor: isSelected
                          ? 'var(--color-bg-hover)'
                          : isFocused
                            ? 'rgba(77, 171, 247, 0.08)'
                            : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 100ms',
                        borderBottom: '1px solid var(--color-border)',
                        opacity: search.trim() && !isDirectMatch ? 0.5 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected)
                          e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected && !isFocused)
                          e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      onClick={() => handleSelect(node.id)}
                    >
                      {/* Expand/collapse chevron */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasChildren) toggle(node.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 14,
                          height: 14,
                          flexShrink: 0,
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: hasChildren ? 'pointer' : 'default',
                          color: hasChildren ? 'var(--color-text-muted)' : 'transparent',
                          marginRight: 4,
                        }}
                        tabIndex={-1}
                      >
                        {hasChildren ? (
                          expanded ? (
                            <ChevronDown size={10} />
                          ) : (
                            <ChevronRight size={10} />
                          )
                        ) : (
                          <span style={{ width: 10, display: 'inline-block' }} />
                        )}
                      </button>

                      {/* Echelon badge */}
                      <span
                        style={{
                          flexShrink: 0,
                          fontFamily: 'var(--font-mono)',
                          fontSize: 7,
                          fontWeight: 700,
                          letterSpacing: '0.3px',
                          padding: '1px 4px',
                          borderRadius: 2,
                          marginRight: 6,
                          minWidth: 22,
                          textAlign: 'center',
                          ...badgeStyle,
                        }}
                      >
                        {abbrev}
                      </span>

                      {/* Unit name */}
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? 'var(--color-text-bright)' : 'var(--color-text)',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          minWidth: 0,
                        }}
                        title={`${node.name}${node.abbreviation ? ` (${node.abbreviation})` : ''}`}
                      >
                        {node.abbreviation || node.name}
                      </span>
                    </div>
                  );
                })}

                {visibleRows.length === 0 && search.trim() && (
                  <div
                    style={{
                      padding: 16,
                      textAlign: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    No units match "{search}"
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
