import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Loader2,
  FileText,
  Users,
  Wrench,
  Truck,
  Package,
  LayoutDashboard,
  Map,
  Shield,
  Activity,
  Heart,
  Fuel,
  Lock,
  Database,
  HardDrive,
  BarChart3,
  Bell,
  ClipboardList,
  BookOpen,
  Settings,
} from 'lucide-react';
import { isDemoMode } from '@/api/mockClient';
import { DEMO_USERS_LIST } from '@/api/demoUsers';
import apiClient from '@/api/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CommandItem {
  id: string;
  label: string;
  category: string;
  icon: React.ReactNode;
  path?: string;
  subtitle?: string;
}

// ---------------------------------------------------------------------------
// Static data: Pages (always hardcoded)
// ---------------------------------------------------------------------------

const pageItems: CommandItem[] = [
  { id: 'p-dashboard', label: 'Dashboard', category: 'Pages', icon: <LayoutDashboard size={16} />, path: '/dashboard' },
  { id: 'p-map', label: 'Map', category: 'Pages', icon: <Map size={16} />, path: '/map' },
  { id: 'p-supply', label: 'Supply', category: 'Pages', icon: <Package size={16} />, path: '/supply' },
  { id: 'p-equipment', label: 'Equipment', category: 'Pages', icon: <Wrench size={16} />, path: '/equipment' },
  { id: 'p-maintenance', label: 'Maintenance', category: 'Pages', icon: <Wrench size={16} />, path: '/maintenance' },
  { id: 'p-requisitions', label: 'Requisitions', category: 'Pages', icon: <ClipboardList size={16} />, path: '/requisitions' },
  { id: 'p-personnel', label: 'Personnel', category: 'Pages', icon: <Users size={16} />, path: '/personnel' },
  { id: 'p-readiness', label: 'Readiness', category: 'Pages', icon: <Activity size={16} />, path: '/readiness' },
  { id: 'p-medical', label: 'Medical', category: 'Pages', icon: <Heart size={16} />, path: '/medical' },
  { id: 'p-transportation', label: 'Transportation', category: 'Pages', icon: <Truck size={16} />, path: '/transportation' },
  { id: 'p-fuel', label: 'Fuel', category: 'Pages', icon: <Fuel size={16} />, path: '/fuel' },
  { id: 'p-custody', label: 'Custody', category: 'Pages', icon: <Lock size={16} />, path: '/custody' },
  { id: 'p-ingestion', label: 'Ingestion', category: 'Pages', icon: <Database size={16} />, path: '/ingestion' },
  { id: 'p-datasources', label: 'Data Sources', category: 'Pages', icon: <HardDrive size={16} />, path: '/data-sources' },
  { id: 'p-reports', label: 'Reports', category: 'Pages', icon: <BarChart3 size={16} />, path: '/reports' },
  { id: 'p-alerts', label: 'Alerts', category: 'Pages', icon: <Bell size={16} />, path: '/alerts' },
  { id: 'p-audit', label: 'Audit', category: 'Pages', icon: <FileText size={16} />, path: '/audit' },
  { id: 'p-admin', label: 'Admin', category: 'Pages', icon: <Settings size={16} />, path: '/admin' },
  { id: 'p-docs', label: 'Docs', category: 'Pages', icon: <BookOpen size={16} />, path: '/docs' },
];

// ---------------------------------------------------------------------------
// Demo data: Equipment, Units, Requisitions, Work Orders
// ---------------------------------------------------------------------------

const demoEquipment = [
  { id: 'eq-01', label: 'HMMWV H-12', subtitle: 'FMC - Alpha Btry', path: '/equipment' },
  { id: 'eq-02', label: 'HMMWV H-15', subtitle: 'PMC - H&S Btry', path: '/equipment' },
  { id: 'eq-03', label: 'MTVR M-05', subtitle: 'FMC - Motor T', path: '/equipment' },
  { id: 'eq-04', label: 'MTVR M-09', subtitle: 'NMC - Bravo Btry', path: '/equipment' },
  { id: 'eq-05', label: 'MTVR M-14', subtitle: 'FMC - Charlie Btry', path: '/equipment' },
  { id: 'eq-06', label: 'JLTV J-08', subtitle: 'FMC - Alpha Btry', path: '/equipment' },
  { id: 'eq-07', label: 'JLTV J-11', subtitle: 'PMC - Bravo Btry', path: '/equipment' },
  { id: 'eq-08', label: 'JLTV J-03', subtitle: 'FMC - H&S Btry', path: '/equipment' },
  { id: 'eq-09', label: 'M777 A-04', subtitle: 'FMC - Alpha Btry', path: '/equipment' },
  { id: 'eq-10', label: 'M777 A-06', subtitle: 'PMC - Alpha Btry', path: '/equipment' },
  { id: 'eq-11', label: 'LAV L-01', subtitle: 'FMC - Weapons Plt', path: '/equipment' },
  { id: 'eq-12', label: 'AAV A-03', subtitle: 'NMC - Charlie Btry', path: '/equipment' },
  { id: 'eq-13', label: 'LVSR L-03', subtitle: 'FMC - Motor T', path: '/equipment' },
  { id: 'eq-14', label: 'LVS LV-07', subtitle: 'FMC - H&S Btry', path: '/equipment' },
  { id: 'eq-15', label: 'HIMARS HR-02', subtitle: 'FMC - Bravo Btry', path: '/equipment' },
];

const demoUnits = [
  { id: 'u-01', label: '1/11 Marines', subtitle: 'Artillery Battalion', path: '/dashboard' },
  { id: 'u-02', label: 'A Btry 1/11', subtitle: 'Alpha Battery', path: '/dashboard' },
  { id: 'u-03', label: 'B Btry 1/11', subtitle: 'Bravo Battery', path: '/dashboard' },
  { id: 'u-04', label: 'C Btry 1/11', subtitle: 'Charlie Battery', path: '/dashboard' },
  { id: 'u-05', label: 'H&S Btry 1/11', subtitle: 'Headquarters & Service', path: '/dashboard' },
];

const demoRequisitions = [
  { id: 'r-01', label: 'REQ-2026-0341', subtitle: 'Pending - 5.56mm Ball M855', path: '/requisitions' },
  { id: 'r-02', label: 'REQ-2026-0347', subtitle: 'Approved - MRE Cases (120)', path: '/requisitions' },
  { id: 'r-03', label: 'REQ-2026-0352', subtitle: 'Pending - MOPP Gear Resupply', path: '/requisitions' },
  { id: 'r-04', label: 'REQ-2026-0358', subtitle: 'In Transit - 7.62mm Linked', path: '/requisitions' },
  { id: 'r-05', label: 'REQ-2026-0361', subtitle: 'Approved - Hydraulic Fluid', path: '/requisitions' },
  { id: 'r-06', label: 'REQ-2026-0365', subtitle: 'Pending - Radio Batteries', path: '/requisitions' },
  { id: 'r-07', label: 'REQ-2026-0370', subtitle: 'Rejected - NVG Lenses', path: '/requisitions' },
  { id: 'r-08', label: 'REQ-2026-0374', subtitle: 'Approved - Engine Oil 15W-40', path: '/requisitions' },
  { id: 'r-09', label: 'REQ-2026-0379', subtitle: 'Pending - Tow Bar Assembly', path: '/requisitions' },
  { id: 'r-10', label: 'REQ-2026-0383', subtitle: 'In Transit - Brake Pads MTVR', path: '/requisitions' },
];

const demoWorkOrders = [
  { id: 'w-01', label: 'WO-1185', subtitle: 'Open - JLTV Transmission Swap', path: '/maintenance' },
  { id: 'w-02', label: 'WO-1187', subtitle: 'In Progress - MTVR Brake Overhaul', path: '/maintenance' },
  { id: 'w-03', label: 'WO-1192', subtitle: 'Open - M777 Recoil System', path: '/maintenance' },
  { id: 'w-04', label: 'WO-1195', subtitle: 'Awaiting Parts - HMMWV Alternator', path: '/maintenance' },
  { id: 'w-05', label: 'WO-1198', subtitle: 'In Progress - LVSR Hydraulics', path: '/maintenance' },
  { id: 'w-06', label: 'WO-1201', subtitle: 'Open - AAV Track Replacement', path: '/maintenance' },
  { id: 'w-07', label: 'WO-1204', subtitle: 'Completed - JLTV PMCS Findings', path: '/maintenance' },
  { id: 'w-08', label: 'WO-1207', subtitle: 'In Progress - Generator 10kW', path: '/maintenance' },
];

// ---------------------------------------------------------------------------
// Max results per category / total
// ---------------------------------------------------------------------------

const MAX_PER_CATEGORY = 5;
const MAX_TOTAL = 20;

// ---------------------------------------------------------------------------
// Search helpers
// ---------------------------------------------------------------------------

function matchesQuery(q: string, ...fields: (string | undefined)[]): boolean {
  for (const f of fields) {
    if (f && f.toLowerCase().includes(q)) return true;
  }
  return false;
}

function searchDemoData(q: string): CommandItem[] {
  const results: CommandItem[] = [];

  // Personnel from demoUsers
  const personnelMatches: CommandItem[] = [];
  for (const u of DEMO_USERS_LIST) {
    if (personnelMatches.length >= MAX_PER_CATEGORY) break;
    if (matchesQuery(q, u.full_name, u.rank, u.mos, u.billet, u.unit)) {
      personnelMatches.push({
        id: `demo-per-${u.username}`,
        label: `${u.rank} ${u.full_name}`,
        category: 'Personnel',
        icon: <Users size={16} />,
        subtitle: `${u.mos} - ${u.unit}`,
        path: `/personnel?search=${encodeURIComponent(u.full_name)}`,
      });
    }
  }
  results.push(...personnelMatches);

  // Equipment
  const eqMatches: CommandItem[] = [];
  for (const e of demoEquipment) {
    if (eqMatches.length >= MAX_PER_CATEGORY) break;
    if (matchesQuery(q, e.label, e.subtitle)) {
      eqMatches.push({
        id: `demo-${e.id}`,
        label: e.label,
        category: 'Equipment',
        icon: <Truck size={16} />,
        subtitle: e.subtitle,
        path: e.path,
      });
    }
  }
  results.push(...eqMatches);

  // Units
  const unitMatches: CommandItem[] = [];
  for (const u of demoUnits) {
    if (unitMatches.length >= MAX_PER_CATEGORY) break;
    if (matchesQuery(q, u.label, u.subtitle)) {
      unitMatches.push({
        id: `demo-${u.id}`,
        label: u.label,
        category: 'Units',
        icon: <Shield size={16} />,
        subtitle: u.subtitle,
        path: u.path,
      });
    }
  }
  results.push(...unitMatches);

  // Requisitions
  const reqMatches: CommandItem[] = [];
  for (const r of demoRequisitions) {
    if (reqMatches.length >= MAX_PER_CATEGORY) break;
    if (matchesQuery(q, r.label, r.subtitle)) {
      reqMatches.push({
        id: `demo-${r.id}`,
        label: r.label,
        category: 'Requisitions',
        icon: <ClipboardList size={16} />,
        subtitle: r.subtitle,
        path: r.path,
      });
    }
  }
  results.push(...reqMatches);

  // Work Orders
  const woMatches: CommandItem[] = [];
  for (const w of demoWorkOrders) {
    if (woMatches.length >= MAX_PER_CATEGORY) break;
    if (matchesQuery(q, w.label, w.subtitle)) {
      woMatches.push({
        id: `demo-${w.id}`,
        label: w.label,
        category: 'Work Orders',
        icon: <Wrench size={16} />,
        subtitle: w.subtitle,
        path: w.path,
      });
    }
  }
  results.push(...woMatches);

  return results;
}

async function searchLiveApi(q: string): Promise<CommandItem[]> {
  const results: CommandItem[] = [];

  // Personnel search
  try {
    const res = await apiClient.get('/personnel', { params: { search: q, limit: MAX_PER_CATEGORY } });
    const items = res.data?.items ?? res.data?.data ?? res.data ?? [];
    if (Array.isArray(items)) {
      for (const p of items.slice(0, MAX_PER_CATEGORY)) {
        const name = p.full_name || p.name || p.last_name || 'Unknown';
        const rank = p.rank || '';
        const mos = p.mos || '';
        const unit = p.unit_name || p.unit || '';
        results.push({
          id: `api-per-${p.id || name}`,
          label: rank ? `${rank} ${name}` : name,
          category: 'Personnel',
          icon: <Users size={16} />,
          subtitle: [mos, unit].filter(Boolean).join(' - '),
          path: `/personnel?search=${encodeURIComponent(name)}`,
        });
      }
    }
  } catch {
    // API doesn't support personnel search -- fall back to demo data for this category
    const demoPersonnel = searchDemoData(q).filter((i) => i.category === 'Personnel');
    results.push(...demoPersonnel);
  }

  // Equipment search
  try {
    const res = await apiClient.get('/equipment/status', { params: { search: q, limit: MAX_PER_CATEGORY } });
    const items = res.data?.items ?? res.data?.data ?? res.data ?? [];
    if (Array.isArray(items)) {
      for (const e of items.slice(0, MAX_PER_CATEGORY)) {
        const label = e.bumper_number || e.name || e.serial_number || 'Unknown';
        const status = e.status || e.readiness_status || '';
        const unit = e.unit_name || e.unit || '';
        results.push({
          id: `api-eq-${e.id || label}`,
          label,
          category: 'Equipment',
          icon: <Truck size={16} />,
          subtitle: [status, unit].filter(Boolean).join(' - '),
          path: '/equipment',
        });
      }
    }
  } catch {
    // Fall back to demo equipment
    const demoEq = searchDemoData(q).filter((i) => i.category === 'Equipment');
    results.push(...demoEq);
  }

  // Units, Requisitions, Work Orders -- use demo data as fallback since
  // there may not be dedicated search endpoints for these yet
  const demoOther = searchDemoData(q).filter(
    (i) => i.category === 'Units' || i.category === 'Requisitions' || i.category === 'Work Orders',
  );
  results.push(...demoOther);

  return results;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [apiResults, setApiResults] = useState<CommandItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  // ---- Filtered page items (always synchronous) ----
  const filteredPages = useMemo(() => {
    if (!query.trim()) return pageItems;
    const q = query.toLowerCase();
    return pageItems.filter((item) => matchesQuery(q, item.label, item.category)).slice(0, MAX_PER_CATEGORY);
  }, [query]);

  // ---- Demo data results (synchronous) ----
  const demoResults = useMemo(() => {
    if (!query.trim()) return [];
    return searchDemoData(query.toLowerCase());
  }, [query]);

  // ---- Live API search with debounce (async, non-demo only) ----
  useEffect(() => {
    if (isDemoMode || !query.trim()) {
      setApiResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      let cancelled = false;
      searchLiveApi(query.toLowerCase())
        .then((results) => {
          if (!cancelled) {
            setApiResults(results);
            setIsSearching(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            // Fall back to demo data on total failure
            setApiResults(searchDemoData(query.toLowerCase()));
            setIsSearching(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // ---- Combine results with limits ----
  const filtered = useMemo(() => {
    const dataResults = isDemoMode ? demoResults : apiResults;
    const combined = [...filteredPages, ...dataResults];
    return combined.slice(0, MAX_TOTAL);
  }, [filteredPages, demoResults, apiResults]);

  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = [];
      if (groups[item.category].length < MAX_PER_CATEGORY) {
        groups[item.category].push(item);
      }
    }
    return groups;
  }, [filtered]);

  const flatItems = useMemo(() => {
    const result: CommandItem[] = [];
    for (const cat of Object.keys(grouped)) {
      result.push(...grouped[cat]);
    }
    return result;
  }, [grouped]);

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setSelectedIndex(0);
    setApiResults([]);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
    setApiResults([]);
  }, []);

  const selectItem = useCallback(
    (item: CommandItem) => {
      if (item.path) {
        navigate(item.path);
      }
      close();
    },
    [navigate, close],
  );

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          close();
        } else {
          open();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, open, close]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Arrow key navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          selectItem(flatItems[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    },
    [flatItems, selectedIndex, selectItem, close],
  );

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 120,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        style={{
          width: '90%',
          maxWidth: 560,
          backgroundColor: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          animation: 'slideUp 0.2s ease forwards',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 480,
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {isSearching ? (
            <Loader2 size={16} style={{ color: 'var(--color-accent)', flexShrink: 0, animation: 'spin 1s linear infinite' }} />
          ) : (
            <Search size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          )}
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages, equipment, personnel..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--color-text-bright)',
            }}
          />
          {isSearching && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-text-muted)',
                flexShrink: 0,
              }}
            >
              Searching...
            </span>
          )}
          <button
            onClick={close}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '2px 6px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
            }}
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 0',
          }}
        >
          {flatItems.length === 0 && !isSearching ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--color-text-muted)',
              }}
            >
              No results found
            </div>
          ) : flatItems.length === 0 && isSearching ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--color-text-muted)',
              }}
            >
              Searching...
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => {
              // Calculate the starting index of this category in flatItems
              let categoryStartIndex = 0;
              for (const cat of Object.keys(grouped)) {
                if (cat === category) break;
                categoryStartIndex += grouped[cat].length;
              }

              return (
                <div key={category}>
                  <div
                    style={{
                      padding: '8px 16px 4px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {category}
                  </div>
                  {items.map((item, itemIndex) => {
                    const globalIndex = categoryStartIndex + itemIndex;
                    const isSelected = globalIndex === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        data-selected={isSelected}
                        onClick={() => selectItem(item)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 16px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--color-bg-hover)' : 'transparent',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          color: isSelected ? 'var(--color-text-bright)' : 'var(--color-text)',
                          transition: 'background-color 0.1s ease',
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                      >
                        <span
                          style={{
                            color: isSelected ? 'var(--color-accent)' : 'var(--color-text-muted)',
                            display: 'flex',
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </span>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {item.subtitle && (
                          <span
                            style={{
                              fontSize: 10,
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '8px 16px',
            borderTop: '1px solid var(--color-border)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--color-text-muted)',
          }}
        >
          <span>
            <kbd style={kbdStyle}>&uarr;</kbd>
            <kbd style={kbdStyle}>&darr;</kbd>
            {' '}Navigate
          </span>
          <span>
            <kbd style={kbdStyle}>&crarr;</kbd>
            {' '}Select
          </span>
          <span>
            <kbd style={kbdStyle}>Esc</kbd>
            {' '}Close
          </span>
        </div>
      </div>
    </div>
  );
}

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '1px 5px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  backgroundColor: 'var(--color-bg-surface)',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  lineHeight: '16px',
  marginRight: 2,
};
