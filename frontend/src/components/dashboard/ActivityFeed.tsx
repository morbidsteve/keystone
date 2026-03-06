// =============================================================================
// KEYSTONE — Activity Feed Component
// Real-time activity feed showing system events
// =============================================================================

import { useState, useRef, useEffect } from 'react';
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ActivityFeed() {
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
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          backgroundColor: 'transparent',
          border: 'none',
          borderBottom: collapsed ? 'none' : '1px solid var(--color-border)',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={14} style={{ color: 'var(--color-accent)' }} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '2px',
              color: 'var(--color-text-bright)',
              textTransform: 'uppercase',
            }}
          >
            ACTIVITY FEED
          </span>
          {/* LIVE badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 6px',
              backgroundColor: 'rgba(64, 192, 87, 0.15)',
              border: '1px solid rgba(64, 192, 87, 0.4)',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-mono)',
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '1.5px',
              color: 'var(--color-success)',
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                backgroundColor: 'var(--color-success)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
            LIVE
          </span>
        </div>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--color-text-muted)',
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            transition: 'transform var(--transition)',
          }}
        />
      </button>

      {/* Body */}
      {!collapsed && (
        <>
          {/* Filter bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <Filter size={10} style={{ color: 'var(--color-text-muted)' }} />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ActivityTypeFilter)}
              style={{
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                color: 'var(--color-text)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                padding: '4px 8px',
                cursor: 'pointer',
              }}
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === 'ALL' ? 'ALL TYPES' : t.replace('_', ' ')}
                </option>
              ))}
            </select>
            <span
              style={{
                marginLeft: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--color-text-muted)',
              }}
            >
              {activities.length} events
            </span>
          </div>

          {/* Events list */}
          <div
            ref={scrollRef}
            style={{
              maxHeight: 320,
              overflowY: 'auto',
            }}
          >
            {activities.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                }}
              >
                No activity events
              </div>
            ) : (
              activities.map((event) => {
                const cfg = TYPE_CONFIG[event.activity_type];
                const IconComponent = cfg.icon;
                return (
                  <div
                    key={event.id}
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: '8px 14px',
                      borderBottom: '1px solid var(--color-border)',
                      transition: 'background-color var(--transition)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor =
                        'rgba(255,255,255,0.02)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Type icon */}
                    <div
                      style={{
                        flexShrink: 0,
                        width: 28,
                        height: 28,
                        borderRadius: 'var(--radius)',
                        backgroundColor: `${cfg.color}18`,
                        border: `1px solid ${cfg.color}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconComponent size={12} style={{ color: cfg.color }} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 2,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 8,
                            fontWeight: 700,
                            letterSpacing: '1px',
                            color: cfg.color,
                            padding: '1px 4px',
                            backgroundColor: `${cfg.color}15`,
                            borderRadius: 2,
                          }}
                        >
                          {cfg.label}
                        </span>
                        {event.user_rank && event.user_name && (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 10,
                              fontWeight: 600,
                              color: 'var(--color-text-bright)',
                            }}
                          >
                            {event.user_rank} {event.user_name}
                          </span>
                        )}
                        {event.unit_name && (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 9,
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            [{event.unit_name}]
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          color: 'var(--color-text)',
                          lineHeight: 1.4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {event.description}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div
                      style={{
                        flexShrink: 0,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        color: 'var(--color-text-muted)',
                        whiteSpace: 'nowrap',
                        paddingTop: 2,
                      }}
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
