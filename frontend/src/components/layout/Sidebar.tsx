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
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useAlertStore } from '@/stores/alertStore';
import { isDemoMode } from '@/api/mockClient';
import { usePermission } from '@/hooks/usePermission';
import { useQuery } from '@tanstack/react-query';
import { getRequisitions } from '@/api/requisitions';
import { getWorkOrders } from '@/api/maintenance';
import { WorkOrderStatus } from '@/lib/types';
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
const COLLAPSED_MODE_KEY = 'keystone_sidebar_collapsed_mode';

const SIDEBAR_WIDTH_EXPANDED = 240;
const SIDEBAR_WIDTH_COLLAPSED = 56;

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
      { to: '/requisitions', icon: ClipboardList, label: 'REQUISITIONS', permission: 'requisitions:view' },
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
      { to: '/alerts', icon: AlertTriangle, label: 'ALERTS', permission: 'alerts:view' },
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

  // Dynamic badge counts
  const alertUnreadCount = useAlertStore((s) => s.unreadCount);
  const { data: requisitionsData } = useQuery({
    queryKey: ['requisitions-sidebar-count'],
    queryFn: () => getRequisitions(),
    staleTime: 30_000,
  });
  const pendingRequisitions = requisitionsData
    ? requisitionsData.filter((r) => r.status === 'SUBMITTED').length
    : 0;

  // Maintenance work order badge
  const { data: workOrdersData } = useQuery({
    queryKey: ['maintenance-sidebar-count'],
    queryFn: () => getWorkOrders(),
    staleTime: 30_000,
  });
  const maintenanceCount = workOrdersData
    ? workOrdersData.data.filter(
        (wo) => wo.status === WorkOrderStatus.OPEN || wo.status === WorkOrderStatus.IN_PROGRESS,
      ).length
    : 0;

  // Build dynamic badge map keyed by route path
  const badgeMap: Record<string, { count: number; color: string; textColor: string }> = {};
  if (alertUnreadCount > 0) {
    badgeMap['/alerts'] = { count: alertUnreadCount, color: 'var(--color-danger)', textColor: '#fff' };
  }
  if (pendingRequisitions > 0) {
    badgeMap['/requisitions'] = { count: pendingRequisitions, color: 'var(--color-warning)', textColor: '#000' };
  }
  if (maintenanceCount > 0) {
    badgeMap['/maintenance'] = { count: maintenanceCount, color: 'var(--color-warning)', textColor: '#000' };
  }

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(loadCollapsedState);

  // Icon-only collapse mode (desktop only)
  const [isCollapsedMode, setIsCollapsedMode] = useState(() =>
    localStorage.getItem(COLLAPSED_MODE_KEY) === 'true',
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_MODE_KEY, String(isCollapsedMode));
  }, [isCollapsedMode]);

  const toggleGroup = useCallback((key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleCollapsedMode = useCallback(() => {
    setIsCollapsedMode((prev) => !prev);
  }, []);

  // On mobile, never use collapsed mode
  const isMobile = isMobileOpen !== undefined && typeof window !== 'undefined' && window.innerWidth < 768;
  const effectiveCollapsed = !isMobile && isCollapsedMode;
  const sidebarWidth = effectiveCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <aside
      className={`sidebar${isMobileOpen ? ' sidebar-open' : ''} bg-bg-elevated border-r border-border flex flex-col relative z-20 overflow-hidden h-[100vh]`}
      role="complementary"
      aria-label="Sidebar"
      style={{ width: sidebarWidth, minWidth: sidebarWidth, transition: 'width 0.2s ease, min-width 0.2s ease' }}
    >
      {/* Brand */}
      <div
        className="border-b border-border flex items-center gap-2.5"
        style={{
          padding: effectiveCollapsed ? '16px 0' : '16px 16px',
          justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
        }}
      >
        <Shield size={20} className="text-accent shrink-0" aria-hidden="true" />
        {!effectiveCollapsed && (
          <>
            <span className="font-mono text-[16px] font-bold tracking-[3px] text-text-bright">
              KEYSTONE
            </span>
            {isDemoMode && (
              <span
                className="font-mono text-[8px] font-bold tracking-[1.5px] text-accent rounded ml-auto bg-[rgba(77,171,247,0.12)] py-0.5 px-1.5 border border-[rgba(77,171,247,0.3)]"
              >
                DEMO
              </span>
            )}
          </>
        )}

        {/* Close button (mobile only) */}
        <button
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close sidebar"
          style={{ marginLeft: isDemoMode && !effectiveCollapsed ? 4 : 'auto' }}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Unit Selector -- hidden when collapsed */}
      {!effectiveCollapsed && (
        <div className="px-3 pt-3 pb-2">
          <div className="font-mono text-3xs font-semibold uppercase tracking-[1.5px] text-text-muted mb-1.5 pl-1">
            ECHELON / UNIT
          </div>
          <UnitSelector
            selectedUnitId={selectedUnitId}
            onSelectUnit={setSelectedUnitId}
          />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto" aria-label="Main navigation">
        {navGroups.map((group) => {
          const filteredItems = group.items.filter(
            (item) => !item.permission || hasPermission(item.permission),
          );
          if (filteredItems.length === 0) return null;

          const isGroupCollapsed = !!collapsed[group.key];

          return (
            <div key={group.key} className="mb-1">
              {/* Group header -- hidden when in icon-only mode */}
              {!effectiveCollapsed && (
                <button
                  onClick={() => toggleGroup(group.key)}
                  aria-expanded={!isGroupCollapsed}
                  className="flex items-center gap-1.5 w-full px-4 py-1.5 border-none bg-transparent cursor-pointer font-mono text-3xs font-semibold tracking-[1.5px] text-text-muted uppercase"
                >
                  <ChevronDown
                    size={12}
                    aria-hidden="true"
                    style={{
                      transition: 'transform 0.2s ease',
                      transform: isGroupCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    }}
                  />
                  {group.label}
                </button>
              )}

              {/* Group items -- always visible in collapsed mode, respect group collapse in expanded */}
              {(effectiveCollapsed || !isGroupCollapsed) && (
                <ul className="list-none p-0 m-0">
                  {filteredItems.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        onClick={onClose}
                        title={effectiveCollapsed ? item.label : undefined}
                        aria-label={effectiveCollapsed ? item.label : undefined}
                        className="no-underline"
                        style={({ isActive }) => ({
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
                          gap: effectiveCollapsed ? 0 : 10,
                          padding: effectiveCollapsed ? '10px 0' : '10px 16px',
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
                          position: 'relative',
                        })}
                      >
                        <item.icon size={16} className="shrink-0" aria-hidden="true" />
                        {!effectiveCollapsed && (
                          <span className="flex-1">{item.label}</span>
                        )}
                        {(() => {
                          const dynamicBadge = badgeMap[item.to];
                          const badge = item.badge ?? dynamicBadge;
                          if (!badge || badge.count <= 0) return null;
                          return effectiveCollapsed ? (
                            <span
                              className="absolute top-1.5 right-3 w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: badge.color }}
                              aria-label={`${badge.count} notifications`}
                            />
                          ) : (
                            <span
                              className="text-3xs font-bold rounded-full leading-[14px] py-px px-1.5"
                              style={{ backgroundColor: badge.color, color: badge.textColor }}
                              aria-label={`${badge.count} notifications`}
                            >
                              {badge.count}
                            </span>
                          );
                        })()}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div
        className="sidebar-collapse-toggle flex justify-center"
        style={{ padding: effectiveCollapsed ? '8px 8px' : '8px 12px' }}
      >
        <button
          onClick={toggleCollapsedMode}
          title={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="bg-transparent border border-border rounded text-text-muted cursor-pointer w-full flex items-center justify-center gap-1.5 font-mono text-3xs tracking-[1px] py-1 px-2 transition-all duration-[var(--transition)]"
        >
          {effectiveCollapsed ? <ChevronsRight size={14} aria-hidden="true" /> : <ChevronsLeft size={14} aria-hidden="true" />}
          {!effectiveCollapsed && <span>COLLAPSE</span>}
        </button>
      </div>

      {/* User Info */}
      {user && (
        <div
          className="border-t border-border flex flex-col"
          style={{
            padding: effectiveCollapsed ? '12px 0' : '12px 16px',
            alignItems: effectiveCollapsed ? 'center' : 'flex-start',
          }}
          title={effectiveCollapsed ? `${user.full_name} — ${user.role}` : undefined}
        >
          {effectiveCollapsed ? (
            <Users size={16} className="text-text-muted" aria-label={`${user.full_name} - ${user.role}`} />
          ) : (
            <>
              <div className="font-mono text-[11px] text-text font-semibold">
                {user.full_name}
              </div>
              <div className="font-mono text-3xs text-text-muted uppercase tracking-[1px] mt-0.5">
                {user.role}
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
