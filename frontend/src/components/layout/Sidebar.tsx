import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Wrench,
  Hammer,
  ClipboardList,
  Activity,
  Truck,
  Upload,
  Database,
  FileText,
  AlertTriangle,
  MapPin,
  Settings,
  Shield,
  BookOpen,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useDashboardStore } from '@/stores/dashboardStore';
import { isDemoMode } from '@/api/mockClient';
import UnitSelector from '@/components/common/UnitSelector';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'DASHBOARD' },
  { to: '/map', icon: MapPin, label: 'MAP' },
  { to: '/supply', icon: Package, label: 'SUPPLY' },
  { to: '/equipment', icon: Wrench, label: 'EQUIPMENT' },
  { to: '/maintenance', icon: Hammer, label: 'MAINTENANCE' },
  { to: '/requisitions', icon: ClipboardList, label: 'REQUISITIONS' },
  { to: '/readiness', icon: Activity, label: 'READINESS' },
  { to: '/transportation', icon: Truck, label: 'TRANSPORTATION' },
  { to: '/ingestion', icon: Upload, label: 'INGESTION' },
  { to: '/data-sources', icon: Database, label: 'DATA SOURCES' },
  { to: '/reports', icon: FileText, label: 'REPORTS' },
  { to: '/alerts', icon: AlertTriangle, label: 'ALERTS' },
  { to: '/admin', icon: Settings, label: 'ADMIN' },
  { to: '/docs', icon: BookOpen, label: 'DOCS' },
];

interface SidebarProps {
  isMobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isMobileOpen, onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const { selectedUnitId, setSelectedUnitId } = useDashboardStore();

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
        {navItems.map((item) => (
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
