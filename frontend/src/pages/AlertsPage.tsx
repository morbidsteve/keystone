import { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, Check, Filter, Shield, Settings, Bell, Plus, Trash2, Power, Lightbulb } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import StatusDot from '@/components/ui/StatusDot';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';
import { AlertSeverity, type Alert, type AlertRule, type Notification, type LogisticsRecommendation } from '@/lib/types';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { getAlerts, acknowledgeAlert, resolveAlert, getAlertSummary, getAlertRules, createAlertRule, updateAlertRule, deleteAlertRule, evaluateRule } from '@/api/alerts';
import { getRecommendations, approveRecommendation, denyRecommendation } from '@/api/predictions';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/api/notifications';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useToast } from '@/hooks/useToast';

type TabKey = 'alerts' | 'rules' | 'notifications' | 'preferences' | 'predictions';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'alerts', label: 'ALERTS' },
  { key: 'rules', label: 'RULES' },
  { key: 'notifications', label: 'NOTIFICATIONS' },
  { key: 'preferences', label: 'PREFERENCES' },
  { key: 'predictions', label: 'PREDICTIONS' },
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
  const toast = useToast();

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
      toast.success('Alert acknowledged');
    },
    onError: () => {
      toast.danger('Failed to acknowledge alert');
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => resolveAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-summary'] });
      toast.success('Alert resolved');
    },
    onError: () => {
      toast.danger('Failed to resolve alert');
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
  const toast = useToast();

  const { data: rules = [] } = useQuery<AlertRule[]>({
    queryKey: ['alert-rules'],
    queryFn: () => getAlertRules(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<AlertRule>) => createAlertRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      setShowCreateForm(false);
      toast.success('Alert rule created');
    },
    onError: () => {
      toast.danger('Failed to create alert rule');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (rule: AlertRule) => updateAlertRule(rule.id, { is_active: !rule.is_active }),
    onSuccess: (_data, rule) => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      toast.success(`Rule ${rule.is_active ? 'disabled' : 'enabled'}`);
    },
    onError: () => {
      toast.danger('Failed to update alert rule');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAlertRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      toast.success('Alert rule deleted');
    },
    onError: () => {
      toast.danger('Failed to delete alert rule');
    },
  });

  const [scopeType, setScopeType] = useState('ANY_UNIT');
  const [metricType, setMetricType] = useState('DOS');
  const [autoRecommend, setAutoRecommend] = useState(false);
  const [notifyRoles, setNotifyRoles] = useState<string[]>([]);

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const notifyRolesArr = notifyRoles.length > 0 ? notifyRoles : undefined;
    const supplyClass = formData.get('supply_class') as string;
    const metricItemFilter = supplyClass ? { supply_class: supplyClass } : undefined;
    createMutation.mutate({
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      alert_type: formData.get('alert_type') as string,
      severity: formData.get('severity') as string,
      metric: formData.get('metric') as string,
      operator: formData.get('operator') as AlertRule['operator'],
      threshold_value: Number(formData.get('threshold_value')),
      cooldown_minutes: Number(formData.get('cooldown_minutes') || 60),
      is_scope_all: scopeType === 'ANY_UNIT',
      is_active: true,
      scope_type: scopeType,
      scope_echelon: scopeType === 'ECHELON' ? (formData.get('scope_echelon') as string) : undefined,
      scope_unit_id: scopeType === 'SPECIFIC_UNIT' ? Number(formData.get('scope_unit_id')) : undefined,
      include_subordinates: scopeType === 'SUBORDINATES',
      metric_type: metricType,
      metric_item_filter: metricItemFilter,
      notify_roles: notifyRolesArr,
      check_interval_minutes: Number(formData.get('check_interval_minutes') || 15),
      auto_recommend: autoRecommend,
      recommend_type: autoRecommend ? (formData.get('recommend_type') as string) : undefined,
      recommend_source_unit_id: autoRecommend && formData.get('recommend_source_unit_id') ? Number(formData.get('recommend_source_unit_id')) : undefined,
      recommend_assign_to_role: autoRecommend ? (formData.get('recommend_assign_to_role') as string) : undefined,
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
            {/* Basic Fields */}
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

            {/* Scope Section */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1.5px', marginBottom: 8 }}>SCOPE</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
                {(['ANY_UNIT', 'SPECIFIC_UNIT', 'ECHELON', 'SUBORDINATES'] as const).map((st) => (
                  <label key={st} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text)', cursor: 'pointer' }}>
                    <input type="radio" name="scope_type_radio" checked={scopeType === st} onChange={() => setScopeType(st)} style={{ accentColor: 'var(--color-accent)' }} />
                    {st.replace(/_/g, ' ')}
                  </label>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {scopeType === 'SPECIFIC_UNIT' && (
                  <div>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>UNIT ID</label>
                    <input name="scope_unit_id" type="number" style={inputStyle} placeholder="Unit ID" />
                  </div>
                )}
                {scopeType === 'ECHELON' && (
                  <div>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>ECHELON</label>
                    <select name="scope_echelon" style={inputStyle}>
                      <option value="MEF">MEF</option>
                      <option value="DIVISION">DIVISION</option>
                      <option value="REGIMENT">REGIMENT</option>
                      <option value="BATTALION">BATTALION</option>
                      <option value="COMPANY">COMPANY</option>
                      <option value="PLATOON">PLATOON</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Metric Type & Item Filter */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1.5px', marginBottom: 8 }}>METRIC CONFIGURATION</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>METRIC TYPE</label>
                  <select value={metricType} onChange={(e) => setMetricType(e.target.value)} style={inputStyle}>
                    <option value="DOS">DOS</option>
                    <option value="READINESS_PCT">READINESS_PCT</option>
                    <option value="ON_HAND_QTY">ON_HAND_QTY</option>
                    <option value="FILL_RATE">FILL_RATE</option>
                    <option value="MAINTENANCE_BACKLOG">MAINTENANCE_BACKLOG</option>
                    <option value="FUEL_LEVEL">FUEL_LEVEL</option>
                  </select>
                </div>
                {(metricType === 'DOS' || metricType === 'ON_HAND_QTY') && (
                  <div>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>SUPPLY CLASS FILTER</label>
                    <input name="supply_class" style={inputStyle} placeholder="e.g. V, III, IX" />
                  </div>
                )}
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>CHECK INTERVAL (min)</label>
                  <input name="check_interval_minutes" type="number" defaultValue={15} style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Notify Roles */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1.5px', marginBottom: 8 }}>NOTIFY ROLES</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {['S4', 'CO', 'XO', 'BN_CDR'].map((role) => (
                  <label key={role} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={notifyRoles.includes(role)}
                      onChange={(e) => {
                        if (e.target.checked) setNotifyRoles([...notifyRoles, role]);
                        else setNotifyRoles(notifyRoles.filter(r => r !== role));
                      }}
                      style={{ accentColor: 'var(--color-accent)' }}
                    />
                    {role}
                  </label>
                ))}
              </div>
            </div>

            {/* Auto-Recommend */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text)', cursor: 'pointer', marginBottom: 8 }}>
                <input type="checkbox" checked={autoRecommend} onChange={(e) => setAutoRecommend(e.target.checked)} style={{ accentColor: 'var(--color-accent)' }} />
                AUTO-RECOMMEND ACTION
              </label>
              {autoRecommend && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>RECOMMEND TYPE</label>
                    <select name="recommend_type" style={inputStyle}>
                      <option value="RESUPPLY">RESUPPLY</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                      <option value="FUEL_DELIVERY">FUEL_DELIVERY</option>
                      <option value="PERSONNEL_MOVE">PERSONNEL_MOVE</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>SOURCE UNIT ID</label>
                    <input name="recommend_source_unit_id" type="number" style={inputStyle} placeholder="Optional" />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>ASSIGN TO ROLE</label>
                    <select name="recommend_assign_to_role" style={inputStyle}>
                      <option value="S4">S4</option>
                      <option value="CO">CO</option>
                      <option value="XO">XO</option>
                      <option value="BN_CDR">BN_CDR</option>
                    </select>
                  </div>
                </div>
              )}
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
                <th style={thStyle}>SCOPE</th>
                <th style={thStyle}>METRIC TYPE</th>
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
                  <td style={tdStyle}>{rule.scope_type || (rule.is_scope_all ? 'ANY_UNIT' : 'SPECIFIC')}</td>
                  <td style={tdStyle}>{rule.metric_type || '--'}</td>
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
  const toast = useToast();

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
      toast.success('Notification marked as read');
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('All notifications marked as read');
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
// Predictions Tab
// ============================================================================

const RECOMMENDATION_TYPE_COLORS: Record<string, string> = {
  RESUPPLY: 'var(--color-info)',
  MAINTENANCE: 'var(--color-warning)',
  FUEL_DELIVERY: '#eab308',
  PERSONNEL_MOVE: 'var(--color-success, #22c55e)',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'var(--color-warning)',
  APPROVED: 'var(--color-success, #22c55e)',
  DENIED: 'var(--color-danger)',
  EXECUTED: 'var(--color-accent)',
  EXPIRED: 'var(--color-text-muted)',
};

function PredictionsTab() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [denyNotes, setDenyNotes] = useState<Record<number, string>>({});
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: recommendations = [] } = useQuery<LogisticsRecommendation[]>({
    queryKey: ['predictions', statusFilter === 'ALL' ? undefined : statusFilter],
    queryFn: () => getRecommendations(statusFilter === 'ALL' ? undefined : statusFilter),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) => approveRecommendation(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      toast.success('Recommendation approved');
    },
    onError: () => {
      toast.danger('Failed to approve recommendation');
    },
  });

  const denyMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) => denyRecommendation(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      toast.success('Recommendation denied');
    },
    onError: () => {
      toast.danger('Failed to deny recommendation');
    },
  });

  const pendingCount = recommendations.filter(r => r.status === 'PENDING').length;
  const approvedCount = recommendations.filter(r => r.status === 'APPROVED').length;
  const deniedCount = recommendations.filter(r => r.status === 'DENIED').length;

  const badgeStyle = (color: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '1px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: color,
  });

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    backgroundColor: active ? 'var(--color-accent)' : 'transparent',
    border: active ? 'none' : '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    color: active ? '#fff' : 'var(--color-text-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '1px',
    cursor: 'pointer',
    transition: 'all var(--transition)',
  });

  const miniThStyle: React.CSSProperties = {
    padding: '4px 8px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 9,
    letterSpacing: '1px',
    color: 'var(--color-text-muted)',
    borderBottom: '1px solid var(--color-border)',
  };

  const miniTdStyle: React.CSSProperties = {
    padding: '4px 8px',
    fontSize: 10,
    color: 'var(--color-text)',
    borderBottom: '1px solid var(--color-border)',
  };

  return (
    <>
      {/* Summary Cards */}
      <div className="grid-responsive-4col">
        {[
          { label: 'TOTAL', value: recommendations.length, color: 'var(--color-text-bright)' },
          { label: 'PENDING', value: pendingCount, color: 'var(--color-warning)' },
          { label: 'APPROVED', value: approvedCount, color: 'var(--color-success, #22c55e)' },
          { label: 'DENIED', value: deniedCount, color: 'var(--color-danger)' },
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

      {/* Filter Buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['ALL', 'PENDING', 'APPROVED', 'DENIED', 'EXECUTED'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} style={filterBtnStyle(statusFilter === s)}>
            {s}
          </button>
        ))}
      </div>

      {/* Recommendation Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {recommendations.length === 0 ? (
          <Card title="PREDICTIONS">
            <div style={{ padding: 24, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}>
              No recommendations found
            </div>
          </Card>
        ) : (
          recommendations.map((rec) => (
            <Card key={rec.id} title={`REC-${String(rec.id).padStart(4, '0')}`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Header row: badges + description */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={badgeStyle(RECOMMENDATION_TYPE_COLORS[rec.recommendation_type] || 'var(--color-text-muted)')}>
                    {rec.recommendation_type.replace(/_/g, ' ')}
                  </span>
                  <span style={badgeStyle(STATUS_COLORS[rec.status] || 'var(--color-text-muted)')}>
                    {rec.status}
                  </span>
                  {rec.assigned_to_role && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1px' }}>
                      ASSIGNED: {rec.assigned_to_role}
                    </span>
                  )}
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-bright)', lineHeight: 1.5 }}>
                  {rec.description}
                </div>

                {rec.triggered_by_metric && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-warning)' }}>
                    TRIGGER: {rec.triggered_by_metric}
                  </div>
                )}

                {/* Items Table */}
                {rec.recommended_items && rec.recommended_items.length > 0 && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1.5px', marginBottom: 4 }}>ITEMS</div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)' }}>
                        <thead>
                          <tr>
                            {Object.keys(rec.recommended_items[0]).map((key) => (
                              <th key={key} style={miniThStyle}>{key.toUpperCase().replace(/_/g, ' ')}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rec.recommended_items.map((item: any, idx: number) => (
                            <tr key={idx}>
                              {Object.values(item).map((val: any, vidx: number) => (
                                <td key={vidx} style={miniTdStyle}>{typeof val === 'number' ? val.toLocaleString() : String(val)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Vehicles */}
                {rec.recommended_vehicles && rec.recommended_vehicles.length > 0 && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1.5px', marginBottom: 4 }}>VEHICLES</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {rec.recommended_vehicles.map((v: any, idx: number) => (
                        <div key={idx} style={{
                          padding: '6px 10px',
                          backgroundColor: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: 'var(--color-text)',
                        }}>
                          {v.vehicle_type} <span style={{ color: v.status === 'FMC' ? 'var(--color-success, #22c55e)' : 'var(--color-danger)', fontSize: 9 }}>{v.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personnel */}
                {rec.recommended_personnel && rec.recommended_personnel.length > 0 && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '1.5px', marginBottom: 4 }}>PERSONNEL</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {rec.recommended_personnel.map((p: any, idx: number) => (
                        <div key={idx} style={{
                          padding: '6px 10px',
                          backgroundColor: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: 'var(--color-text)',
                        }}>
                          {p.rank} {p.name} <span style={{ color: 'var(--color-text-muted)', fontSize: 9 }}>({p.role})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estimates */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {rec.estimated_cost != null && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>
                      COST: <span style={{ color: 'var(--color-text-bright)' }}>${rec.estimated_cost.toLocaleString()}</span>
                    </div>
                  )}
                  {rec.estimated_weight != null && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>
                      WEIGHT: <span style={{ color: 'var(--color-text-bright)' }}>{rec.estimated_weight.toLocaleString()} lbs</span>
                    </div>
                  )}
                  {rec.estimated_duration && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>
                      DURATION: <span style={{ color: 'var(--color-text-bright)' }}>{rec.estimated_duration}</span>
                    </div>
                  )}
                  {rec.recommended_source && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>
                      SOURCE: <span style={{ color: 'var(--color-text-bright)' }}>{rec.recommended_source}</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {rec.notes && (
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-text-muted)',
                    fontStyle: 'italic',
                  }}>
                    {rec.notes}
                  </div>
                )}

                {rec.decided_at && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)' }}>
                    Decided {formatRelativeTime(rec.decided_at)}
                  </div>
                )}

                {/* Action Buttons for PENDING */}
                {rec.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
                    <input
                      type="text"
                      placeholder="Notes (optional)"
                      value={denyNotes[rec.id] || ''}
                      onChange={(e) => setDenyNotes({ ...denyNotes, [rec.id]: e.target.value })}
                      style={{
                        flex: 1,
                        minWidth: 150,
                        padding: '6px 10px',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--color-text)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                      }}
                    />
                    <button
                      onClick={() => approveMutation.mutate({ id: rec.id, notes: denyNotes[rec.id] })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 14px',
                        backgroundColor: 'var(--color-success, #22c55e)',
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
                      <Check size={12} />
                      APPROVE & EXECUTE
                    </button>
                    <button
                      onClick={() => denyMutation.mutate({ id: rec.id, notes: denyNotes[rec.id] })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 14px',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--color-danger)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--color-danger)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        letterSpacing: '1px',
                        cursor: 'pointer',
                        transition: 'all var(--transition)',
                      }}
                    >
                      DENY
                    </button>
                  </div>
                )}

                {/* Timestamp */}
                {rec.created_at && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)' }}>
                    Created {formatRelativeTime(rec.created_at)}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
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
            {tab.key === 'predictions' && <Lightbulb size={10} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'alerts' && <AlertsTab />}
      {activeTab === 'rules' && <RulesTab />}
      {activeTab === 'notifications' && <NotificationsTab />}
      {activeTab === 'preferences' && <NotificationPreferences />}
      {activeTab === 'predictions' && <PredictionsTab />}
    </div>
  );
}
