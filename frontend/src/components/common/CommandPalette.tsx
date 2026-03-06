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
  Terminal,
  Hash,
  AtSign,
  AlertCircle,
  Slash,
  X,
  Clock,
  Copy,
  HelpCircle,
  Moon,
  RotateCcw,
  Plus,
  Navigation,
  Eye,
  Keyboard,
  Command,
} from 'lucide-react';
import { isDemoMode } from '@/api/mockClient';
import { DEMO_USERS_LIST } from '@/api/demoUsers';
import type { DemoUser } from '@/api/demoUsers';
import apiClient from '@/api/client';
import {
  DEMO_SUPPLY_RECORDS,
  DEMO_INDIVIDUAL_EQUIPMENT,
  DEMO_MOVEMENTS,
  DEMO_ALERTS,
  DEMO_PERSONNEL,
  DEMO_WORK_ORDERS,
  DEMO_REPORTS,
  DEMO_UNITS,
} from '@/api/mockData';
import { useModalStore } from '@/stores/modalStore';
import { useHelpMode } from '@/hooks/useHelpMode';
import { resetGuidedTour } from '@/components/onboarding/GuidedTour';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CategoryKey =
  | 'Recent'
  | 'Commands'
  | 'Pages'
  | 'Personnel'
  | 'Equipment'
  | 'Supply'
  | 'Work Orders'
  | 'Requisitions'
  | 'Units'
  | 'Alerts'
  | 'Convoys'
  | 'Reports';

type ModePrefix = '>' | '#' | '@' | '!' | '/' | null;

interface CommandItem {
  id: string;
  label: string;
  category: CategoryKey;
  icon: React.ReactNode;
  path?: string;
  subtitle?: string;
  action?: () => void;
  shortcut?: string;
  score?: number;
}

interface FuzzyResult {
  score: number;
  indices: number[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_PER_CATEGORY = 8;
const MAX_TOTAL = 40;
const RECENT_KEY = 'keystone_cmd_recent';
const MAX_RECENT = 5;
const DEBOUNCE_MS = 300;

const CATEGORY_ORDER: CategoryKey[] = [
  'Recent',
  'Commands',
  'Pages',
  'Personnel',
  'Equipment',
  'Supply',
  'Work Orders',
  'Requisitions',
  'Units',
  'Alerts',
  'Convoys',
  'Reports',
];

const CATEGORY_COLORS: Record<CategoryKey, string> = {
  Recent: 'var(--color-text-muted)',
  Commands: 'var(--color-warning)',
  Pages: 'var(--color-accent)',
  Personnel: 'var(--color-success)',
  Equipment: 'var(--color-accent)',
  Supply: 'var(--color-warning)',
  'Work Orders': 'var(--color-danger)',
  Requisitions: 'var(--color-warning)',
  Units: 'var(--color-accent)',
  Alerts: 'var(--color-danger)',
  Convoys: 'var(--color-success)',
  Reports: 'var(--color-text-muted)',
};

// ---------------------------------------------------------------------------
// Fuzzy Matching
// ---------------------------------------------------------------------------

function fuzzyMatch(query: string, target: string): FuzzyResult | null {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  if (!q) return { score: 0, indices: [] };

  // Exact substring match — highest score
  const substringIdx = t.indexOf(q);
  if (substringIdx !== -1) {
    const indices = Array.from({ length: q.length }, (_, i) => substringIdx + i);
    // Bonus for match at start
    const startBonus = substringIdx === 0 ? 50 : 0;
    return { score: 1000 + startBonus, indices };
  }

  // Word boundary match
  const words = t.split(/[\s\-_/.,()]+/);
  let wordBoundaryIndices: number[] = [];
  let wordMatchCount = 0;
  let qPos = 0;
  let charOffset = 0;

  for (const word of words) {
    const wordStart = t.indexOf(word, charOffset);
    if (qPos < q.length && word.startsWith(q[qPos])) {
      let matchLen = 0;
      for (let i = 0; i < word.length && qPos + matchLen < q.length; i++) {
        if (word[i] === q[qPos + matchLen]) {
          wordBoundaryIndices.push(wordStart + i);
          matchLen++;
        }
      }
      if (matchLen > 0) {
        wordMatchCount++;
        qPos += matchLen;
      }
    }
    charOffset = wordStart + word.length;
  }

  if (qPos === q.length && wordMatchCount > 0) {
    return { score: 500 + wordMatchCount * 50, indices: wordBoundaryIndices };
  }

  // Consecutive character match
  let consecutiveIndices: number[] = [];
  let cPos = 0;
  let maxConsecutive = 0;
  let currentConsecutive = 0;

  for (let i = 0; i < t.length && cPos < q.length; i++) {
    if (t[i] === q[cPos]) {
      consecutiveIndices.push(i);
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      cPos++;
    } else {
      currentConsecutive = 0;
    }
  }

  if (cPos === q.length) {
    const consecutiveScore = 200 + maxConsecutive * 30;
    // Penalize spread — the closer together the better
    const spread = consecutiveIndices[consecutiveIndices.length - 1] - consecutiveIndices[0];
    const spreadPenalty = Math.max(0, spread - q.length) * 2;
    return { score: Math.max(1, consecutiveScore - spreadPenalty), indices: consecutiveIndices };
  }

  return null;
}

function bestFuzzyScore(query: string, ...fields: (string | undefined)[]): FuzzyResult | null {
  let best: FuzzyResult | null = null;
  for (const f of fields) {
    if (!f) continue;
    const result = fuzzyMatch(query, f);
    if (result && (!best || result.score > best.score)) {
      best = result;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Highlight matched characters in label
// ---------------------------------------------------------------------------

function HighlightLabel({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const result = fuzzyMatch(query, text);
  if (!result || result.indices.length === 0) return <>{text}</>;

  const indexSet = new Set(result.indices);
  const parts: React.ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    if (indexSet.has(i)) {
      let end = i;
      while (end < text.length && indexSet.has(end)) end++;
      parts.push(
        <span key={i} style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
          {text.slice(i, end)}
        </span>,
      );
      i = end;
    } else {
      let end = i;
      while (end < text.length && !indexSet.has(end)) end++;
      parts.push(<span key={i}>{text.slice(i, end)}</span>);
      i = end;
    }
  }
  return <>{parts}</>;
}

// ---------------------------------------------------------------------------
// Page definitions with aliases
// ---------------------------------------------------------------------------

interface PageDef {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  aliases: string[];
  shortcut?: string;
}

const PAGE_DEFS: PageDef[] = [
  { id: 'p-dashboard', label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={16} />, aliases: ['home', 'main', 'overview', 'cop'], shortcut: 'G D' },
  { id: 'p-map', label: 'Map', path: '/map', icon: <Map size={16} />, aliases: ['geo', 'location', 'gis', 'spatial'], shortcut: 'G M' },
  { id: 'p-supply', label: 'Supply', path: '/supply', icon: <Package size={16} />, aliases: ['logistics', 's4', 'class', 'inventory', 'stock'], shortcut: 'G S' },
  { id: 'p-equipment', label: 'Equipment', path: '/equipment', icon: <Wrench size={16} />, aliases: ['gear', 'vehicles', 'property', 'tmc', 'tamcn'], shortcut: 'G E' },
  { id: 'p-maintenance', label: 'Maintenance', path: '/maintenance', icon: <Wrench size={16} />, aliases: ['maint', 'repair', 'wo', 'work order', 'mro'], shortcut: 'G W' },
  { id: 'p-requisitions', label: 'Requisitions', path: '/requisitions', icon: <ClipboardList size={16} />, aliases: ['req', 'order', 'request', 'procurement'], shortcut: 'G R' },
  { id: 'p-personnel', label: 'Personnel', path: '/personnel', icon: <Users size={16} />, aliases: ['people', 'marines', 'roster', 's1', 'manpower'], shortcut: 'G P' },
  { id: 'p-readiness', label: 'Readiness', path: '/readiness', icon: <Activity size={16} />, aliases: ['status', 'capability', 'c-rating', 'drrs'], shortcut: 'G I' },
  { id: 'p-medical', label: 'Medical', path: '/medical', icon: <Heart size={16} />, aliases: ['health', 'casualty', 'medevac', 'aid'] },
  { id: 'p-transportation', label: 'Transportation', path: '/transportation', icon: <Truck size={16} />, aliases: ['transport', 'convoy', 'movement', 'motort', 'motor-t'] },
  { id: 'p-fuel', label: 'Fuel', path: '/fuel', icon: <Fuel size={16} />, aliases: ['petroleum', 'jp8', 'diesel', 'class iii', 'bulk fuel'] },
  { id: 'p-custody', label: 'Custody', path: '/custody', icon: <Lock size={16} />, aliases: ['classified', 'crypto', 'comsec', 'controlled'] },
  { id: 'p-ingestion', label: 'Ingestion', path: '/ingestion', icon: <Database size={16} />, aliases: ['import', 'upload', 'ingest', 'data', 'etl'] },
  { id: 'p-datasources', label: 'Data Sources', path: '/data-sources', icon: <HardDrive size={16} />, aliases: ['sources', 'connections', 'feeds', 'integration'] },
  { id: 'p-reports', label: 'Reports', path: '/reports', icon: <BarChart3 size={16} />, aliases: ['report', 'analytics', 'charts', 'sitrep'] },
  { id: 'p-alerts', label: 'Alerts', path: '/alerts', icon: <Bell size={16} />, aliases: ['notifications', 'warning', 'critical'] },
  { id: 'p-audit', label: 'Audit', path: '/audit', icon: <FileText size={16} />, aliases: ['log', 'history', 'trail', 'activity'] },
  { id: 'p-admin', label: 'Admin', path: '/admin', icon: <Settings size={16} />, aliases: ['settings', 'config', 'administration', 'users'] },
  { id: 'p-docs', label: 'Docs', path: '/docs', icon: <BookOpen size={16} />, aliases: ['documentation', 'help', 'manual', 'guide'] },
];

// ---------------------------------------------------------------------------
// Recent Items (localStorage)
// ---------------------------------------------------------------------------

interface RecentEntry {
  id: string;
  label: string;
  category: CategoryKey;
  subtitle?: string;
  path?: string;
}

function getRecentItems(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    return JSON.parse(raw).slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function addRecentItem(item: CommandItem) {
  const entry: RecentEntry = {
    id: item.id,
    label: item.label,
    category: item.category,
    subtitle: item.subtitle,
    path: item.path,
  };
  const existing = getRecentItems().filter((r) => r.id !== entry.id);
  const updated = [entry, ...existing].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {
    // localStorage full or disabled — silently ignore
  }
}

function clearRecentItems() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    // ignore
  }
}

function recentEntryToItem(entry: RecentEntry): CommandItem {
  return {
    id: `recent-${entry.id}`,
    label: entry.label,
    category: 'Recent' as CategoryKey,
    icon: <Clock size={16} />,
    subtitle: entry.subtitle,
    path: entry.path,
  };
}

// ---------------------------------------------------------------------------
// Mode indicator label
// ---------------------------------------------------------------------------

function getModeLabel(prefix: ModePrefix): string {
  switch (prefix) {
    case '>': return 'Commands';
    case '#': return 'Catalog Lookup';
    case '@': return 'Personnel';
    case '!': return 'Equipment';
    case '/': return 'Pages';
    default: return 'Search';
  }
}

function getModeColor(prefix: ModePrefix): string {
  switch (prefix) {
    case '>': return 'var(--color-warning)';
    case '#': return 'var(--color-accent)';
    case '@': return 'var(--color-success)';
    case '!': return 'var(--color-danger)';
    case '/': return 'var(--color-accent)';
    default: return 'var(--color-text-muted)';
  }
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 16px',
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 'var(--radius)',
          background: 'var(--color-bg-hover)',
          animation: 'shimmer 1.5s ease-in-out infinite',
        }}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          style={{
            width: '60%',
            height: 12,
            borderRadius: 'var(--radius)',
            background: 'var(--color-bg-hover)',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
        <div
          style={{
            width: '40%',
            height: 10,
            borderRadius: 'var(--radius)',
            background: 'var(--color-bg-hover)',
            animation: 'shimmer 1.5s ease-in-out infinite',
            animationDelay: '0.2s',
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [rawQuery, setRawQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [apiResults, setApiResults] = useState<CommandItem[]>([]);
  const [recentItems, setRecentItems] = useState<RecentEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();
  const openModal = useModalStore((s) => s.openModal);
  const { toggleHelpMode } = useHelpMode();

  // ---- Parse prefix + query ----
  const prefix: ModePrefix = useMemo(() => {
    if (rawQuery.startsWith('>')) return '>';
    if (rawQuery.startsWith('#')) return '#';
    if (rawQuery.startsWith('@')) return '@';
    if (rawQuery.startsWith('!')) return '!';
    if (rawQuery.startsWith('/')) return '/';
    return null;
  }, [rawQuery]);

  const query = useMemo(() => {
    if (prefix) return rawQuery.slice(1).trim();
    return rawQuery.trim();
  }, [rawQuery, prefix]);

  const queryLower = useMemo(() => query.toLowerCase(), [query]);

  // ---- Command items ----
  const commandItems: CommandItem[] = useMemo(() => {
    const cmds: CommandItem[] = [
      { id: 'cmd-new-req', label: 'New Requisition', category: 'Commands', icon: <Plus size={16} />, subtitle: 'Open requisition form', action: () => openModal('create-requisition') },
      { id: 'cmd-new-wo', label: 'New Work Order', category: 'Commands', icon: <Plus size={16} />, subtitle: 'Open work order form', action: () => openModal('create-work-order') },
      { id: 'cmd-plan-convoy', label: 'Plan Convoy', category: 'Commands', icon: <Truck size={16} />, subtitle: 'Open convoy planner', action: () => openModal('plan-convoy') },
      { id: 'cmd-toggle-help', label: 'Toggle Help Mode', category: 'Commands', icon: <HelpCircle size={16} />, subtitle: 'Show/hide contextual help', action: () => toggleHelpMode() },
      { id: 'cmd-restart-tour', label: 'Restart Onboarding Tour', category: 'Commands', icon: <RotateCcw size={16} />, subtitle: 'Reset and replay guided tour', action: () => { resetGuidedTour(); window.location.reload(); } },
      { id: 'cmd-dark-mode', label: 'Toggle Dark Mode', category: 'Commands', icon: <Moon size={16} />, subtitle: 'Switch light/dark theme', action: () => { /* placeholder */ } },
      { id: 'cmd-copy-url', label: 'Copy Current URL', category: 'Commands', icon: <Copy size={16} />, subtitle: 'Copy page URL to clipboard', action: () => { navigator.clipboard.writeText(window.location.href); } },
      { id: 'cmd-open-docs', label: 'Open Docs', category: 'Commands', icon: <BookOpen size={16} />, subtitle: 'Navigate to documentation', path: '/docs' },
      { id: 'cmd-shortcuts', label: 'View Keyboard Shortcuts', category: 'Commands', icon: <Keyboard size={16} />, subtitle: 'Show shortcut reference', action: () => { window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true })); } },
    ];
    // Navigation commands for all pages
    for (const p of PAGE_DEFS) {
      cmds.push({
        id: `cmd-goto-${p.id}`,
        label: `Go to ${p.label}`,
        category: 'Commands',
        icon: <Navigation size={16} />,
        subtitle: p.path,
        path: p.path,
        shortcut: p.shortcut,
      });
    }
    return cmds;
  }, [openModal, toggleHelpMode]);

  // ---- Page items ----
  const pageItems: CommandItem[] = useMemo(() => {
    return PAGE_DEFS.map((p) => ({
      id: p.id,
      label: p.label,
      category: 'Pages' as CategoryKey,
      icon: p.icon,
      path: p.path,
      subtitle: p.path,
      shortcut: p.shortcut,
    }));
  }, []);

  // ---- Search Pages (with aliases) ----
  const searchPages = useCallback(
    (q: string): CommandItem[] => {
      if (!q) return pageItems;
      const results: (CommandItem & { score: number })[] = [];
      for (const p of PAGE_DEFS) {
        const allSearchable = [p.label, ...p.aliases, p.path];
        let best: FuzzyResult | null = null;
        for (const s of allSearchable) {
          const r = fuzzyMatch(q, s);
          if (r && (!best || r.score > best.score)) best = r;
        }
        if (best) {
          results.push({
            id: p.id,
            label: p.label,
            category: 'Pages',
            icon: p.icon,
            path: p.path,
            subtitle: p.path,
            shortcut: p.shortcut,
            score: best.score,
          });
        }
      }
      return results.sort((a, b) => b.score - a.score).slice(0, MAX_PER_CATEGORY);
    },
    [pageItems],
  );

  // ---- Search Commands ----
  const searchCommands = useCallback(
    (q: string): CommandItem[] => {
      if (!q) return commandItems;
      const results: (CommandItem & { score: number })[] = [];
      for (const cmd of commandItems) {
        const r = bestFuzzyScore(q, cmd.label, cmd.subtitle);
        if (r) {
          results.push({ ...cmd, score: r.score });
        }
      }
      return results.sort((a, b) => b.score - a.score).slice(0, MAX_PER_CATEGORY);
    },
    [commandItems],
  );

  // ---- Search Demo Data ----
  const searchDemoPersonnel = useCallback((q: string): CommandItem[] => {
    const results: (CommandItem & { score: number })[] = [];
    // Search DEMO_USERS_LIST
    for (const u of DEMO_USERS_LIST) {
      const r = bestFuzzyScore(q, u.full_name, u.rank, u.mos, u.billet, u.unit);
      if (r) {
        results.push({
          id: `demo-user-${u.username}`,
          label: `${u.rank} ${u.full_name}`,
          category: 'Personnel',
          icon: <Users size={16} />,
          subtitle: `${u.mos} - ${u.unit}`,
          path: `/personnel?search=${encodeURIComponent(u.full_name)}`,
          score: r.score,
        });
      }
    }
    // Search DEMO_PERSONNEL
    for (const p of DEMO_PERSONNEL) {
      const name = `${p.firstName} ${p.lastName}`;
      const r = bestFuzzyScore(q, name, p.rank, p.mos);
      if (r) {
        const existing = results.find((x) => x.label.includes(p.lastName));
        if (!existing) {
          results.push({
            id: `demo-pers-${p.id}`,
            label: `${p.rank} ${name}`,
            category: 'Personnel',
            icon: <Users size={16} />,
            subtitle: `${p.mos} - ${p.status}`,
            path: `/personnel?search=${encodeURIComponent(name)}`,
            score: r.score,
          });
        }
      }
    }
    return results.sort((a, b) => b.score - a.score).slice(0, MAX_PER_CATEGORY);
  }, []);

  const searchDemoEquipment = useCallback((q: string): CommandItem[] => {
    const results: (CommandItem & { score: number })[] = [];
    for (const e of DEMO_INDIVIDUAL_EQUIPMENT) {
      const r = bestFuzzyScore(q, e.bumperNumber, e.serialNumber, e.equipmentType, e.tamcn, e.unitName);
      if (r) {
        results.push({
          id: `demo-eq-${e.id}`,
          label: `${e.equipmentType} ${e.bumperNumber}`,
          category: 'Equipment',
          icon: <Truck size={16} />,
          subtitle: `${e.status} - ${e.unitName} - S/N: ${e.serialNumber}`,
          path: `/equipment?search=${encodeURIComponent(e.bumperNumber)}`,
          score: r.score,
        });
      }
    }
    return results.sort((a, b) => b.score - a.score).slice(0, MAX_PER_CATEGORY);
  }, []);

  const searchDemoSupply = useCallback((q: string): CommandItem[] => {
    const results: (CommandItem & { score: number })[] = [];
    for (const s of DEMO_SUPPLY_RECORDS) {
      const r = bestFuzzyScore(q, s.item, s.niin, s.unitName, s.supplyClass);
      if (r) {
        results.push({
          id: `demo-sup-${s.id}`,
          label: s.item,
          category: 'Supply',
          icon: <Package size={16} />,
          subtitle: `NIIN: ${s.niin} - ${s.unitName} - OH: ${s.onHand}/${s.authorized}`,
          path: `/supply?search=${encodeURIComponent(s.item)}`,
          score: r.score,
        });
      }
    }
    return results.sort((a, b) => b.score - a.score).slice(0, MAX_PER_CATEGORY);
  }, []);

  const searchDemoWorkOrders = useCallback((q: string): CommandItem[] => {
    const results: (CommandItem & { score: number })[] = [];
    for (const wo of DEMO_WORK_ORDERS) {
      const r = bestFuzzyScore(q, wo.workOrderNumber, wo.description, wo.status, wo.assignedTo);
      if (r) {
        results.push({
          id: `demo-wo-${wo.id}`,
          label: wo.workOrderNumber,
          category: 'Work Orders',
          icon: <Wrench size={16} />,
          subtitle: `${wo.status} - ${wo.description}`,
          path: `/maintenance?search=${encodeURIComponent(wo.workOrderNumber)}`,
          score: r.score,
        });
      }
    }
    return results.sort((a, b) => b.score - a.score).slice(0, MAX_PER_CATEGORY);
  }, []);

  const searchDemoUnits = useCallback((q: string): CommandItem[] => {
    const results: (CommandItem & { score: number })[] = [];
    for (const u of DEMO_UNITS) {
      const r = bestFuzzyScore(q, u.name, u.echelon);
      if (r) {
        results.push({
          id: `demo-unit-${u.id}`,
          label: u.name,
          category: 'Units',
          icon: <Shield size={16} />,
          subtitle: u.echelon,
          path: '/dashboard',
          score: r.score,
        });
      }
    }
    return results.sort((a, b) => b.score - a.score).slice(0, MAX_PER_CATEGORY);
  }, []);

  const searchDemoAlerts = useCallback((q: string): CommandItem[] => {
    const results: (CommandItem & { score: number })[] = [];
    for (const a of DEMO_ALERTS) {
      const r = bestFuzzyScore(q, a.title, a.message, a.severity);
      if (r) {
        results.push({
          id: `demo-alert-${a.id}`,
          label: a.title,
          category: 'Alerts',
          icon: <Bell size={16} />,
          subtitle: `${a.severity} - ${a.type}`,
          path: '/alerts',
          score: r.score,
        });
      }
    }
    return results.sort((a, b) => b.score - a.score).slice(0, MAX_PER_CATEGORY);
  }, []);

  const searchDemoMovements = useCallback((q: string): CommandItem[] => {
    const results: (CommandItem & { score: number })[] = [];
    for (const m of DEMO_MOVEMENTS) {
      const r = bestFuzzyScore(q, m.name, m.originUnit, m.destinationUnit, m.status);
      if (r) {
        results.push({
          id: `demo-mov-${m.id}`,
          label: m.name,
          category: 'Convoys',
          icon: <Truck size={16} />,
          subtitle: `${m.originUnit} → ${m.destinationUnit} - ${m.status}`,
          path: '/transportation',
          score: r.score,
        });
      }
    }
    return results.sort((a, b) => b.score - a.score).slice(0, MAX_PER_CATEGORY);
  }, []);

  const searchDemoReports = useCallback((q: string): CommandItem[] => {
    const results: (CommandItem & { score: number })[] = [];
    for (const r of DEMO_REPORTS) {
      const match = bestFuzzyScore(q, r.title, r.type, r.status);
      if (match) {
        results.push({
          id: `demo-rpt-${r.id}`,
          label: r.title,
          category: 'Reports',
          icon: <BarChart3 size={16} />,
          subtitle: `${r.type} - ${r.status}`,
          path: '/reports',
          score: match.score,
        });
      }
    }
    return results.sort((a, b) => b.score - a.score).slice(0, MAX_PER_CATEGORY);
  }, []);

  // ---- Live API search ----
  const searchLiveApi = useCallback(
    async (q: string, mode: ModePrefix, signal: AbortSignal): Promise<CommandItem[]> => {
      const results: CommandItem[] = [];

      const fetchWithFallback = async (
        url: string,
        params: Record<string, string | number>,
        mapper: (items: any[]) => CommandItem[],
        fallback: () => CommandItem[],
      ) => {
        try {
          const res = await apiClient.get(url, { params, signal });
          const items = res.data?.items ?? res.data?.data ?? res.data ?? [];
          if (Array.isArray(items) && items.length > 0) {
            return mapper(items.slice(0, MAX_PER_CATEGORY));
          }
        } catch {
          // Fallback to demo
        }
        return fallback();
      };

      if (!mode || mode === '@') {
        const personnel = await fetchWithFallback(
          '/personnel',
          { search: q, limit: MAX_PER_CATEGORY },
          (items) =>
            items.map((p: any) => ({
              id: `api-per-${p.id || p.full_name}`,
              label: p.rank ? `${p.rank} ${p.full_name || p.name}` : (p.full_name || p.name || 'Unknown'),
              category: 'Personnel' as CategoryKey,
              icon: <Users size={16} />,
              subtitle: [p.mos, p.unit_name].filter(Boolean).join(' - '),
              path: `/personnel?search=${encodeURIComponent(p.full_name || p.name || '')}`,
            })),
          () => searchDemoPersonnel(q),
        );
        results.push(...personnel);
      }

      if (!mode || mode === '!') {
        const equipment = await fetchWithFallback(
          '/equipment/individual',
          { search: q, limit: MAX_PER_CATEGORY },
          (items) =>
            items.map((e: any) => ({
              id: `api-eq-${e.id || e.bumper_number}`,
              label: `${e.equipment_type || 'Equipment'} ${e.bumper_number || ''}`.trim(),
              category: 'Equipment' as CategoryKey,
              icon: <Truck size={16} />,
              subtitle: [e.status, e.unit_name, e.serial_number ? `S/N: ${e.serial_number}` : ''].filter(Boolean).join(' - '),
              path: '/equipment',
            })),
          () => searchDemoEquipment(q),
        );
        results.push(...equipment);
      }

      if (!mode || mode === '#') {
        // Catalog searches
        const endpoints = ['/catalog/equipment', '/catalog/supply', '/catalog/ammunition'];
        for (const ep of endpoints) {
          try {
            const res = await apiClient.get(ep, { params: { q }, signal });
            const items = res.data?.items ?? res.data?.data ?? res.data ?? [];
            if (Array.isArray(items)) {
              for (const item of items.slice(0, 4)) {
                results.push({
                  id: `api-cat-${ep}-${item.id || item.nsn || item.tamcn || Math.random()}`,
                  label: item.nomenclature || item.name || item.tamcn || 'Unknown',
                  category: 'Supply' as CategoryKey,
                  icon: <Hash size={16} />,
                  subtitle: [item.nsn, item.tamcn, item.dodic].filter(Boolean).join(' / '),
                  path: '/supply',
                });
              }
            }
          } catch {
            // ignore catalog errors
          }
        }
      }

      // For non-mode or generic mode, also get requisitions and maintenance
      if (!mode) {
        const reqs = await fetchWithFallback(
          '/requisitions',
          { search: q, limit: MAX_PER_CATEGORY },
          (items) =>
            items.map((r: any) => ({
              id: `api-req-${r.id}`,
              label: r.requisition_number || r.name || `REQ-${r.id}`,
              category: 'Requisitions' as CategoryKey,
              icon: <ClipboardList size={16} />,
              subtitle: r.status || '',
              path: '/requisitions',
            })),
          () => [], // no demo fallback for reqs in live - already in demo results
        );
        results.push(...reqs);

        const maint = await fetchWithFallback(
          '/maintenance',
          { search: q, limit: MAX_PER_CATEGORY },
          (items) =>
            items.map((w: any) => ({
              id: `api-wo-${w.id}`,
              label: w.work_order_number || `WO-${w.id}`,
              category: 'Work Orders' as CategoryKey,
              icon: <Wrench size={16} />,
              subtitle: [w.status, w.description].filter(Boolean).join(' - '),
              path: '/maintenance',
            })),
          () => [],
        );
        results.push(...maint);
      }

      return results;
    },
    [searchDemoPersonnel, searchDemoEquipment],
  );

  // ---- Build filtered results (demo mode, synchronous) ----
  const demoResults = useMemo((): CommandItem[] => {
    if (!isDemoMode || !queryLower) return [];

    const all: CommandItem[] = [];

    if (!prefix) {
      all.push(...searchPages(queryLower));
      all.push(...searchCommands(queryLower));
      all.push(...searchDemoPersonnel(queryLower));
      all.push(...searchDemoEquipment(queryLower));
      all.push(...searchDemoSupply(queryLower));
      all.push(...searchDemoWorkOrders(queryLower));
      all.push(...searchDemoUnits(queryLower));
      all.push(...searchDemoAlerts(queryLower));
      all.push(...searchDemoMovements(queryLower));
      all.push(...searchDemoReports(queryLower));
    } else if (prefix === '>') {
      all.push(...searchCommands(queryLower));
    } else if (prefix === '/') {
      all.push(...searchPages(queryLower));
    } else if (prefix === '@') {
      all.push(...searchDemoPersonnel(queryLower));
    } else if (prefix === '!') {
      all.push(...searchDemoEquipment(queryLower));
    } else if (prefix === '#') {
      all.push(...searchDemoSupply(queryLower));
    }

    return all;
  }, [
    queryLower,
    prefix,
    searchPages,
    searchCommands,
    searchDemoPersonnel,
    searchDemoEquipment,
    searchDemoSupply,
    searchDemoWorkOrders,
    searchDemoUnits,
    searchDemoAlerts,
    searchDemoMovements,
    searchDemoReports,
  ]);

  // ---- Default items (no query) ----
  const defaultItems = useMemo((): CommandItem[] => {
    if (queryLower) return [];

    if (prefix === '>') return commandItems;
    if (prefix === '/') return pageItems;
    if (prefix === '@') return searchDemoPersonnel('');
    if (prefix === '!') return searchDemoEquipment('');
    if (prefix === '#') return [];

    // No prefix, no query: show recent + commands (subset) + pages
    const recent = recentItems.map(recentEntryToItem);
    return [...recent, ...commandItems.slice(0, 5), ...pageItems];
  }, [queryLower, prefix, commandItems, pageItems, recentItems, searchDemoPersonnel, searchDemoEquipment]);

  // ---- Live API search effect (non-demo, with debounce + AbortController) ----
  useEffect(() => {
    if (isDemoMode || !queryLower) {
      setApiResults([]);
      setIsSearching(false);
      return;
    }

    // For command-only and page-only modes, no API needed
    if (prefix === '>' || prefix === '/') {
      setApiResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    debounceRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      searchLiveApi(queryLower, prefix, controller.signal)
        .then((results) => {
          if (!controller.signal.aborted) {
            setApiResults(results);
            setIsSearching(false);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setApiResults([]);
            setIsSearching(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [queryLower, prefix, searchLiveApi]);

  // ---- Live mode local results (commands + pages are always local) ----
  const liveLocalResults = useMemo((): CommandItem[] => {
    if (isDemoMode || !queryLower) return [];

    const all: CommandItem[] = [];
    if (!prefix || prefix === '>') all.push(...searchCommands(queryLower));
    if (!prefix || prefix === '/') all.push(...searchPages(queryLower));

    // Also include demo data for categories that don't have API endpoints
    if (!prefix) {
      all.push(...searchDemoUnits(queryLower));
      all.push(...searchDemoAlerts(queryLower));
      all.push(...searchDemoMovements(queryLower));
      all.push(...searchDemoReports(queryLower));
      all.push(...searchDemoSupply(queryLower));
      all.push(...searchDemoWorkOrders(queryLower));
    }

    return all;
  }, [queryLower, prefix, searchCommands, searchPages, searchDemoUnits, searchDemoAlerts, searchDemoMovements, searchDemoReports, searchDemoSupply, searchDemoWorkOrders]);

  // ---- Combined + grouped results ----
  const { grouped, flatItems } = useMemo(() => {
    let combined: CommandItem[];

    if (!queryLower) {
      combined = defaultItems;
    } else if (isDemoMode) {
      combined = demoResults;
    } else {
      combined = [...liveLocalResults, ...apiResults];
    }

    // Deduplicate by id
    const seen = new Set<string>();
    const deduped: CommandItem[] = [];
    for (const item of combined) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        deduped.push(item);
      }
    }

    // Group by category in defined order
    const groups: Partial<Record<CategoryKey, CommandItem[]>> = {};
    for (const item of deduped) {
      const cat = item.category;
      if (!groups[cat]) groups[cat] = [];
      if (groups[cat]!.length < MAX_PER_CATEGORY) {
        groups[cat]!.push(item);
      }
    }

    // Build ordered groups and flat list
    const orderedGroups: [CategoryKey, CommandItem[]][] = [];
    const flat: CommandItem[] = [];
    let total = 0;

    for (const cat of CATEGORY_ORDER) {
      if (groups[cat] && groups[cat]!.length > 0 && total < MAX_TOTAL) {
        const items = groups[cat]!.slice(0, MAX_TOTAL - total);
        orderedGroups.push([cat, items]);
        flat.push(...items);
        total += items.length;
      }
    }

    return { grouped: orderedGroups, flatItems: flat };
  }, [queryLower, defaultItems, demoResults, liveLocalResults, apiResults]);

  // ---- Handlers ----
  const open = useCallback(() => {
    setIsOpen(true);
    setRawQuery('');
    setSelectedIndex(0);
    setApiResults([]);
    setRecentItems(getRecentItems());
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setRawQuery('');
    setSelectedIndex(0);
    setApiResults([]);
    if (abortRef.current) abortRef.current.abort();
  }, []);

  const selectItem = useCallback(
    (item: CommandItem) => {
      // Don't track "recent" items themselves as recent
      if (item.category !== 'Recent') {
        addRecentItem(item);
      } else {
        // For recent items, re-add to bump to top
        addRecentItem({ ...item, category: 'Pages' }); // category doesn't matter for storage
      }

      if (item.action) {
        item.action();
      }
      if (item.path) {
        navigate(item.path);
      }
      close();
    },
    [navigate, close],
  );

  const handleClearRecent = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecentItems();
    setRecentItems([]);
  }, []);

  // ---- Global Ctrl+K ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) close();
        else open();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, open, close]);

  // ---- Focus on open ----
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // ---- Keyboard navigation ----
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
        if (rawQuery) {
          setRawQuery('');
        } else {
          close();
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        // Jump to next category
        let currentCatEnd = 0;
        for (const [, items] of grouped) {
          currentCatEnd += items.length;
          if (currentCatEnd > selectedIndex) {
            // Jump to this category end (start of next)
            if (currentCatEnd < flatItems.length) {
              setSelectedIndex(currentCatEnd);
            } else {
              setSelectedIndex(0); // wrap around
            }
            break;
          }
        }
      } else if (e.key === 'Backspace' && rawQuery.length === 1 && prefix) {
        // Clear prefix on backspace when only prefix character remains
        e.preventDefault();
        setRawQuery('');
      }
    },
    [flatItems, selectedIndex, selectItem, close, rawQuery, prefix, grouped],
  );

  // ---- Reset index on query change ----
  useEffect(() => {
    setSelectedIndex(0);
  }, [rawQuery]);

  // ---- Scroll selected into view ----
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${selectedIndex}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  // ---- Empty state message ----
  const emptyMessage = (() => {
    if (isSearching) return null;
    if (!queryLower && !prefix) return null; // showing defaults

    switch (prefix) {
      case '>': return 'No matching commands. Type a command name...';
      case '#': return 'No catalog results. Search by NSN, NIIN, TAMCN, or DODIC...';
      case '@': return 'No personnel found. Search by name, rank, or MOS...';
      case '!': return 'No equipment found. Search by bumper number or serial...';
      case '/': return 'No matching pages.';
      default: return 'No results found. Try a different search term.';
    }
  })();

  const showEmpty = flatItems.length === 0 && !isSearching;
  const showSkeleton = isSearching && flatItems.length === 0;
  const activeDescendant = flatItems[selectedIndex] ? `cmd-item-${selectedIndex}` : undefined;

  return (
    <>
      {/* Inject keyframes */}
      <style>{`
        @keyframes cmdSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cmdFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shimmer {
          0% { opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { opacity: 0.4; }
        }
      `}</style>

      {/* Overlay */}
      <div
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: 100,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          animation: 'cmdFadeIn 0.15s ease',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        {/* Palette container */}
        <div
          style={{
            width: '92%',
            maxWidth: 640,
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'calc(var(--radius) * 1.5)',
            overflow: 'hidden',
            animation: 'cmdSlideUp 0.2s ease forwards',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 520,
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          }}
          onKeyDown={handleKeyDown}
        >
          {/* Search Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 16px',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            {isSearching ? (
              <Loader2
                size={18}
                style={{
                  color: 'var(--color-accent)',
                  flexShrink: 0,
                  animation: 'spin 1s linear infinite',
                }}
              />
            ) : (
              <Search size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            )}

            {/* Mode indicator pill */}
            {prefix && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius)',
                  backgroundColor: getModeColor(prefix),
                  color: 'var(--color-bg)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  flexShrink: 0,
                  textTransform: 'uppercase',
                }}
              >
                {prefix === '>' && <Terminal size={10} />}
                {prefix === '#' && <Hash size={10} />}
                {prefix === '@' && <AtSign size={10} />}
                {prefix === '!' && <AlertCircle size={10} />}
                {prefix === '/' && <Slash size={10} />}
                {getModeLabel(prefix)}
              </span>
            )}

            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={true}
              aria-controls="cmd-results"
              aria-activedescendant={activeDescendant}
              aria-label="Search command palette"
              aria-autocomplete="list"
              placeholder={
                prefix
                  ? prefix === '>'
                    ? 'Type a command...'
                    : prefix === '#'
                      ? 'Search by NSN, NIIN, TAMCN, DODIC...'
                      : prefix === '@'
                        ? 'Search by name, rank, MOS...'
                        : prefix === '!'
                          ? 'Search by bumper number or serial...'
                          : 'Type a page name...'
                  : 'Search pages, commands, personnel, equipment...'
              }
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                color: 'var(--color-text-bright)',
                caretColor: 'var(--color-accent)',
              }}
            />

            {rawQuery && (
              <button
                onClick={() => setRawQuery('')}
                aria-label="Clear search"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: 2,
                  borderRadius: 'var(--radius)',
                  flexShrink: 0,
                }}
              >
                <X size={14} />
              </button>
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
                flexShrink: 0,
              }}
            >
              ESC
            </button>
          </div>

          {/* Prefix hints (when empty, no prefix) */}
          {!rawQuery && !prefix && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 16px',
                borderBottom: '1px solid var(--color-border)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-text-muted)',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ opacity: 0.7 }}>Tip:</span>
              {[
                { key: '>', label: 'Commands' },
                { key: '#', label: 'NSN/TAMCN' },
                { key: '@', label: 'Personnel' },
                { key: '!', label: 'Equipment' },
                { key: '/', label: 'Pages' },
              ].map(({ key, label }) => (
                <span
                  key={key}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    cursor: 'pointer',
                    padding: '1px 5px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-surface)',
                  }}
                  onClick={() => {
                    setRawQuery(key);
                    inputRef.current?.focus();
                  }}
                >
                  <kbd style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{key}</kbd>
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Results */}
          <div
            id="cmd-results"
            ref={listRef}
            role="listbox"
            aria-label="Search results"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '4px 0',
            }}
          >
            {/* Skeleton loader */}
            {showSkeleton && (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            )}

            {/* Empty state */}
            {showEmpty && emptyMessage && (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.6,
                }}
              >
                {emptyMessage}
              </div>
            )}

            {/* Grouped results */}
            {grouped.map(([category, items]) => {
              // Calculate start index for this group
              let startIdx = 0;
              for (const [cat, catItems] of grouped) {
                if (cat === category) break;
                startIdx += catItems.length;
              }

              return (
                <div key={category}>
                  {/* Category header */}
                  <div
                    style={{
                      position: 'sticky',
                      top: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 16px 4px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                      color: CATEGORY_COLORS[category] || 'var(--color-text-muted)',
                      backgroundColor: 'var(--color-bg-elevated)',
                      zIndex: 1,
                    }}
                  >
                    <span>
                      {category}
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 9,
                          fontWeight: 500,
                          color: 'var(--color-text-muted)',
                          textTransform: 'none',
                          letterSpacing: '0px',
                        }}
                      >
                        {items.length}
                      </span>
                    </span>
                    {category === 'Recent' && (
                      <button
                        onClick={handleClearRecent}
                        aria-label="Clear recent items"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-text-muted)',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          padding: '1px 4px',
                          borderRadius: 'var(--radius)',
                          opacity: 0.7,
                        }}
                      >
                        <X size={10} />
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Items */}
                  {items.map((item, itemIdx) => {
                    const globalIdx = startIdx + itemIdx;
                    const isSelected = globalIdx === selectedIndex;

                    return (
                      <div
                        key={item.id}
                        id={`cmd-item-${globalIdx}`}
                        role="option"
                        aria-selected={isSelected}
                        data-idx={globalIdx}
                        data-selected={isSelected}
                        onClick={() => selectItem(item)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '7px 16px',
                          paddingLeft: isSelected ? 13 : 16,
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--color-bg-hover)' : 'transparent',
                          borderLeft: isSelected ? '3px solid var(--color-accent)' : '3px solid transparent',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          color: isSelected ? 'var(--color-text-bright)' : 'var(--color-text)',
                          transition: 'all 0.1s ease',
                        }}
                      >
                        {/* Icon */}
                        <span
                          style={{
                            color: isSelected
                              ? CATEGORY_COLORS[item.category] || 'var(--color-accent)'
                              : 'var(--color-text-muted)',
                            display: 'flex',
                            flexShrink: 0,
                            transition: 'color 0.1s ease',
                          }}
                        >
                          {item.icon}
                        </span>

                        {/* Label + Subtitle */}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <span
                            style={{
                              fontWeight: isSelected ? 600 : 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            <HighlightLabel text={item.label} query={queryLower} />
                          </span>
                          {item.subtitle && (
                            <span
                              style={{
                                fontSize: 10,
                                color: 'var(--color-text-muted)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.subtitle}
                            </span>
                          )}
                        </div>

                        {/* Shortcut hint */}
                        {item.shortcut && (
                          <span
                            style={{
                              display: 'flex',
                              gap: 3,
                              flexShrink: 0,
                            }}
                          >
                            {item.shortcut.split(' ').map((k, ki) => (
                              <kbd
                                key={ki}
                                style={{
                                  display: 'inline-block',
                                  padding: '1px 5px',
                                  border: '1px solid var(--color-border)',
                                  borderRadius: 'var(--radius)',
                                  backgroundColor: 'var(--color-bg-surface)',
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 9,
                                  lineHeight: '14px',
                                  color: 'var(--color-text-muted)',
                                }}
                              >
                                {k}
                              </kbd>
                            ))}
                          </span>
                        )}

                        {/* Category badge */}
                        {item.category !== 'Recent' && (
                          <span
                            style={{
                              flexShrink: 0,
                              padding: '1px 6px',
                              borderRadius: 'calc(var(--radius) * 0.75)',
                              backgroundColor: 'var(--color-bg-surface)',
                              border: '1px solid var(--color-border)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 9,
                              color: 'var(--color-text-muted)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.category}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Loading indicator inline when we have some results but still searching */}
            {isSearching && flatItems.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--color-text-muted)',
                }}
              >
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                Loading more results...
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 16px',
              borderTop: '1px solid var(--color-border)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-text-muted)',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            {/* Left: prefix hints */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {[
                { key: '>', label: 'Commands' },
                { key: '#', label: 'NSN/TAMCN' },
                { key: '@', label: 'Personnel' },
                { key: '!', label: 'Equipment' },
                { key: '/', label: 'Pages' },
              ].map(({ key, label }, i, arr) => (
                <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <kbd style={kbdStyle}>{key}</kbd>
                  <span>{label}</span>
                  {i < arr.length - 1 && <span style={{ margin: '0 2px', opacity: 0.4 }}>&middot;</span>}
                </span>
              ))}
            </div>

            {/* Right: keyboard hints */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
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
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

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
