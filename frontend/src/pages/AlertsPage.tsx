import { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, Check, Filter, Shield, Settings, Bell, Plus, Trash2, Power } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import StatusDot from '@/components/ui/StatusDot';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';
import { AlertSeverity, type Alert, type AlertRule, type Notification } from '@/lib/types';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { getAlerts, acknowledgeAlert, resolveAlert, getAlertSummary, getAlertRules, createAlertRule, updateAlertRule, deleteAlertRule } from '@/api/alerts';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/api/notifications';
import { useDashboardStore } from '@/stores/dashboardStore';

type TabKey = 'alerts' | 'rules' | 'notifications' | 'preferences';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'alerts', label: 'ALERTS' },
  { key: 'rules', label: 'RULES' },
  { key: 'notifications', label: 'NOTIFICATIONS' },
  { key: 'preferences', label: 'PREFERENCES' },
];

function getSeverityIcon(severity: AlertSeverity) {
  switch (severity) {
    case AlertSeverity.CRITICAL: return <AlertCircle size={16} />;
    case AlertSeverity.WARNING: return <AlertTriangle size={16} />;
    default: return <Info size={16} />;
  }
}

function getSeverityColor(severity: AlertSeverity) {
  switch (severity) {
    case AlertSeverity.CRITICAL: return 'var(--color-danger)';
    case AlertSeverity.WARNING: return 'var(--color-warning)';
    default: return 'var(--color-info)';
  }
}

function getSeverityDot(severity: AlertSeverity) {
  switch (severity) {
    case AlertSeverity.CRITICAL: return 'RED';
    case AlertSeverity.WARNING: return 'AMBER';
    default: return 'GREEN';
  }
}

// ============================================================================
// Alerts Tab
// ============================================================================

function AlertsTab() {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const selectedUnitId = useDashboardStore((s) => s.selectedUnitId);
  const queryClient = useQueryClient();

  const { data: apiAlerts } = useQuery({
    queryKey: ['alerts', 'page', selectedUnitId],
    queryFn: () => getAlerts({ unitId: selectedUnitId ?? undefined }),
  });

  const { data: summary } = useQuery({
    queryKey: ['alert-summary', selectedUnitId],
    queryFn: () => getAlertSummary(selectedUnitId ?? undefined),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => acknowledgeAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-summary'] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => resolveAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-summary'] });
    },
  });

  const allAlerts: Alert[] = apiAlerts || [];

  const filtered = allAlerts.filter((a) => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (!showAcknowledged && a.acknowledged) return false;
    if (!showResolved && a.resolved) return false;
    return true;
  });

  const summaryData = summary || {
    total_active: allAlerts.filter((a) => !a.acknowledged && !a.resolved).length,
    by_severity: {
      CRITICAL: allAlerts.filter((a) => a.severity === AlertSeverity.CRITICAL && !a.acknowledged).length,
      WARNING: allAlerts.filter((a) => a.severity === AlertSeverity.WARNING && !a.acknowledged).length,
      INFO: allAlerts.filter((a) => a.severity === AlertSeverity.INFO && !a.acknowledged).length,
    },
    by_type: {},
  };

  return (
    <>
      {/* Summary Cards */}
      <div className="grid-responsive-4col">
        {[
          { label: 'TOTAL ACTIVE', value: summaryData.total_active, color: 'var(--color-text-bright)' },
          { label: 'CRITICAL', value: summaryData.by_severity.CRITICAL, color: 'var(--color-danger)' },
          { label: 'WARNING', value: summaryData.by_severity.WARNING, color: 'var(--color-warning)' },
          { label: 'INFO', value: summaryData.by_severity.INFO, color: 'var(--color-info)' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              padding: '12px 16px',
              textAlign: 'center',
            }}
          >
            <div className="section-header" style={{ marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          style={{
            padding: '6px 10px',
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
          }}
        >
          <option value="ALL">ALL SEVERITIES</option>
          <option value={AlertSeverity.CRITICAL}>CRITICAL</option>
          <option value={AlertSeverity.WARNING}>WARNING</option>
          <option value={AlertSeverity.INFO}>INFO</option>
        </select>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={showAcknowledged}
            onChange={(e) => setShowAcknowledged(e.target.checked)}
            style={{ accentColor: 'var(--color-accent)' }}
          />
          SHOW ACKNOWLEDGED
        </label>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            style={{ accentColor: 'var(--color-accent)' }}
          />
          SHOW RESOLVED
        </label>
      </div>

      {/* Alert List */}
      <Card title={`ALERTS (${filtered.length})`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map((alert) => {
            const color = getSeverityColor(alert.severity);
            return (
              <div
                key={alert.id}
                style={{
                  padding: '12px 14px',
                  backgroundColor: alert.acknowledged || alert.resolved ? 'var(--color-bg)' : 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderLeft: `3px solid ${color}`,
                  borderRadius: 'var(--radius)',
                  opacity: alert.resolved ? 0.5 : alert.acknowledged ? 0.6 : 1,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color }}>{getSeverityIcon(alert.severity)}</span>
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--color-text-bright)',
                        }}
                      >
                        {alert.title}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          color: 'var(--color-text-muted)',
                          display: 'flex',
                          gap: 8,
                          marginTop: 2,
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <StatusDot status={getSeverityDot(alert.severity)} size={6} />
                          {alert.severity}
                        </span>
                        <span>{alert.unitName}</span>
                        <span>{formatRelativeTime(alert.createdAt)}</span>
                        {alert.resolved && (
                          <span style={{ color: 'var(--color-success, #22c55e)' }}>RESOLVED</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {!alert.acknowledged && !alert.resolved && (
                      <button
                        onClick={() => acknowledgeMutation.mutate(alert.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--color-border-strong)',
                          borderRadius: 'var(--radius)',
                          color: 'var(--color-text-muted)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          letterSpacing: '1px',
                          cursor: 'pointer',
                          transition: 'all var(--transition)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-accent)';
                          e.currentTarget.style.color = 'var(--color-accent)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                          e.currentTarget.style.color = 'var(--color-text-muted)';
                        }}
                      >
                        <Check size={12} />
                        ACK
                      </button>
                    )}
                    {!alert.resolved && (
                      <button
                        onClick={() => resolveMutation.mutate(alert.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--color-border-strong)',
                          borderRadius: 'var(--radius)',
                          color: 'var(--color-text-muted)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          letterSpacing: '1px',
                          cursor: 'pointer',
                          transition: 'all var(--transition)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-success, #22c55e)';
                          e.currentTarget.style.color = 'var(--color-success, #22c55e)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                          e.currentTarget.style.color = 'var(--color-text-muted)';
                        }}
                      >
                        <Shield size={12} />
                        RESOLVE
                      </button>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text)',
                    lineHeight: 1.5,
                    paddingLeft: 26,
                  }}
                >
                  {alert.message}
                </div>

                {alert.acknowledged && alert.acknowledgedBy && (
                  <div
                    style={{
                      marginTop: 8,
                      paddingLeft: 26,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Acknowledged by {alert.acknowledgedBy} at{' '}
                    {alert.acknowledgedAt && formatDate(alert.acknowledgedAt)}
                  </div>
                )}

                {alert.resolved && alert.resolvedBy && (
                  <div
                    style={{
                      marginTop: 4,
                      paddingLeft: 26,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Resolved by {alert.resolvedBy} at{' '}
                    {alert.resolvedAt && formatDate(alert.resolvedAt)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}

// ============================================================================
// Rules Tab
// ============================================================================

const OPERATOR_LABELS: Record<string, string> = {
  LT: '<', LTE: '<=', GT: '>', GTE: '>=', EQ: '=', NEQ: '!=',
};

function RulesTab() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: rules = [] } = useQuery<AlertRule[]>({
    queryKey: ['alert-rules'],
    queryFn: () => getAlertRules(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<AlertRule>) => createAlertRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      setShowCreateForm(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (rule: AlertRule) => updateAlertRule(rule.id, { is_active: !rule.is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAlertRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      alert_type: formData.get('alert_type') as string,
      severity: formData.get('severity') as string,
      metric: formData.get('metric') as string,
      operator: formData.get('operator') as AlertRule['operator'],
      threshold_value: Number(formData.get('threshold_value')),
      cooldown_minutes: Number(formData.get('cooldown_minutes') || 60),
      is_scope_all: true,
      is_active: true,
    });
  };

  const thStyle: React.CSSProperties = {
    padding: '8px 10px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 9,
    letterSpacing: '1.5px',
    color: 'var(--color-text-muted)',
    borderBottom: '1px solid var(--color-border)',
  };

  const tdStyle: React.CSSProperties = {
    padding: '8px 10px',
    fontSize: 11,
    color: 'var(--color-text)',
    borderBottom: '1px solid var(--color-border)',
  };

  const inputStyle: React.CSSProperties = {
    padding: '6px 10px',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    width: '100%',
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}>
          {rules.length} rule{rules.length !== 1 ? 's' : ''} configured
        </span>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            backgroundColor: 'var(--color-accent)',
            border: 'none',
            borderRadius: 'var(--radius)',
            color: '#fff',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '1px',
            cursor: 'pointer',
            transition: 'all var(--transition)',
          }}
        >
          <Plus size={12} />
          NEW RULE
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card title="CREATE ALERT RULE">
          <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>NAME</label>
                <input name="name" required style={inputStyle} placeholder="e.g. Supply DOS < 3 Days" />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>DESCRIPTION</label>
                <input name="description" style={inputStyle} placeholder="Optional description" />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>ALERT TYPE</label>
                <select name="alert_type" required style={inputStyle}>
                  <option value="LOW_DOS">LOW_DOS</option>
                  <option value="LOW_READINESS">LOW_READINESS</option>
                  <option value="PM_OVERDUE">PM_OVERDUE</option>
                  <option value="EQUIPMENT_DEADLINED">EQUIPMENT_DEADLINED</option>
                  <option value="STRENGTH_BELOW_THRESHOLD">STRENGTH_BELOW_THRESHOLD</option>
                  <option value="FUEL_CRITICAL">FUEL_CRITICAL</option>
                  <option value="AMMO_BELOW_RSR">AMMO_BELOW_RSR</option>
                </select>
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>SEVERITY</label>
                <select name="severity" required style={inputStyle}>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="WARNING">WARNING</option>
                  <option value="INFO">INFO</option>
                </select>
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>METRIC</label>
                <input name="metric" required style={inputStyle} placeholder="e.g. supply_dos" />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>OPERATOR</label>
                <select name="operator" required style={inputStyle}>
                  <option value="LT">&lt; (Less Than)</option>
                  <option value="LTE">&lt;= (Less or Equal)</option>
                  <option value="GT">&gt; (Greater Than)</option>
                  <option value="GTE">&gt;= (Greater or Equal)</option>
                  <option value="EQ">= (Equal)</option>
                  <option value="NEQ">!= (Not Equal)</option>
                </select>
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>THRESHOLD</label>
                <input name="threshold_value" type="number" step="any" required style={inputStyle} placeholder="e.g. 3" />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>COOLDOWN (min)</label>
                <input name="cooldown_minutes" type="number" defaultValue={60} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '6px 14px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  cursor: 'pointer',
                }}
              >
                CANCEL
              </button>
              <button
                type="submit"
                style={{
                  padding: '6px 14px',
                  backgroundColor: 'var(--color-accent)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  cursor: 'pointer',
                }}
              >
                CREATE RULE
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Rules Table */}
      <Card title="ALERT RULES">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)' }}>
            <thead>
              <tr>
                <th style={thStyle}>NAME</th>
                <th style={thStyle}>TYPE</th>
                <th style={thStyle}>SEVERITY</th>
                <th style={thStyle}>METRIC</th>
                <th style={thStyle}>CONDITION</th>
                <th style={thStyle}>COOLDOWN</th>
                <th style={thStyle}>ACTIVE</th>
                <th style={thStyle}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td style={{ ...tdStyle, color: 'var(--color-text-bright)', fontWeight: 500 }}>
                    {rule.name}
                  </td>
                  <td style={tdStyle}>{rule.alert_type}</td>
                  <td style={tdStyle}>
                    <span style={{
                      color: rule.severity === 'CRITICAL' ? 'var(--color-danger)' :
                        rule.severity === 'WARNING' ? 'var(--color-warning)' : 'var(--color-info)',
                    }}>
                      {rule.severity}
                    </span>
                  </td>
                  <td style={tdStyle}>{rule.metric}</td>
                  <td style={tdStyle}>{OPERATOR_LABELS[rule.operator] || rule.operator} {rule.threshold_value}</td>
                  <td style={tdStyle}>{rule.cooldown_minutes}m</td>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: rule.is_active ? 'var(--color-success, #22c55e)' : 'var(--color-text-muted)',
                    }} />
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => toggleMutation.mutate(rule)}
                        title={rule.is_active ? 'Deactivate' : 'Activate'}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '3px 6px',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius)',
                          color: 'var(--color-text-muted)',
                          cursor: 'pointer',
                          transition: 'all var(--transition)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-accent)';
                          e.currentTarget.style.color = 'var(--color-accent)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                          e.currentTarget.style.color = 'var(--color-text-muted)';
                        }}
                      >
                        <Power size={12} />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(rule.id)}
                        title="Delete rule"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '3px 6px',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius)',
                          color: 'var(--color-text-muted)',
                          cursor: 'pointer',
                          transition: 'all var(--transition)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-danger)';
                          e.currentTarget.style.color = 'var(--color-danger)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                          e.currentTarget.style.color = 'var(--color-text-muted)';
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

// ============================================================================
// Notifications Tab
// ============================================================================

function NotificationsTab() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications-page', unreadOnly],
    queryFn: () => getNotifications(unreadOnly),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            style={{ accentColor: 'var(--color-accent)' }}
          />
          UNREAD ONLY ({unreadCount})
        </label>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              color: 'var(--color-accent)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '1px',
              cursor: 'pointer',
              transition: 'all var(--transition)',
            }}
          >
            <Check size={12} />
            MARK ALL READ
          </button>
        )}
      </div>

      <Card title={`NOTIFICATIONS (${notifications.length})`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {notifications.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}>
              No notifications
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                style={{
                  padding: '10px 14px',
                  backgroundColor: notif.is_read ? 'var(--color-bg)' : 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderLeft: notif.is_read ? '3px solid var(--color-border)' : '3px solid var(--color-accent)',
                  borderRadius: 'var(--radius)',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  opacity: notif.is_read ? 0.7 : 1,
                }}
              >
                <Bell size={14} style={{ color: notif.is_read ? 'var(--color-text-muted)' : 'var(--color-accent)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: notif.is_read ? 400 : 700,
                      color: notif.is_read ? 'var(--color-text)' : 'var(--color-text-bright)',
                      marginBottom: 3,
                    }}
                  >
                    {notif.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--color-text-muted)',
                      lineHeight: 1.4,
                      marginBottom: 4,
                    }}
                  >
                    {notif.body}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      gap: 8,
                    }}
                  >
                    <span>{formatRelativeTime(notif.created_at)}</span>
                    {notif.link_url && (
                      <span style={{ color: 'var(--color-accent)' }}>{notif.link_url}</span>
                    )}
                    {notif.is_read && notif.read_at && (
                      <span>Read {formatRelativeTime(notif.read_at)}</span>
                    )}
                  </div>
                </div>
                {!notif.is_read && (
                  <button
                    onClick={() => markReadMutation.mutate(notif.id)}
                    title="Mark as read"
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      color: 'var(--color-text-muted)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      cursor: 'pointer',
                      transition: 'all var(--transition)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-accent)';
                      e.currentTarget.style.color = 'var(--color-accent)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.color = 'var(--color-text-muted)';
                    }}
                  >
                    <Check size={10} />
                    READ
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </>
  );
}

// ============================================================================
// Main AlertsPage with Tabs
// ============================================================================

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('alerts');

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            {tab.key === 'alerts' && <AlertTriangle size={10} />}
            {tab.key === 'rules' && <Settings size={10} />}
            {tab.key === 'notifications' && <Bell size={10} />}
            {tab.key === 'preferences' && <Shield size={10} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'alerts' && <AlertsTab />}
      {activeTab === 'rules' && <RulesTab />}
      {activeTab === 'notifications' && <NotificationsTab />}
      {activeTab === 'preferences' && <NotificationPreferences />}
    </div>
  );
}
