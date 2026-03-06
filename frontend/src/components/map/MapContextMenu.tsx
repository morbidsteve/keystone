import { useEffect, useCallback } from 'react';
import { useMapEvents } from 'react-leaflet';
import { MapPin, Copy, Ruler, Search, Plus, Plane, Route as RouteIcon, Upload } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';
import type { PlacementType } from '@/stores/mapStore';
import { useAuthStore } from '@/stores/authStore';
import { Role } from '@/lib/types';
import { latLonToMGRS, formatCoords } from '@/utils/coordinates';
import * as mapApi from '@/api/map';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  roles?: Role[];
  separator?: false;
}

interface SeparatorItem {
  separator: true;
}

type MenuEntry = MenuItem | SeparatorItem;

function isSeparator(entry: MenuEntry): entry is SeparatorItem {
  return 'separator' in entry && entry.separator === true;
}

/**
 * Leaflet map event listener for right-click context menu.
 * Must be rendered INSIDE MapContainer (needs useMapEvents).
 */
export function MapContextMenuEvents() {
  const showContextMenu = useMapStore((s) => s.showContextMenu);
  const hideContextMenu = useMapStore((s) => s.hideContextMenu);
  const measure = useMapStore((s) => s.measure);

  useMapEvents({
    contextmenu(e) {
      e.originalEvent.preventDefault();
      if (measure.active) return;
      const { lat, lng } = e.latlng;
      const { x, y } = e.containerPoint;
      showContextMenu(lat, lng, x, y);
    },
    click() {
      hideContextMenu();
    },
  });

  return null;
}

/**
 * Context menu UI overlay.
 * Rendered OUTSIDE MapContainer so clicks are never intercepted by Leaflet.
 */
export default function MapContextMenu() {
  const contextMenu = useMapStore((s) => s.contextMenu);
  const hideContextMenu = useMapStore((s) => s.hideContextMenu);
  const startMeasure = useMapStore((s) => s.startMeasure);
  const startPlacement = useMapStore((s) => s.startPlacement);
  const startRouteDrawing = useMapStore((s) => s.startRouteDrawing);
  const openRouteImport = useMapStore((s) => s.openRouteImport);
  const showNearby = useMapStore((s) => s.showNearby);
  const user = useAuthStore((s) => s.user);

  const userRole = (user?.role as Role) ?? Role.VIEWER;

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hideContextMenu();
      }
    },
    [hideContextMenu],
  );

  useEffect(() => {
    if (contextMenu.visible) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [contextMenu.visible, handleEscape]);

  const handleCopyCoordinates = useCallback(() => {
    const gps = formatCoords(contextMenu.lat, contextMenu.lon);
    let mgrsStr = '';
    try {
      mgrsStr = latLonToMGRS(contextMenu.lat, contextMenu.lon);
    } catch {
      // MGRS conversion may fail for extreme coordinates
    }
    const text = mgrsStr ? `${gps}\n${mgrsStr}` : gps;
    navigator.clipboard.writeText(text).catch(() => {
      // clipboard may not be available
    });
    hideContextMenu();
  }, [contextMenu.lat, contextMenu.lon, hideContextMenu]);

  const handleMeasureDistance = useCallback(() => {
    startMeasure(contextMenu.lat, contextMenu.lon);
  }, [contextMenu.lat, contextMenu.lon, startMeasure]);

  const handleWhatsNearby = useCallback(async () => {
    const queryLat = contextMenu.lat;
    const queryLon = contextMenu.lon;
    hideContextMenu();
    try {
      const result = await mapApi.getNearby({
        lat: queryLat,
        lon: queryLon,
        radius_km: 5,
      });
      showNearby(queryLat, queryLon, result);
    } catch {
      // Silently fail — user can retry
    }
  }, [contextMenu.lat, contextMenu.lon, hideContextMenu, showNearby]);

  const handlePlacement = useCallback(
    (type: PlacementType) => {
      startPlacement(type, contextMenu.lat, contextMenu.lon);
    },
    [contextMenu.lat, contextMenu.lon, startPlacement],
  );

  if (!contextMenu.visible) return null;

  let mgrsStr = '';
  try {
    mgrsStr = latLonToMGRS(contextMenu.lat, contextMenu.lon);
  } catch {
    // MGRS conversion may fail
  }

  const placementRoles: Role[] = [Role.S3, Role.COMMANDER, Role.ADMIN];
  const supplyPlacementRoles: Role[] = [Role.S4, Role.S3, Role.COMMANDER, Role.ADMIN];

  const menuEntries: MenuEntry[] = [
    {
      label: 'Place Unit Here',
      icon: <MapPin size={14} />,
      onClick: () => handlePlacement('unit'),
      roles: placementRoles,
    },
    {
      label: 'Add Supply Point Here',
      icon: <Plus size={14} />,
      onClick: () => handlePlacement('supply_point'),
      roles: supplyPlacementRoles,
    },
    {
      label: 'Add Maintenance Site Here',
      icon: <Plus size={14} />,
      onClick: () => handlePlacement('maintenance_site'),
      roles: supplyPlacementRoles,
    },
    {
      label: 'Add LZ / FARP Here',
      icon: <Plane size={14} />,
      onClick: () => handlePlacement('lz_farp'),
      roles: placementRoles,
    },
    {
      label: 'Draw Route Starting Here',
      icon: <RouteIcon size={14} />,
      onClick: () => startRouteDrawing(contextMenu.lat, contextMenu.lon),
      roles: placementRoles,
    },
    {
      label: 'Import Routes',
      icon: <Upload size={14} />,
      onClick: () => openRouteImport(),
      roles: placementRoles,
    },
    { separator: true },
    {
      label: 'Copy Coordinates',
      icon: <Copy size={14} />,
      onClick: handleCopyCoordinates,
    },
    {
      label: 'Measure Distance',
      icon: <Ruler size={14} />,
      onClick: handleMeasureDistance,
    },
    {
      label: "What's Nearby (5km)",
      icon: <Search size={14} />,
      onClick: handleWhatsNearby,
    },
  ];

  const filteredEntries = menuEntries.filter((entry) => {
    if (isSeparator(entry)) return true;
    if (!entry.roles) return true;
    return entry.roles.includes(userRole);
  });

  // Remove leading/trailing separators and consecutive separators
  const cleanEntries: MenuEntry[] = [];
  for (let i = 0; i < filteredEntries.length; i++) {
    const entry = filteredEntries[i];
    if (isSeparator(entry)) {
      if (cleanEntries.length === 0) continue;
      if (i === filteredEntries.length - 1) continue;
      const prev = cleanEntries[cleanEntries.length - 1];
      if (prev && isSeparator(prev)) continue;
    }
    cleanEntries.push(entry);
  }

  return (
    <div
      className="absolute z-[2000] bg-[rgba(17,17,17,0.95)] rounded-[6px] min-w-[220px] overflow-hidden" style={{ left: contextMenu.x, top: contextMenu.y, border: '1px solid rgba(255, 255, 255, 0.1)', fontFamily: "'JetBrains Mono', monospace", backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Coordinate header */}
      <div
        className="py-2 px-3 text-[10px] text-[#94a3b8] leading-relaxed border-b border-b-[rgba(255,255,255,0.1)]"
      >
        <div className="text-[#e2e8f0] font-semibold">
          {formatCoords(contextMenu.lat, contextMenu.lon)}
        </div>
        {mgrsStr && (
          <div className="text-[#60a5fa] text-[9px] tracking-[0.5px]">
            {mgrsStr}
          </div>
        )}
      </div>

      {/* Menu items */}
      <div className="py-1 px-0">
        {cleanEntries.map((entry, idx) => {
          if (isSeparator(entry)) {
            return (
              <div
                key={`sep-${idx}`}
                className="h-[1px] bg-[rgba(255,255,255,0.08)]" style={{ margin: '4px 8px' }}
              />
            );
          }
          return (
            <button
              key={entry.label}
              onClick={() => {
                entry.onClick();
                hideContextMenu();
              }}
              className="flex items-center gap-2.5 w-full py-[7px] px-3 border-0 bg-transparent text-[#e2e8f0] text-[11px] cursor-pointer text-left" style={{ fontFamily: "'JetBrains Mono', monospace", transition: 'background-color 0.1s ease' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span className="text-[#60a5fa] flex items-center">
                {entry.icon}
              </span>
              <span>{entry.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
