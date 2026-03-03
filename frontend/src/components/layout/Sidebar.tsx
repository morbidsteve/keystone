import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Wrench,
  Truck,
  Upload,
  Database,
  FileText,
  AlertTriangle,
  MapPin,
  Settings,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useDashboardStore } from '@/stores/dashboardStore';
import { isDemoMode } from '@/api/mockClient';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'DASHBOARD' },
  { to: '/map', icon: MapPin, label: 'MAP' },
  { to: '/supply', icon: Package, label: 'SUPPLY' },
  { to: '/equipment', icon: Wrench, label: 'EQUIPMENT' },
  { to: '/transportation', icon: Truck, label: 'TRANSPORTATION' },
  { to: '/ingestion', icon: Upload, label: 'INGESTION' },
  { to: '/data-sources', icon: Database, label: 'DATA SOURCES' },
  { to: '/reports', icon: FileText, label: 'REPORTS' },
  { to: '/alerts', icon: AlertTriangle, label: 'ALERTS' },
  { to: '/admin', icon: Settings, label: 'ADMIN' },
];

const mockUnits = [
  { id: 'all', name: 'ALL UNITS' },
  { id: '1mef', name: 'I MEF' },
  { id: '1mardiv', name: '1ST MARDIV' },
  { id: '1mar', name: '1ST MAR' },
  { id: '1-1', name: '1/1 BN' },
  { id: '2-1', name: '2/1 BN' },
];

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const { selectedUnitId, setSelectedUnitId } = useDashboardStore();
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);

  const selectedUnit = mockUnits.find((u) => u.id === selectedUnitId) || mockUnits[0];

  return (
    <aside
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
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
            style={{
              width: '100%',
              padding: '8px 10px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'border-color var(--transition)',
            }}
          >
            <span>{selectedUnit.name}</span>
            <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} />
          </button>
          {unitDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 4,
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-strong)',
                borderRadius: 'var(--radius)',
                zIndex: 50,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              {mockUnits.map((unit) => (
                <button
                  key={unit.id}
                  onClick={() => {
                    setSelectedUnitId(unit.id === 'all' ? null : unit.id);
                    setUnitDropdownOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor:
                      (selectedUnitId === null && unit.id === 'all') ||
                      selectedUnitId === unit.id
                        ? 'var(--color-bg-hover)'
                        : 'transparent',
                    border: 'none',
                    color: 'var(--color-text)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background-color var(--transition)',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      (selectedUnitId === null && unit.id === 'all') ||
                      selectedUnitId === unit.id
                        ? 'var(--color-bg-hover)'
                        : 'transparent')
                  }
                >
                  {unit.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
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
