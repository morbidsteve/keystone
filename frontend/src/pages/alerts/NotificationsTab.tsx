import { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import type { Notification } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/api/notifications';
import { useToast } from '@/hooks/useToast';

export default function NotificationsTab() {
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
      <div className="flex gap-3 items-center justify-between flex-wrap">
        <label
          className="flex items-center gap-1.5 font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)] cursor-pointer"
        >
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="accent-[var(--color-accent)]"
          />
          UNREAD ONLY ({unreadCount})
        </label>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            className="flex items-center gap-1 py-1.5 px-3 bg-transparent border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-accent)] font-[var(--font-mono)] text-[10px] tracking-[1px] cursor-pointer transition-all duration-[var(--transition)]"
          >
            <Check size={12} />
            MARK ALL READ
          </button>
        )}
      </div>

      <Card title={`NOTIFICATIONS (${notifications.length})`}>
        <div className="flex flex-col gap-1">
          {notifications.length === 0 ? (
            <div className="p-6 text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]">
              No notifications
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className="py-2.5 px-3.5 border border-[var(--color-border)] rounded-[var(--radius)] flex gap-2.5 items-start" style={{ backgroundColor: notif.is_read ? 'var(--color-bg)' : 'var(--color-bg-surface)', borderLeft: notif.is_read ? '3px solid var(--color-border)' : '3px solid var(--color-accent)', opacity: notif.is_read ? 0.7 : 1 }}
              >
                <Bell size={14} className="shrink-0 mt-0.5" style={{ color: notif.is_read ? 'var(--color-text-muted)' : 'var(--color-accent)' }} />
                <div className="flex-1 min-w-0">
                  <div
                    className="font-[var(--font-mono)] text-[11px] mb-[3px]" style={{ fontWeight: notif.is_read ? 400 : 700, color: notif.is_read ? 'var(--color-text)' : 'var(--color-text-bright)' }}
                  >
                    {notif.title}
                  </div>
                  <div
                    className="text-[11px] text-[var(--color-text-muted)] leading-[1.4] mb-1"
                  >
                    {notif.body}
                  </div>
                  <div
                    className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] flex gap-2"
                  >
                    <span>{formatRelativeTime(notif.created_at)}</span>
                    {notif.link_url && (
                      <span className="text-[var(--color-accent)]">{notif.link_url}</span>
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
                    className="shrink-0 flex items-center gap-1 py-1 px-2 bg-transparent border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text-muted)] font-[var(--font-mono)] text-[9px] cursor-pointer transition-all duration-[var(--transition)]"
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
