import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
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

interface CommandItem {
  id: string;
  label: string;
  category: string;
  icon: React.ReactNode;
  path?: string;
  subtitle?: string;
}

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

const mockItems: CommandItem[] = [
  { id: 'm-personnel-1', label: 'SSgt Martinez', category: 'Personnel', icon: <Users size={16} />, subtitle: '0811 - Alpha Co', path: '/personnel' },
  { id: 'm-personnel-2', label: 'Cpl Johnson', category: 'Personnel', icon: <Users size={16} />, subtitle: '0311 - Bravo Co', path: '/personnel' },
  { id: 'm-personnel-3', label: 'LCpl Rivera', category: 'Personnel', icon: <Users size={16} />, subtitle: '0621 - Comm Plt', path: '/personnel' },
  { id: 'm-equipment-1', label: 'JLTV B-214', category: 'Equipment', icon: <Truck size={16} />, subtitle: 'FMC - Alpha Co', path: '/equipment' },
  { id: 'm-equipment-2', label: 'MTVR C-108', category: 'Equipment', icon: <Truck size={16} />, subtitle: 'NMC - Motor T', path: '/equipment' },
  { id: 'm-equipment-3', label: 'M777 A-003', category: 'Equipment', icon: <Shield size={16} />, subtitle: 'PMC - Weapons Co', path: '/equipment' },
  { id: 'm-req-1', label: 'REQ-2026-0047', category: 'Requisitions', icon: <ClipboardList size={16} />, subtitle: 'Pending - 5.56mm Ball', path: '/requisitions' },
  { id: 'm-req-2', label: 'REQ-2026-0052', category: 'Requisitions', icon: <ClipboardList size={16} />, subtitle: 'Approved - MRE Cases', path: '/requisitions' },
  { id: 'm-wo-1', label: 'WO-2026-0189', category: 'Work Orders', icon: <Wrench size={16} />, subtitle: 'Open - JLTV Engine Swap', path: '/maintenance' },
  { id: 'm-wo-2', label: 'WO-2026-0193', category: 'Work Orders', icon: <Wrench size={16} />, subtitle: 'In Progress - MTVR Brakes', path: '/maintenance' },
  { id: 'm-unit-1', label: '1st Bn, 5th Marines', category: 'Units', icon: <Shield size={16} />, subtitle: 'Infantry Battalion', path: '/readiness' },
  { id: 'm-unit-2', label: 'CLB-5', category: 'Units', icon: <Shield size={16} />, subtitle: 'Combat Logistics Bn', path: '/readiness' },
];

const allItems = [...pageItems, ...mockItems];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (!query.trim()) return pageItems;
    const q = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  }, [query]);

  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
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
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const selectItem = useCallback(
    (item: CommandItem) => {
      if (item.path) {
        navigate(item.path);
      }
      close();
    },
    [navigate, close]
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
      // Small delay to ensure the DOM is rendered
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
    [flatItems, selectedIndex, selectItem, close]
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
          <Search size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
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
          {flatItems.length === 0 ? (
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
