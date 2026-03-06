// =============================================================================
// KEYSTONE — Activity Feed Component
// Real-time activity feed showing system events
// =============================================================================

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Package,
  Wrench,
  Truck,
  AlertTriangle,
  Users,
  FileText,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { getActivities, type ActivityEvent } from '@/api/activities';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTIVITY_TYPES = ['ALL', 'REQUISITION', 'WORK_ORDER', 'CONVOY', 'SUPPLY', 'ALERT', 'PERSONNEL', 'REPORT'] as const;

type ActivityTypeFilter = (typeof ACTIVITY_TYPES)[number];

const TYPE_CONFIG: Record<
  ActivityEvent['activity_type'],
  { icon: typeof Activity; color: string; label: string }
> = {
  REQUISITION: { icon: Package, color: '#4dabf7', label: 'REQ' },
  WORK_ORDER: { icon: Wrench, color: '#fd7e14', label: 'WO' },
  CONVOY: { icon: Truck, color: '#40c057', label: 'MOV' },
  SUPPLY: { icon: Package, color: '#845ef7', label: 'SUP' },
  ALERT: { icon: AlertTriangle, color: '#ff6b6b', label: 'ALT' },
  PERSONNEL: { icon: Users, color: '#5c7cfa', label: 'PER' },
  REPORT: { icon: FileText, color: '#845ef7', label: 'RPT' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Map activity type to a detail page for row-level click navigation */
const ACTIVITY_TYPE_ROUTES: Record<ActivityEvent['activity_type'], string> = {
  REQUISITION: '/requisitions',
  WORK_ORDER: '/maintenance',
  CONVOY: '/transportation',
  SUPPLY: '/supply',
  ALERT: '/alerts',
  PERSONNEL: '/personnel',
  REPORT: '/reports',
};

/** Patterns to detect linkable references inside activity text */
const REFERENCE_PATTERNS: { pattern: RegExp; route: string }[] = [
  { pattern: /REQ-\d{4}-\d{3,}/g, route: '/requisitions' },
  { pattern: /WO-\d{3,}/g, route: '/maintenance' },
  { pattern: /Convoy [A-Z]+-\d+/g, route: '/transportation' },
];

/** Parse activity description and wrap matched references in styled spans */
function parseActivityText(text: string): ReactNode {
  // Collect all matches with their positions
  const matches: { start: number; end: number; text: string; route: string }[] = [];
  for (const { pattern, route } of REFERENCE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, text: m[0], route });
    }
  }

  if (matches.length === 0) return text;

  // Sort by position
  matches.sort((a, b) => a.start - b.start);

  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.start > cursor) {
      parts.push(text.slice(cursor, match.start));
    }
    parts.push(
      <span
        key={match.start}
        className="text-[var(--color-accent)] underline decoration-dotted underline-offset-2"
      >
        {match.text}
      </span>,
    );
    cursor = match.end;
  }
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return <>{parts}</>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ActivityFeed() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [typeFilter, setTypeFilter] = useState<ActivityTypeFilter>('ALL');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', typeFilter],
    queryFn: () =>
      getActivities({
        type: typeFilter === 'ALL' ? undefined : typeFilter,
        limit: 30,
      }),
    refetchInterval: 5000,
  });

  // Auto-scroll to top on new data
  useEffect(() => {
    if (scrollRef.current && !collapsed) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activities, collapsed]);

  return (
    <div
      className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between py-2.5 px-3.5 bg-transparent border-0 cursor-pointer" style={{ borderBottom: collapsed ? 'none' : '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-[var(--color-accent)]" />
          <span
            className="font-[var(--font-mono)] text-[10px] font-bold tracking-[2px] text-[var(--color-text-bright)] uppercase"
          >
            ACTIVITY FEED
          </span>
          {/* LIVE badge */}
          <span
            className="inline-flex items-center gap-1 py-0.5 px-1.5 bg-[rgba(64,192,87,0.15)] rounded-[var(--radius)] font-[var(--font-mono)] text-[8px] font-bold tracking-[1.5px] text-[var(--color-success)]" style={{ border: '1px solid rgba(64, 192, 87, 0.4)' }}
          >
            <span
              className="w-[5px] h-[5px] bg-[var(--color-success)]" style={{ borderRadius: '50%', animation: 'pulse 2s ease-in-out infinite' }}
            />
            LIVE
          </span>
        </div>
        <ChevronDown
          size={14}
          className="text-[var(--color-text-muted)]" style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform var(--transition)' }}
        />
      </button>

      {/* Body */}
      {!collapsed && (
        <>
          {/* Filter bar */}
          <div
            className="flex items-center gap-1.5 py-2 px-3.5 border-b border-b-[var(--color-border)]"
          >
            <Filter size={10} className="text-[var(--color-text-muted)]" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ActivityTypeFilter)}
              className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text)] font-[var(--font-mono)] text-[10px] py-1 px-2 cursor-pointer"
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === 'ALL' ? 'ALL TYPES' : t.replace('_', ' ')}
                </option>
              ))}
            </select>
            <span
              className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] ml-auto"
            >
              {activities.length} events
            </span>
          </div>

          {/* Events list */}
          <div
            ref={scrollRef}
            className="max-h-[320px] overflow-y-auto"
          >
            {activities.length === 0 ? (
              <div
                className="p-6 text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
              >
                No activity events
              </div>
            ) : (
              activities.map((event) => {
                const cfg = TYPE_CONFIG[event.activity_type];
                const IconComponent = cfg.icon;
                const route = ACTIVITY_TYPE_ROUTES[event.activity_type];
                return (
                  <div
                    key={event.id}
                    role="button"
                    tabIndex={0}
                    className="flex gap-2.5 py-2 px-3.5 border-b border-b-[var(--color-border)] transition-colors duration-[var(--transition)] cursor-pointer"
                    onClick={() => navigate(route)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') navigate(route);
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor =
                        'var(--color-bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Type icon */}
                    <div
                      className="shrink-0 w-[28px] h-[28px] rounded-[var(--radius)] flex items-center justify-center" style={{ backgroundColor: `${cfg.color}18`, border: `1px solid ${cfg.color}40` }}
                    >
                      <IconComponent size={12} style={{ color: cfg.color }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="flex items-center gap-1.5 mb-0.5"
                      >
                        <span
                          className="font-[var(--font-mono)] text-[8px] font-bold tracking-[1px] py-px px-1 rounded-[2px]" style={{ color: cfg.color, backgroundColor: `${cfg.color}15` }}
                        >
                          {cfg.label}
                        </span>
                        {event.user_rank && event.user_name && (
                          <span
                            className="font-[var(--font-mono)] text-[10px] font-semibold text-[var(--color-text-bright)]"
                          >
                            {event.user_rank} {event.user_name}
                          </span>
                        )}
                        {event.unit_name && (
                          <span
                            className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
                          >
                            [{event.unit_name}]
                          </span>
                        )}
                      </div>
                      <div
                        className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)] leading-[1.4] overflow-hidden text-ellipsis whitespace-nowrap"
                      >
                        {parseActivityText(event.description)}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div
                      className="shrink-0 font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] whitespace-nowrap pt-0.5"
                    >
                      {timeAgo(event.created_at)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
