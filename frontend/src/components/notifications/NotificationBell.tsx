import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from '../../api/notifications';
import type { Notification } from '../../lib/types';
import { formatRelativeTime } from '../../lib/utils';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(),
    refetchInterval: 30000,
  });

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['notifications-unread-count'],
    queryFn: () => getUnreadCount(),
    refetchInterval: 15000,
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: number) => {
    await markNotificationRead(id);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-[36px] h-[36px] bg-transparent border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text-muted)] cursor-pointer transition-all duration-[var(--transition)]"
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-accent)';
          e.currentTarget.style.color = 'var(--color-accent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.color = 'var(--color-text-muted)';
        }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            className="absolute top-[-4px] right-[-4px] min-w-[16px] h-[16px] flex items-center justify-center bg-[var(--color-danger)] text-[#fff] text-[9px] font-[var(--font-mono)] font-bold rounded-[8px] py-0 px-1 leading-none"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 top-[42px] w-[380px] max-h-[500px] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] z-[1000] flex flex-col" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
        >
          {/* Header */}
          <div
            className="flex justify-between items-center py-3 px-4 border-b border-b-[var(--color-border)]"
          >
            <span
              className="font-[var(--font-mono)] text-[11px] font-bold tracking-[1.5px] text-[var(--color-text-bright)]"
            >
              NOTIFICATIONS
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 py-[3px] px-2 bg-transparent border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-accent)] font-[var(--font-mono)] text-[9px] tracking-[1px] cursor-pointer transition-all duration-[var(--transition)]"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                <CheckCheck size={10} />
                MARK ALL READ
              </button>
            )}
          </div>

          {/* Notification List */}
          <div
            className="overflow-y-auto max-h-[400px] flex flex-col"
          >
            {notifications.length === 0 ? (
              <div
                className="p-6 text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
              >
                No notifications
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="py-2.5 px-4 border-b border-b-[var(--color-border)] flex gap-2.5 items-start" style={{ backgroundColor: notif.is_read ? 'transparent' : 'var(--color-bg-surface)', transition: 'background-color var(--transition)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-[var(--font-mono)] text-[11px] mb-[3px] whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontWeight: notif.is_read ? 400 : 700, color: notif.is_read ? 'var(--color-text)' : 'var(--color-text-bright)' }}
                    >
                      {notif.title}
                    </div>
                    <div
                      className="text-[11px] text-[var(--color-text-muted)] leading-[1.4] mb-1"
                    >
                      {notif.body}
                    </div>
                    <div
                      className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
                    >
                      {formatRelativeTime(notif.created_at)}
                    </div>
                  </div>
                  {!notif.is_read && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      title="Mark as read"
                      className="shrink-0 flex items-center justify-center w-[24px] h-[24px] bg-transparent border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text-muted)] cursor-pointer mt-0.5 transition-all duration-[var(--transition)]"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-accent)';
                        e.currentTarget.style.color = 'var(--color-accent)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                        e.currentTarget.style.color = 'var(--color-text-muted)';
                      }}
                    >
                      <Check size={12} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
