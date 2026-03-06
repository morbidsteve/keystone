import { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Package,
  Wrench,
  Hammer,
  ClipboardList,
  Users,
  Activity,
  Heart,
  Truck,
  Upload,
  Database,
  FileText,
  AlertTriangle,
  MapPin,
  Settings,
  Shield,
  BookOpen,
  Fuel,
  ShieldCheck,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useDashboardStore } from '@/stores/dashboardStore';
import { isDemoMode } from '@/api/mockClient';
import { usePermission } from '@/hooks/usePermission';
import UnitSelector from '@/components/common/UnitSelector';

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  permission?: string;
  badge?: { count: number; color: string; textColor: string };
}

interface NavGroup {
  key: string;
  label: string;
  items: NavItem[];
}

const STORAGE_KEY = 'keystone_sidebar_collapsed';

const navGroups: NavGroup[] = [
  {
    key: 'operations',
    label: 'OPERATIONS',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'DASHBOARD', permission: 'dashboard:view' },
      { to: '/map', icon: MapPin, label: 'MAP', permission: 'map:view' },
      { to: '/readiness', icon: Activity, label: 'READINESS', permission: 'readiness:view' },
    ],
  },
  {
    key: 'logistics',
    label: 'LOGISTICS',
    items: [
      { to: '/supply', icon: Package, label: 'SUPPLY', permission: 'supply:view' },
      { to: '/equipment', icon: Wrench, label: 'EQUIPMENT', permission: 'equipment:view' },
      { to: '/maintenance', icon: Hammer, label: 'MAINTENANCE', permission: 'maintenance:view' },
      {
        to: '/requisitions',
        icon: ClipboardList,
        label: 'REQUISITIONS',
        permission: 'requisitions:view',
        badge: { count: 5, color: 'var(--color-warning)', textColor: '#000' },
      },
      { to: '/fuel', icon: Fuel, label: 'FUEL', permission: 'fuel:view' },
      { to: '/transportation', icon: Truck, label: 'TRANSPORTATION', permission: 'transportation:view' },
      { to: '/custody', icon: ShieldCheck, label: 'CUSTODY', permission: 'custody:view' },
    ],
  },
  {
    key: 'personnel',
    label: 'PERSONNEL',
    items: [
      { to: '/personnel', icon: Users, label: 'PERSONNEL', permission: 'personnel:view' },
      { to: '/medical', icon: Heart, label: 'MEDICAL', permission: 'medical:view' },
    ],
  },
  {
    key: 'data',
    label: 'DATA',
    items: [
      { to: '/ingestion', icon: Upload, label: 'INGESTION', permission: 'ingestion:view' },
      { to: '/data-sources', icon: Database, label: 'DATA SOURCES', permission: 'data_sources:view' },
      { to: '/reports', icon: FileText, label: 'REPORTS', permission: 'reports:view' },
    ],
  },
  {
    key: 'security',
    label: 'SECURITY',
    items: [
      {
        to: '/alerts',
        icon: AlertTriangle,
        label: 'ALERTS',
        permission: 'alerts:view',
        badge: { count: 3, color: 'var(--color-danger)', textColor: '#fff' },
      },
      { to: '/audit', icon: ClipboardList, label: 'AUDIT', permission: 'audit:view' },
    ],
  },
  {
    key: 'system',
    label: 'SYSTEM',
    items: [
      { to: '/admin', icon: Settings, label: 'ADMIN', permission: 'admin:users' },
      { to: '/docs', icon: BookOpen, label: 'DOCS', permission: 'docs:view' },
    ],
  },
];

function loadCollapsedState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

interface SidebarProps {
  isMobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isMobileOpen, onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const { selectedUnitId, setSelectedUnitId } = useDashboardStore();
  const { hasPermission } = usePermission();

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(loadCollapsedState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
  }, [collapsed]);

  const toggleGroup = useCallback((key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <aside
      className={`sidebar${isMobileOpen ? ' sidebar-open' : ''}`}
      style={{
        width: 240,
        minWidth: 240,
        height: '100vh',
        backgroundColor: 'var(--color-bg-elevated)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 20,
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: '16px 16px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Shield size={20} style={{ color: 'var(--color-accent)' }} />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '3px',
            color: 'var(--color-text-bright)',
          }}
        >
          KEYSTONE
        </span>
        {isDemoMode && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '1.5px',
              color: 'var(--color-accent)',
              backgroundColor: 'rgba(77, 171, 247, 0.12)',
              border: '1px solid rgba(77, 171, 247, 0.3)',
              borderRadius: 'var(--radius)',
              padding: '2px 6px',
              marginLeft: 'auto',
            }}
          >
            DEMO
          </span>
        )}

        {/* Close button (mobile only) */}
        <button
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close sidebar"
          style={{ marginLeft: isDemoMode ? 4 : 'auto' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Unit Selector */}
      <div style={{ padding: '12px 12px 8px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: 'var(--color-text-muted)',
            marginBottom: 6,
            paddingLeft: 4,
          }}
        >
          ECHELON / UNIT
        </div>
        <UnitSelector
          selectedUnitId={selectedUnitId}
          onSelectUnit={setSelectedUnitId}
        />
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {navGroups.map((group) => {
          const filteredItems = group.items.filter(
            (item) => !item.permission || hasPermission(item.permission),
          );
          if (filteredItems.length === 0) return null;

          const isCollapsed = !!collapsed[group.key];

          return (
            <div key={group.key} style={{ marginBottom: 4 }}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  width: '100%',
                  padding: '6px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  letterSpacing: '1.5px',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                <ChevronDown
                  size={12}
                  style={{
                    transition: 'transform 0.2s ease',
                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  }}
                />
                {group.label}
              </button>

              {/* Group items */}
              {!isCollapsed &&
                filteredItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 16px',
                      margin: '1px 0',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 500,
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      color: isActive ? 'var(--color-text-bright)' : 'var(--color-text-muted)',
                      backgroundColor: isActive ? 'var(--color-bg-hover)' : 'transparent',
                      borderLeft: isActive
                        ? '3px solid var(--color-accent)'
                        : '3px solid transparent',
                      transition: 'all var(--transition)',
                    })}
                  >
                    <item.icon size={16} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && item.badge.count > 0 && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: 10,
                          backgroundColor: item.badge.color,
                          color: item.badge.textColor,
                          lineHeight: '14px',
                        }}
                      >
                        {item.badge.count}
                      </span>
                    )}
                  </NavLink>
                ))}
            </div>
          );
        })}
      </nav>

      {/* User Info */}
      {user && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text)',
              fontWeight: 600,
            }}
          >
            {user.full_name}
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
            {user.role}
          </div>
        </div>
      )}
    </aside>
  );
}
