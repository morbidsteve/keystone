import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import Card from '@/components/ui/Card';
import { User, Shield, Bell, Monitor, Clock, Layout } from 'lucide-react';

const AVAILABLE_PAGES = [
  { value: '/dashboard', label: 'Dashboard' },
  { value: '/map', label: 'Map View' },
  { value: '/supply', label: 'Supply Status' },
  { value: '/equipment', label: 'Equipment Readiness' },
  { value: '/maintenance', label: 'Maintenance' },
  { value: '/requisitions', label: 'Requisitions' },
  { value: '/personnel', label: 'Personnel' },
  { value: '/readiness', label: 'Readiness' },
  { value: '/alerts', label: 'Alerts' },
];

function Toggle({
  enabled,
  onToggle,
  label,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)]">
        {label}
      </span>
      <button
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        onClick={onToggle}
        className="relative inline-flex h-5 w-9 items-center rounded-full cursor-pointer transition-colors duration-200"
        style={{
          backgroundColor: enabled ? 'var(--color-accent)' : 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <span
          className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200"
          style={{
            transform: enabled ? 'translateX(17px)' : 'translateX(3px)',
          }}
        />
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { timeFormat, toggleTimeFormat } = usePreferencesStore();

  // Display preferences (local state, persisted to localStorage)
  const [defaultPage, setDefaultPage] = useState(() => {
    try {
      return localStorage.getItem('keystone_default_page') || '/dashboard';
    } catch {
      return '/dashboard';
    }
  });

  // Notification preferences (UI only, no backend)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [alertSound, setAlertSound] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(false);

  const handleDefaultPageChange = (value: string) => {
    setDefaultPage(value);
    try {
      localStorage.setItem('keystone_default_page', value);
    } catch {
      // ignore
    }
  };

  return (
    <div className="animate-fade-in max-w-[800px] mx-auto flex flex-col gap-4">
      {/* User Info */}
      <Card title="USER INFORMATION">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              border: '2px solid var(--color-border)',
            }}
          >
            <User size={28} className="text-[var(--color-text-muted)]" />
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            <div>
              <div className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-0.5">
                Full Name
              </div>
              <div className="font-[var(--font-mono)] text-[13px] text-[var(--color-text-bright)] font-semibold">
                {user?.full_name || '--'}
              </div>
            </div>
            <div>
              <div className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-0.5">
                Username
              </div>
              <div className="font-[var(--font-mono)] text-[13px] text-[var(--color-text)]">
                {user?.username || '--'}
              </div>
            </div>
            <div>
              <div className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-0.5">
                Role
              </div>
              <div className="flex items-center gap-1.5">
                <Shield size={12} className="text-[var(--color-accent)]" />
                <span className="font-[var(--font-mono)] text-[13px] text-[var(--color-text)]">
                  {user?.role || '--'}
                </span>
              </div>
            </div>
            <div>
              <div className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-0.5">
                Unit ID
              </div>
              <div className="font-[var(--font-mono)] text-[13px] text-[var(--color-text)]">
                {user?.unit_id ?? '--'}
              </div>
            </div>
            {user?.email && (
              <div>
                <div className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-0.5">
                  Email
                </div>
                <div className="font-[var(--font-mono)] text-[13px] text-[var(--color-text)]">
                  {user.email}
                </div>
              </div>
            )}
            {user?.demo_profile && (
              <>
                <div>
                  <div className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-0.5">
                    Rank
                  </div>
                  <div className="font-[var(--font-mono)] text-[13px] text-[var(--color-text)]">
                    {user.demo_profile.rank}
                  </div>
                </div>
                <div>
                  <div className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-0.5">
                    Billet
                  </div>
                  <div className="font-[var(--font-mono)] text-[13px] text-[var(--color-text)]">
                    {user.demo_profile.billet}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Display Preferences */}
      <Card title="DISPLAY PREFERENCES">
        <div className="flex flex-col gap-3">
          {/* Default Page */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Layout size={14} className="text-[var(--color-text-muted)]" />
              <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)]">
                Default Page
              </span>
            </div>
            <select
              value={defaultPage}
              onChange={(e) => handleDefaultPageChange(e.target.value)}
              className="font-[var(--font-mono)] text-[11px] py-1 px-2 rounded cursor-pointer"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                outline: 'none',
              }}
            >
              {AVAILABLE_PAGES.map((page) => (
                <option key={page.value} value={page.value}>
                  {page.label}
                </option>
              ))}
            </select>
          </div>

          {/* Time Format */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-[var(--color-text-muted)]" />
              <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)]">
                Time Format
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleTimeFormat}
                className="font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] py-1 px-2.5 rounded cursor-pointer"
                style={{
                  backgroundColor:
                    timeFormat === 'relative'
                      ? 'rgba(77, 171, 247, 0.15)'
                      : 'transparent',
                  border: `1px solid ${timeFormat === 'relative' ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  color:
                    timeFormat === 'relative'
                      ? 'var(--color-accent)'
                      : 'var(--color-text-muted)',
                }}
              >
                RELATIVE
              </button>
              <button
                onClick={toggleTimeFormat}
                className="font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] py-1 px-2.5 rounded cursor-pointer"
                style={{
                  backgroundColor:
                    timeFormat === 'absolute'
                      ? 'rgba(77, 171, 247, 0.15)'
                      : 'transparent',
                  border: `1px solid ${timeFormat === 'absolute' ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  color:
                    timeFormat === 'absolute'
                      ? 'var(--color-accent)'
                      : 'var(--color-text-muted)',
                }}
              >
                ABSOLUTE
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card title="NOTIFICATION PREFERENCES">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={14} className="text-[var(--color-text-muted)]" />
            <span className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)]">
              Configure how you receive notifications
            </span>
          </div>
          <div
            className="border-t border-t-[var(--color-border)] pt-2"
          >
            <Toggle
              label="Email Notifications"
              enabled={emailNotifications}
              onToggle={() => setEmailNotifications(!emailNotifications)}
            />
          </div>
          <div
            className="border-t border-t-[var(--color-border)]"
          >
            <Toggle
              label="Alert Sound"
              enabled={alertSound}
              onToggle={() => setAlertSound(!alertSound)}
            />
          </div>
          <div
            className="border-t border-t-[var(--color-border)]"
          >
            <Toggle
              label="Desktop Notifications"
              enabled={desktopNotifications}
              onToggle={() => setDesktopNotifications(!desktopNotifications)}
            />
          </div>
          {desktopNotifications && (
            <div className="mt-2 py-2 px-3 rounded" style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <Monitor size={12} className="text-[var(--color-warning)]" />
                <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]">
                  Browser permission required for desktop notifications
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
