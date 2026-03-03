import { Polyline, Tooltip } from 'react-leaflet';
import type { MapRoute } from '@/api/map';

interface RouteLayerProps {
  routes: MapRoute[];
}

function getRouteStyle(routeType: string, status: string): {
  color: string;
  weight: number;
  dashArray?: string;
  opacity: number;
} {
  const weight =
    routeType === 'MSR' ? 4 : routeType === 'ASR' ? 3 : 2;

  let color: string;
  let dashArray: string | undefined;
  const opacity = 0.7;

  switch (status) {
    case 'OPEN':
      color = '#40c057';
      break;
    case 'RESTRICTED':
      color = '#fab005';
      dashArray = '10 6';
      break;
    case 'CLOSED':
      color = '#ff6b6b';
      dashArray = '6 6';
      break;
    default:
      color = '#868e96';
      break;
  }

  return { color, weight, dashArray, opacity };
}

export default function RouteLayer({ routes }: RouteLayerProps) {
  return (
    <>
      {routes.map((route) => {
        const style = getRouteStyle(route.route_type, route.status);
        const positions = route.waypoints.map(
          (wp) => [wp[0], wp[1]] as [number, number],
        );

        if (positions.length < 2) return null;

        return (
          <Polyline
            key={route.id}
            positions={positions}
            pathOptions={{
              color: style.color,
              weight: style.weight,
              dashArray: style.dashArray,
              opacity: style.opacity,
            }}
          >
            <Tooltip sticky opacity={0.9}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: '#111',
                  padding: '2px 4px',
                }}
              >
                <div style={{ fontWeight: 700 }}>{route.name}</div>
                <div>
                  {route.route_type} | {route.status}
                </div>
                {route.description && (
                  <div style={{ marginTop: 2, fontWeight: 400 }}>
                    {route.description}
                  </div>
                )}
              </div>
            </Tooltip>
          </Polyline>
        );
      })}
    </>
  );
}
