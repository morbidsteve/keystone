import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotificationPreferences, updateNotificationPreference } from '../../api/notifications';
import { AlertType, type NotificationPreference } from '../../lib/types';
import Card from '../ui/Card';

const ALERT_TYPE_LABELS: Record<string, string> = {
  LOW_DOS: 'Low Days of Supply',
  LOW_READINESS: 'Low Readiness',
  CONVOY_DELAYED: 'Convoy Delayed',
  ANOMALY: 'Anomaly Detected',
  SUPPLY_LOW: 'Supply Low',
  SUPPLY_CRITICAL: 'Supply Critical',
  EQUIPMENT_DOWN: 'Equipment Down',
  READINESS_DROP: 'Readiness Drop',
  MOVEMENT_DELAYED: 'Movement Delayed',
  INGESTION_ERROR: 'Ingestion Error',
  SYSTEM: 'System',
  EQUIPMENT_DEADLINED: 'Equipment Deadlined',
  PM_OVERDUE: 'PM Overdue',
  PARTS_BACKORDERED: 'Parts Backordered',
  CASUALTY_REPORTED: 'Casualty Reported',
  BLOOD_PRODUCT_EXPIRING: 'Blood Product Expiring',
  REQUISITION_PENDING_APPROVAL: 'Requisition Pending Approval',
  REPORT_DUE: 'Report Due',
  STRENGTH_BELOW_THRESHOLD: 'Strength Below Threshold',
  EAS_APPROACHING: 'EAS Approaching',
  SECURITY_CLEARANCE_EXPIRING: 'Security Clearance Expiring',
  FUEL_CRITICAL: 'Fuel Critical',
  AMMO_BELOW_RSR: 'Ammo Below RSR',
};

const CHANNEL_OPTIONS = ['IN_APP', 'EMAIL', 'BOTH', 'NONE'] as const;
const SEVERITY_OPTIONS = ['INFO', 'WARNING', 'CRITICAL'] as const;

export default function NotificationPreferences() {
  const queryClient = useQueryClient();

  const { data: preferences = [] } = useQuery<NotificationPreference[]>({
    queryKey: ['notification-preferences'],
    queryFn: () => getNotificationPreferences(),
  });

  const updateMutation = useMutation({
    mutationFn: (args: { alertType: string; channel: string; min_severity: string }) =>
      updateNotificationPreference(args.alertType, { channel: args.channel, min_severity: args.min_severity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });

  const allAlertTypes = Object.values(AlertType);

  const getPreference = (alertType: string): NotificationPreference | undefined =>
    preferences.find(p => p.alert_type === alertType);

  const handleChannelChange = (alertType: string, channel: string) => {
    const existing = getPreference(alertType);
    updateMutation.mutate({
      alertType,
      channel,
      min_severity: existing?.min_severity ?? 'WARNING',
    });
  };

  const handleSeverityChange = (alertType: string, min_severity: string) => {
    const existing = getPreference(alertType);
    updateMutation.mutate({
      alertType,
      channel: existing?.channel ?? 'IN_APP',
      min_severity,
    });
  };

  const selectStyle: React.CSSProperties = {
    padding: '4px 8px',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    cursor: 'pointer',
  };

  return (
    <Card title="NOTIFICATION PREFERENCES">
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
          }}
        >
          <thead>
            <tr>
              {['ALERT TYPE', 'CHANNEL', 'MIN SEVERITY'].map((header) => (
                <th
                  key={header}
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: 9,
                    letterSpacing: '1.5px',
                    color: 'var(--color-text-muted)',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allAlertTypes.map((alertType) => {
              const pref = getPreference(alertType);
              return (
                <tr
                  key={alertType}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <td
                    style={{
                      padding: '8px 12px',
                      color: 'var(--color-text-bright)',
                      fontWeight: 500,
                    }}
                  >
                    {ALERT_TYPE_LABELS[alertType] || alertType}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <select
                      value={pref?.channel ?? 'IN_APP'}
                      onChange={(e) => handleChannelChange(alertType, e.target.value)}
                      style={selectStyle}
                    >
                      {CHANNEL_OPTIONS.map((ch) => (
                        <option key={ch} value={ch}>{ch.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <select
                      value={pref?.min_severity ?? 'WARNING'}
                      onChange={(e) => handleSeverityChange(alertType, e.target.value)}
                      style={selectStyle}
                    >
                      {SEVERITY_OPTIONS.map((sev) => (
                        <option key={sev} value={sev}>{sev}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
