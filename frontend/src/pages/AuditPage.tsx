// =============================================================================
// AuditPage — Audit Trail & Security Actions
// =============================================================================

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, ShieldAlert, Users, Activity } from 'lucide-react';
import Card from '@/components/ui/Card';
import AuditLogTable from '@/components/custody/AuditLogTable';
import { getAuditLogs, getSecurityActions } from '@/api/custody';
import type { AuditEntityType } from '@/lib/types';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'trail' as const, label: 'AUDIT TRAIL' },
  { key: 'security' as const, label: 'SECURITY ACTIONS' },
];

type TabKey = (typeof TABS)[number]['key'];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function AuditPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('trail');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('ALL');
  const [daysBack, setDaysBack] = useState<number>(7);
  const [hoursBack, setHoursBack] = useState<number>(24);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const { data: auditLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['audit-logs', entityTypeFilter, daysBack],
    queryFn: () =>
      getAuditLogs(
        entityTypeFilter !== 'ALL' ? (entityTypeFilter as AuditEntityType) : undefined,
        undefined,
        daysBack,
      ),
    enabled: activeTab === 'trail',
  });

  const { data: securityActions, isLoading: securityLoading } = useQuery({
    queryKey: ['security-actions', hoursBack],
    queryFn: () => getSecurityActions(hoursBack),
    enabled: activeTab === 'security',
  });

  // For 24h summary (always fetched)
  const { data: allLogs24h } = useQuery({
    queryKey: ['audit-logs-24h'],
    queryFn: () => getAuditLogs(undefined, undefined, 1),
  });

  const { data: allSecurityActions } = useQuery({
    queryKey: ['security-actions-all'],
    queryFn: () => getSecurityActions(24),
  });

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const totalActions24h = allLogs24h?.length ?? 0;
  const securityActionCount = allSecurityActions?.length ?? 0;
  const uniqueUsers = useMemo(() => {
    if (!allLogs24h) return 0;
    return new Set(allLogs24h.map((l) => l.user_id)).size;
  }, [allLogs24h]);

  const mostActiveEntityType = useMemo(() => {
    if (!allLogs24h || allLogs24h.length === 0) return '—';
    const counts: Record<string, number> = {};
    for (const log of allLogs24h) {
      counts[log.entity_type] = (counts[log.entity_type] ?? 0) + 1;
    }
    let maxType = '';
    let maxCount = 0;
    for (const [type, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxType = type;
        maxCount = count;
      }
    }
    return maxType.replace(/_/g, ' ');
  }, [allLogs24h]);

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const selectStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    padding: '6px 10px',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    color: 'var(--color-text)',
    outline: 'none',
    cursor: 'pointer',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '1.5px',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    marginBottom: 4,
    display: 'block',
  };

  const ENTITY_TYPES: AuditEntityType[] = [
    'SENSITIVE_ITEM',
    'CUSTODY_TRANSFER',
    'INVENTORY_EVENT',
    'USER',
    'UNIT',
    'PERSONNEL',
    'REPORT',
    'SYSTEM',
  ];

  // -------------------------------------------------------------------------
  // Audit Trail tab content
  // -------------------------------------------------------------------------

  const renderAuditTrail = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <div>
          <label style={labelStyle}>ENTITY TYPE</label>
          <select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="ALL">All Types</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>PERIOD</label>
          <select
            value={daysBack}
            onChange={(e) => setDaysBack(Number(e.target.value))}
            style={selectStyle}
          >
            <option value={1}>Last 24 Hours</option>
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
        </div>
      </div>

      <Card title="AUDIT TRAIL">
        <AuditLogTable logs={auditLogs ?? []} loading={logsLoading} />
      </Card>
    </div>
  );

  // -------------------------------------------------------------------------
  // Security Actions tab content
  // -------------------------------------------------------------------------

  const renderSecurityActions = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <div>
          <label style={labelStyle}>TIME WINDOW</label>
          <select
            value={hoursBack}
            onChange={(e) => setHoursBack(Number(e.target.value))}
            style={selectStyle}
          >
            <option value={1}>Last 1 Hour</option>
            <option value={4}>Last 4 Hours</option>
            <option value={12}>Last 12 Hours</option>
            <option value={24}>Last 24 Hours</option>
            <option value={48}>Last 48 Hours</option>
            <option value={168}>Last 7 Days</option>
          </select>
        </div>
      </div>

      {/* Security alert banner */}
      {(securityActions?.length ?? 0) > 0 && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <ShieldAlert size={14} style={{ color: '#f59e0b' }} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              color: '#f59e0b',
              letterSpacing: '0.5px',
            }}
          >
            {securityActions?.length} security-sensitive action
            {(securityActions?.length ?? 0) !== 1 ? 's' : ''} detected in the selected
            time window
          </span>
        </div>
      )}

      <Card title="SECURITY-SENSITIVE ACTIONS" accentColor="#f59e0b">
        <AuditLogTable logs={securityActions ?? []} loading={securityLoading} />
      </Card>
    </div>
  );

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 0 }}>
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={18} style={{ color: 'var(--color-accent)' }} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--color-text-bright)',
              letterSpacing: '1px',
            }}
          >
            AUDIT & ACCOUNTABILITY
          </span>
        </div>
      </div>

      {/* Summary KPI cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
        }}
      >
        {[
          {
            label: 'ACTIONS (24H)',
            value: totalActions24h.toString(),
            color: 'var(--color-text-bright)',
            icon: Activity,
          },
          {
            label: 'SECURITY ACTIONS',
            value: securityActionCount.toString(),
            color: securityActionCount > 0 ? '#f59e0b' : '#22c55e',
            icon: ShieldAlert,
          },
          {
            label: 'UNIQUE USERS',
            value: uniqueUsers.toString(),
            color: '#3b82f6',
            icon: Users,
          },
          {
            label: 'MOST ACTIVE',
            value: mostActiveEntityType,
            color: '#8b5cf6',
            icon: FileText,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              padding: '14px 16px',
              backgroundColor: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 6,
              }}
            >
              <kpi.icon size={11} style={{ color: 'var(--color-text-muted)' }} />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '1.5px',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                {kpi.label}
              </span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: kpi.label === 'MOST ACTIVE' ? 12 : 22,
                fontWeight: 700,
                color: kpi.color,
              }}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 0,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: activeTab === tab.key ? 600 : 400,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              border: 'none',
              borderBottom:
                activeTab === tab.key
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent',
              backgroundColor: 'transparent',
              color:
                activeTab === tab.key
                  ? 'var(--color-accent)'
                  : 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'all var(--transition)',
              marginBottom: -1,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'trail' && renderAuditTrail()}
      {activeTab === 'security' && renderSecurityActions()}
    </div>
  );
}
