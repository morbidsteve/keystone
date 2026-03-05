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
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'DASHBOARD', permission: 'dashboard:view' },
  { to: '/map', icon: MapPin, label: 'MAP', permission: 'map:view' },
  { to: '/supply', icon: Package, label: 'SUPPLY', permission: 'supply:view' },
  { to: '/equipment', icon: Wrench, label: 'EQUIPMENT', permission: 'equipment:view' },
  { to: '/maintenance', icon: Hammer, label: 'MAINTENANCE', permission: 'maintenance:view' },
  { to: '/requisitions', icon: ClipboardList, label: 'REQUISITIONS', permission: 'requisitions:view' },
  { to: '/personnel', icon: Users, label: 'PERSONNEL', permission: 'personnel:view' },
  { to: '/readiness', icon: Activity, label: 'READINESS', permission: 'readiness:view' },
  { to: '/medical', icon: Heart, label: 'MEDICAL', permission: 'medical:view' },
  { to: '/transportation', icon: Truck, label: 'TRANSPORTATION', permission: 'transportation:view' },
  { to: '/fuel', icon: Fuel, label: 'FUEL', permission: 'fuel:view' },
  { to: '/custody', icon: ShieldCheck, label: 'CUSTODY', permission: 'custody:view' },
  { to: '/ingestion', icon: Upload, label: 'INGESTION', permission: 'ingestion:view' },
  { to: '/data-sources', icon: Database, label: 'DATA SOURCES', permission: 'data_sources:view' },
  { to: '/reports', icon: FileText, label: 'REPORTS', permission: 'reports:view' },
  { to: '/alerts', icon: AlertTriangle, label: 'ALERTS', permission: 'alerts:view' },
  { to: '/audit', icon: ClipboardList, label: 'AUDIT', permission: 'audit:view' },
  { to: '/admin', icon: Settings, label: 'ADMIN', permission: 'admin:users' },
  { to: '/docs', icon: BookOpen, label: 'DOCS', permission: 'docs:view' },
];

interface SidebarProps {
  isMobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isMobileOpen, onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const { selectedUnitId, setSelectedUnitId } = useDashboardStore();
  const { hasPermission } = usePermission();

  const filteredNavItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

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
        {filteredNavItems.map((item) => (
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
            <span>{item.label}</span>
          </NavLink>
        ))}
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
