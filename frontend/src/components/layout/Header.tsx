import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Clock, HelpCircle, LogOut, Menu, Moon, RotateCcw, Sun, User } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useAlertStore } from '@/stores/alertStore';
import { useHelpMode } from '@/hooks/useHelpMode';
import { useThemeStore } from '@/stores/themeStore';
import { resetGuidedTour } from '@/components/onboarding/GuidedTour';
import { isDemoMode } from '@/api/mockClient';
import { TIME_RANGES } from '@/lib/constants';
import QuickActionsButton from '@/components/common/QuickActionsButton';
import NotificationDrawer from '@/components/notifications/NotificationDrawer';

const pageTitles: Record<string, string> = {
  '/dashboard': 'DASHBOARD',
  '/map': 'MAP VIEW',
  '/supply': 'SUPPLY STATUS',
  '/equipment': 'EQUIPMENT READINESS',
  '/transportation': 'TRANSPORTATION',
  '/ingestion': 'DATA INGESTION',
  '/data-sources': 'DATA SOURCES',
  '/reports': 'REPORTS',
  '/alerts': 'ALERTS',
  '/admin': 'ADMINISTRATION',
};

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { timeRange, setTimeRange } = useDashboardStore();
  const unreadCount = useAlertStore((s) => s.unreadCount);
  const { isHelpMode, toggleHelpMode } = useHelpMode();
  const { theme, toggleTheme } = useThemeStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const handleDrawerClose = useCallback(() => setDrawerOpen(false), []);

  const pageTitle = pageTitles[location.pathname] || 'KEYSTONE';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      role="banner"
      className="h-12 min-h-[48px] bg-bg-elevated border-b border-border flex items-center justify-between px-5 sticky top-0 z-[1050]"
    >
      {/* Page Title */}
      <div className="flex items-center gap-3">
        {/* Hamburger button (mobile only) */}
        <button
          className="hamburger-btn"
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        <h1
          className="font-mono text-[13px] font-semibold tracking-[2px] uppercase text-text-bright m-0"
        >
          {pageTitle}
        </h1>
        {isDemoMode && (
          <span
            className="hide-mobile font-mono text-3xs font-semibold tracking-[1.5px] text-warning rounded bg-[rgba(250,176,5,0.1)] py-0.5 px-2"
            style={{ border: '1px solid rgba(250, 176, 5, 0.3)' }}
          >
            DEMO DATA
          </span>
        )}
      </div>

      {/* Right Controls */}
      <div className="header-right-controls flex items-center gap-4" role="toolbar" aria-label="Header controls">
        {/* Quick Actions */}
        <QuickActionsButton />

        {/* Time Range Selector (hidden on mobile) */}
        <div className="header-time-range flex items-center gap-0.5" role="group" aria-label="Time range selector">
          <Clock size={12} className="text-text-muted mr-1.5" aria-hidden="true" />
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              aria-pressed={timeRange === range.value}
              className="font-mono text-2xs tracking-[1px] rounded cursor-pointer py-1 px-2"
              style={{ border: '1px solid', borderColor: timeRange === range.value
                    ? 'var(--color-accent)'
                    : 'var(--color-border)', backgroundColor: timeRange === range.value
                    ? 'rgba(77, 171, 247, 0.15)'
                    : 'transparent', color: timeRange === range.value
                    ? 'var(--color-accent)'
                    : 'var(--color-text-muted)', transition: 'all var(--transition)' }}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex items-center justify-center rounded cursor-pointer p-1"
          style={{
            background: 'none',
            border: '1px solid transparent',
            color: 'var(--color-text-muted)',
            transition: 'all var(--transition)',
          }}
        >
          {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        </button>

        {/* Help Mode Toggle */}
        <button
          id="header-help-button"
          onClick={toggleHelpMode}
          title="Toggle Help Mode"
          aria-label={isHelpMode ? 'Disable help mode' : 'Enable help mode'}
          aria-pressed={isHelpMode}
          className="flex items-center gap-1 rounded cursor-pointer py-1 px-2"
          style={{ background: isHelpMode ? 'rgba(77, 171, 247, 0.15)' : 'none', border: isHelpMode ? '1px solid var(--color-accent)' : '1px solid transparent', color: isHelpMode ? 'var(--color-accent)' : 'var(--color-text-muted)', transition: 'all var(--transition)' }}
        >
          <HelpCircle size={16} aria-hidden="true" />
          {isHelpMode && (
            <span className="font-mono text-3xs font-bold tracking-[1px]">
              HELP ON
            </span>
          )}
        </button>

        {/* Alert Bell */}
        <button
          onClick={() => setDrawerOpen((v) => !v)}
          aria-label={`Alerts${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          className="relative bg-transparent border-none cursor-pointer p-1"
          style={{
            color: unreadCount > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)',
          }}
        >
          <Bell size={18} aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              className="absolute top-0 right-0 w-4 h-4 rounded-full bg-danger font-mono text-3xs font-bold flex items-center justify-center text-[#fff]"

              aria-hidden="true"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Drawer */}
        <NotificationDrawer open={drawerOpen} onClose={handleDrawerClose} />

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
            aria-label="User menu"
            className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-text font-mono text-[11px]"
          >
            <User size={14} className="text-text-muted" aria-hidden="true" />
            <span className="hide-mobile">{user?.username || 'USER'}</span>
            <ChevronDown size={12} className="text-text-muted" aria-hidden="true" />
          </button>
          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-[1100]"
                onClick={() => setUserMenuOpen(false)}
                aria-hidden="true"
              />
              <div
                role="menu"
                className="absolute top-full right-0 mt-2 w-[180px] bg-bg-surface border border-border-strong rounded z-[1101] overflow-hidden"
                style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
              >
                <div className="px-3.5 py-2.5 border-b border-border">
                  <div className="font-mono text-[11px] text-text-bright font-semibold">
                    {user?.full_name}
                  </div>
                  <div className="font-mono text-3xs text-text-muted uppercase tracking-[1px] mt-0.5">
                    {user?.role}
                  </div>
                </div>
                <button
                  role="menuitem"
                  onClick={() => {
                    resetGuidedTour();
                    setUserMenuOpen(false);
                    window.location.reload();
                  }}
                  className="w-full px-3.5 py-2.5 flex items-center gap-2 bg-transparent border-none border-b border-border cursor-pointer text-text font-mono text-[11px] tracking-[1px] hover:bg-bg-hover border-b border-b-[var(--color-border)] transition-colors duration-[var(--transition)]"
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  RESTART TOUR
                </button>
                <button
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full px-3.5 py-2.5 flex items-center gap-2 bg-transparent border-none cursor-pointer text-danger font-mono text-[11px] tracking-[1px] hover:bg-bg-hover"
                  style={{
                    transition: 'background-color var(--transition)',
                  }}
                >
                  <LogOut size={14} aria-hidden="true" />
                  LOGOUT
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
