import apiClient from './client';
import { isDemoMode } from './mockClient';
import type { Notification, NotificationPreference } from '../lib/types';

// Mock data
const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 1, user_id: 1, alert_id: 1, title: 'CRITICAL: CL III Below 2 DOS', body: '3/1 MOGAS at 2.0 DOS — immediate resupply required', link_url: '/supply', channel: 'IN_APP', is_read: false, created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: 2, user_id: 1, alert_id: 2, title: 'Equipment Readiness Below 70%', body: 'Alpha Co readiness at 65% — 3 vehicles deadlined', link_url: '/equipment', channel: 'IN_APP', is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, user_id: 1, alert_id: 3, title: 'PM Overdue: HMMWV M1151 B-24', body: 'Quarterly PM overdue by 12 days', link_url: '/equipment', channel: 'IN_APP', is_read: true, read_at: new Date(Date.now() - 7200000).toISOString(), created_at: new Date(Date.now() - 14400000).toISOString() },
  { id: 4, user_id: 1, title: 'Convoy PHOENIX delayed 3+ hours', body: 'Movement PHOENIX-07 delayed at CP3 due to IED threat', link_url: '/transportation', channel: 'IN_APP', is_read: false, created_at: new Date(Date.now() - 5400000).toISOString() },
  { id: 5, user_id: 1, title: 'Requisition REQ-2026-0042 awaiting approval', body: 'Priority 02 requisition for CL IX parts needs CO approval', link_url: '/supply-chain', channel: 'IN_APP', is_read: true, read_at: new Date(Date.now() - 10800000).toISOString(), created_at: new Date(Date.now() - 21600000).toISOString() },
];

const MOCK_PREFERENCES: NotificationPreference[] = [
  { id: 1, user_id: 1, alert_type: 'LOW_DOS', channel: 'BOTH', min_severity: 'WARNING' },
  { id: 2, user_id: 1, alert_type: 'LOW_READINESS', channel: 'IN_APP', min_severity: 'WARNING' },
  { id: 3, user_id: 1, alert_type: 'CONVOY_DELAYED', channel: 'IN_APP', min_severity: 'INFO' },
  { id: 4, user_id: 1, alert_type: 'PM_OVERDUE', channel: 'IN_APP', min_severity: 'WARNING' },
  { id: 5, user_id: 1, alert_type: 'CASUALTY_REPORTED', channel: 'BOTH', min_severity: 'INFO' },
];

export async function getNotifications(unreadOnly = false): Promise<Notification[]> {
  if (isDemoMode) {
    if (unreadOnly) return MOCK_NOTIFICATIONS.filter(n => !n.is_read);
    return MOCK_NOTIFICATIONS;
  }
  const params = unreadOnly ? '?unread_only=true' : '';
  const res = await apiClient.get(`/notifications${params}`);
  return res.data;
}

export async function getUnreadCount(): Promise<number> {
  if (isDemoMode) return MOCK_NOTIFICATIONS.filter(n => !n.is_read).length;
  const res = await apiClient.get('/notifications/unread-count');
  return res.data.count;
}

export async function markNotificationRead(id: number): Promise<void> {
  if (isDemoMode) {
    const n = MOCK_NOTIFICATIONS.find(notif => notif.id === id);
    if (n) { n.is_read = true; n.read_at = new Date().toISOString(); }
    return;
  }
  await apiClient.put(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  if (isDemoMode) {
    MOCK_NOTIFICATIONS.forEach(n => { n.is_read = true; n.read_at = new Date().toISOString(); });
    return;
  }
  await apiClient.put('/notifications/read-all');
}

export async function getNotificationPreferences(): Promise<NotificationPreference[]> {
  if (isDemoMode) return MOCK_PREFERENCES;
  const res = await apiClient.get('/notifications/preferences');
  return res.data;
}

export async function updateNotificationPreference(
  alertType: string,
  data: { channel: string; min_severity: string }
): Promise<NotificationPreference> {
  if (isDemoMode) {
    const existing = MOCK_PREFERENCES.find(p => p.alert_type === alertType);
    if (existing) {
      existing.channel = data.channel as NotificationPreference['channel'];
      existing.min_severity = data.min_severity;
      return existing;
    }
    const newPref: NotificationPreference = {
      id: MOCK_PREFERENCES.length + 1,
      user_id: 1,
      alert_type: alertType,
      channel: data.channel as NotificationPreference['channel'],
      min_severity: data.min_severity,
    };
    MOCK_PREFERENCES.push(newPref);
    return newPref;
  }
  const res = await apiClient.put(`/notifications/preferences/${alertType}`, data);
  return res.data;
}
