import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Clock, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useAlertStore } from '@/stores/alertStore';
import { TIME_RANGES } from '@/lib/constants';

const pageTitles: Record<string, string> = {
  '/dashboard': 'DASHBOARD',
  '/supply': 'SUPPLY STATUS',
  '/equipment': 'EQUIPMENT READINESS',
  '/transportation': 'TRANSPORTATION',
  '/ingestion': 'DATA INGESTION',
  '/reports': 'REPORTS',
  '/alerts': 'ALERTS',
  '/admin': 'ADMINISTRATION',
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { timeRange, setTimeRange } = useDashboardStore();
  const unreadCount = useAlertStore((s) => s.unreadCount);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const pageTitle = pageTitles[location.pathname] || 'KEYSTONE';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      style={{
        height: 48,
        minHeight: 48,
        backgroundColor: 'var(--color-bg-elevated)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 15,
      }}
    >
      {/* Page Title */}
      <h1
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: 'var(--color-text-bright)',
          margin: 0,
        }}
      >
        {pageTitle}
      </h1>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Time Range Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Clock size={12} style={{ color: 'var(--color-text-muted)', marginRight: 6 }} />
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              style={{
                padding: '4px 8px',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '1px',
                border: '1px solid',
                borderColor:
                  timeRange === range.value
                    ? 'var(--color-accent)'
                    : 'var(--color-border)',
                borderRadius: 'var(--radius)',
                backgroundColor:
                  timeRange === range.value
                    ? 'rgba(77, 171, 247, 0.15)'
                    : 'transparent',
                color:
                  timeRange === range.value
                    ? 'var(--color-accent)'
                    : 'var(--color-text-muted)',
                cursor: 'pointer',
                transition: 'all var(--transition)',
              }}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Alert Bell */}
        <button
          onClick={() => navigate('/alerts')}
          style={{
            position: 'relative',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            color: unreadCount > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)',
          }}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: 'var(--color-danger)',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
            }}
          >
            <User size={14} style={{ color: 'var(--color-text-muted)' }} />
            <span>{user?.username || 'USER'}</span>
            <ChevronDown size={12} style={{ color: 'var(--color-text-muted)' }} />
          </button>
          {userMenuOpen && (
            <>
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 40,
                }}
                onClick={() => setUserMenuOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  width: 180,
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 'var(--radius)',
                  zIndex: 50,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--color-text-bright)',
                      fontWeight: 600,
                    }}
                  >
                    {user?.full_name}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginTop: 2,
                    }}
                  >
                    {user?.role}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-danger)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    letterSpacing: '1px',
                    transition: 'background-color var(--transition)',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'transparent')
                  }
                >
                  <LogOut size={14} />
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
