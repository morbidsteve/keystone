import { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, Check, Filter, Shield, ShieldCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import StatusDot from '@/components/ui/StatusDot';
import { AlertSeverity, type Alert } from '@/lib/types';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { getAlerts, acknowledgeAlert, resolveAlert, getAlertSummary } from '@/api/alerts';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useAlertStore } from '@/stores/alertStore';
import { useToast } from '@/hooks/useToast';
import EmptyState from '@/components/ui/EmptyState';

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

export default function AlertsTab() {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const selectedUnitId = useDashboardStore((s) => s.selectedUnitId);
  const markAcknowledged = useAlertStore((s) => s.markAcknowledged);
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
    onSuccess: (_data, id) => {
      markAcknowledged(id);
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
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] py-3 px-4 text-center"
          >
            <div className="section-header mb-1">{stat.label}</div>
            <div className="font-[var(--font-mono)] text-[28px] font-bold" style={{ color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <Filter size={14} className="text-[var(--color-text-muted)]" />
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="py-1.5 px-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text)] font-[var(--font-mono)] text-[11px]"
        >
          <option value="ALL">ALL SEVERITIES</option>
          <option value={AlertSeverity.CRITICAL}>CRITICAL</option>
          <option value={AlertSeverity.WARNING}>WARNING</option>
          <option value={AlertSeverity.INFO}>INFO</option>
        </select>

        <label
          className="flex items-center gap-1.5 font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)] cursor-pointer"
        >
          <input
            type="checkbox"
            checked={showAcknowledged}
            onChange={(e) => setShowAcknowledged(e.target.checked)}
            className="accent-[var(--color-accent)]"
          />
          SHOW ACKNOWLEDGED
        </label>

        <label
          className="flex items-center gap-1.5 font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)] cursor-pointer"
        >
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="accent-[var(--color-accent)]"
          />
          SHOW RESOLVED
        </label>
      </div>

      {/* Alert List */}
      <Card title={`ALERTS (${filtered.length})`}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck size={32} />}
            title="No active alerts"
            message="All systems operational"
          />
        ) : (
        <div className="flex flex-col gap-1.5">
          {filtered.map((alert) => {
            const color = getSeverityColor(alert.severity);
            return (
              <div
                key={alert.id}
                className="py-3 px-3.5 border border-[var(--color-border)] rounded-[var(--radius)]" style={{ backgroundColor: alert.acknowledged || alert.resolved ? 'var(--color-bg)' : 'var(--color-bg-surface)', borderLeft: `3px solid ${color}`, opacity: alert.resolved ? 0.5 : alert.acknowledged ? 0.6 : 1 }}
              >
                <div
                  className="flex justify-between items-start mb-1.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span style={{ color }}>{getSeverityIcon(alert.severity)}</span>
                    <div>
                      <div
                        className="font-[var(--font-mono)] text-xs font-bold text-[var(--color-text-bright)]"
                      >
                        {alert.title}
                      </div>
                      <div
                        className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] flex gap-2 mt-0.5"
                      >
                        <span className="flex items-center gap-[3px]">
                          <StatusDot status={getSeverityDot(alert.severity)} size={6} />
                          {alert.severity}
                        </span>
                        <span>{alert.unitName}</span>
                        <span>{formatRelativeTime(alert.createdAt)}</span>
                        {alert.resolved && (
                          <span className="text-[var(--color-success, #22c55e)]">RESOLVED</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    {!alert.acknowledged && !alert.resolved && (
                      <button
                        onClick={() => acknowledgeMutation.mutate(alert.id)}
                        className="flex items-center gap-1 py-1 px-2.5 bg-transparent border border-[var(--color-border-strong)] rounded-[var(--radius)] text-[var(--color-text-muted)] font-[var(--font-mono)] text-[10px] tracking-[1px] cursor-pointer transition-all duration-[var(--transition)]"
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
                        className="flex items-center gap-1 py-1 px-2.5 bg-transparent border border-[var(--color-border-strong)] rounded-[var(--radius)] text-[var(--color-text-muted)] font-[var(--font-mono)] text-[10px] tracking-[1px] cursor-pointer transition-all duration-[var(--transition)]"
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
                  className="text-xs text-[var(--color-text)] leading-normal pl-[26px]"
                >
                  {alert.message}
                </div>

                {alert.acknowledged && alert.acknowledgedBy && (
                  <div
                    className="mt-2 pl-[26px] font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
                  >
                    Acknowledged by {alert.acknowledgedBy} at{' '}
                    {alert.acknowledgedAt && formatDate(alert.acknowledgedAt)}
                  </div>
                )}

                {alert.resolved && alert.resolvedBy && (
                  <div
                    className="mt-1 pl-[26px] font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
                  >
                    Resolved by {alert.resolvedBy} at{' '}
                    {alert.resolvedAt && formatDate(alert.resolvedAt)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </Card>
    </>
  );
}
