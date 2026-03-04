import { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, Check, Filter } from 'lucide-react';
import Card from '@/components/ui/Card';
import StatusDot from '@/components/ui/StatusDot';
import { AlertSeverity, type Alert } from '@/lib/types';
import { formatDate, formatRelativeTime } from '@/lib/utils';

const demoAlerts: Alert[] = [
  { id: '1', type: 'SUPPLY_CRITICAL' as never, severity: AlertSeverity.CRITICAL, unitId: '2-1', unitName: '2/1 BN', title: 'CL V AMMUNITION CRITICAL', message: '5.56mm Ball at 45% authorized level. 2 DOS remaining at current consumption rate. Emergency resupply requested.', acknowledged: false, createdAt: '2026-03-03T06:00:00Z' },
  { id: '2', type: 'SUPPLY_LOW' as never, severity: AlertSeverity.WARNING, unitId: '1-1', unitName: '1/1 BN', title: 'CL III POL LOW', message: 'JP-8 at 62% authorized. Consumption rate exceeding projections. 4 DOS remaining.', acknowledged: false, createdAt: '2026-03-03T07:30:00Z' },
  { id: '3', type: 'EQUIPMENT_DOWN' as never, severity: AlertSeverity.WARNING, unitId: '1-1', unitName: '1/1 BN', title: 'AAV READINESS BELOW THRESHOLD', message: '4x AAV NMC (33%). Water pump failure on AAV-12, transmission leak on AAV-08. Parts on backorder, ETA 48hrs.', acknowledged: false, createdAt: '2026-03-03T06:30:00Z' },
  { id: '4', type: 'MOVEMENT_DELAYED' as never, severity: AlertSeverity.WARNING, unitId: 'clb-1', unitName: 'CLB-1', title: 'CONVOY CHARLIE DELAYED', message: 'Delayed due to MSR BRAVO bridge restriction. Rerouting via ASR DELTA. New ETA +4hrs.', acknowledged: false, createdAt: '2026-03-03T08:00:00Z' },
  { id: '5', type: 'READINESS_DROP' as never, severity: AlertSeverity.CRITICAL, unitId: '3-1', unitName: '3/1 BN', title: 'UNIT READINESS CRITICAL', message: '3/1 BN overall readiness dropped to 68%. Multiple supply classes AMBER/RED. Sustainability at 3 DOS.', acknowledged: false, createdAt: '2026-03-03T05:00:00Z' },
  { id: '6', type: 'SUPPLY_LOW' as never, severity: AlertSeverity.WARNING, unitId: '2-1', unitName: '2/1 BN', title: 'CL IX PARTS SHORTAGE', message: 'HMMWV repair parts at 70%. Multiple items on backorder. Expected impact on vehicle readiness.', acknowledged: true, acknowledgedBy: 'sgt.jones', acknowledgedAt: '2026-03-03T07:00:00Z', createdAt: '2026-03-03T04:00:00Z' },
  { id: '7', type: 'INGESTION_ERROR' as never, severity: AlertSeverity.INFO, unitId: '', unitName: 'SYSTEM', title: 'INGESTION PARSE ERROR', message: 'File bad_format.txt could not be parsed. Unrecognized format.', acknowledged: true, acknowledgedBy: 'cpl.smith', acknowledgedAt: '2026-03-03T09:00:00Z', createdAt: '2026-03-03T08:30:00Z' },
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

export default function AlertsPage() {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  const filtered = demoAlerts.filter((a) => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (!showAcknowledged && a.acknowledged) return false;
    return true;
  });

  const criticalCount = demoAlerts.filter((a) => a.severity === AlertSeverity.CRITICAL && !a.acknowledged).length;
  const warningCount = demoAlerts.filter((a) => a.severity === AlertSeverity.WARNING && !a.acknowledged).length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary */}
      <div className="grid-responsive-4col">
        {[
          { label: 'TOTAL ACTIVE', value: demoAlerts.filter((a) => !a.acknowledged).length, color: 'var(--color-text-bright)' },
          { label: 'CRITICAL', value: criticalCount, color: 'var(--color-danger)' },
          { label: 'WARNING', value: warningCount, color: 'var(--color-warning)' },
          { label: 'ACKNOWLEDGED', value: demoAlerts.filter((a) => a.acknowledged).length, color: 'var(--color-text-muted)' },
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
                  backgroundColor: alert.acknowledged ? 'var(--color-bg)' : 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderLeft: `3px solid ${color}`,
                  borderRadius: 'var(--radius)',
                  opacity: alert.acknowledged ? 0.6 : 1,
                }}
              >
                <div
                  className="alert-item-header"
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
                      </div>
                    </div>
                  </div>

                  {!alert.acknowledged && (
                    <button
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
                      ACKNOWLEDGE
                    </button>
                  )}
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
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
