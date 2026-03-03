import { useEffect, useCallback } from 'react';
import { useMapEvents } from 'react-leaflet';
import { MapPin, Copy, Ruler, Search, Plus, Plane } from 'lucide-react';
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

function MapContextMenuEvents() {
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

export default function MapContextMenu() {
  const contextMenu = useMapStore((s) => s.contextMenu);
  const hideContextMenu = useMapStore((s) => s.hideContextMenu);
  const startMeasure = useMapStore((s) => s.startMeasure);
  const startPlacement = useMapStore((s) => s.startPlacement);
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
    hideContextMenu();
    try {
      const result = await mapApi.getNearby({
        lat: contextMenu.lat,
        lon: contextMenu.lon,
        radius_km: 5,
      });
      const parts: string[] = [];
      if (result.units.length > 0) {
        parts.push(`Units (${result.units.length}): ${result.units.map((u) => u.abbreviation).join(', ')}`);
      }
      if (result.supplyPoints.length > 0) {
        parts.push(`Supply Points (${result.supplyPoints.length}): ${result.supplyPoints.map((sp) => sp.name).join(', ')}`);
      }
      if (result.alerts.length > 0) {
        parts.push(`Alerts (${result.alerts.length}): ${result.alerts.map((a) => a.message).join('; ')}`);
      }
      if (parts.length === 0) {
        parts.push('No entities found within 5km.');
      }
      alert(`Nearby (5km):\n\n${parts.join('\n\n')}`);
    } catch {
      alert('Failed to query nearby entities.');
    }
  }, [contextMenu.lat, contextMenu.lon, hideContextMenu]);

  const handlePlacement = useCallback(
    (type: PlacementType) => {
      startPlacement(type, contextMenu.lat, contextMenu.lon);
    },
    [contextMenu.lat, contextMenu.lon, startPlacement],
  );

  if (!contextMenu.visible) {
    return <MapContextMenuEvents />;
  }

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
    <>
      <MapContextMenuEvents />
      <div
        style={{
          position: 'absolute',
          left: contextMenu.x,
          top: contextMenu.y,
          zIndex: 2000,
          backgroundColor: 'rgba(17, 17, 17, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 6,
          fontFamily: "'JetBrains Mono', monospace",
          minWidth: 220,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Coordinate header */}
        <div
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: 10,
            color: '#94a3b8',
            lineHeight: 1.6,
          }}
        >
          <div style={{ color: '#e2e8f0', fontWeight: 600 }}>
            {formatCoords(contextMenu.lat, contextMenu.lon)}
          </div>
          {mgrsStr && (
            <div style={{ color: '#60a5fa', fontSize: 9, letterSpacing: '0.5px' }}>
              {mgrsStr}
            </div>
          )}
        </div>

        {/* Menu items */}
        <div style={{ padding: '4px 0' }}>
          {cleanEntries.map((entry, idx) => {
            if (isSeparator(entry)) {
              return (
                <div
                  key={`sep-${idx}`}
                  style={{
                    height: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    margin: '4px 8px',
                  }}
                />
              );
            }
            return (
              <button
                key={entry.label}
                onClick={() => {
                  entry.onClick();
                  if (entry.label !== 'Measure Distance') {
                    // Measure distance hides via startMeasure already
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '7px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: '#e2e8f0',
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ color: '#60a5fa', display: 'flex', alignItems: 'center' }}>
                  {entry.icon}
                </span>
                <span>{entry.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
