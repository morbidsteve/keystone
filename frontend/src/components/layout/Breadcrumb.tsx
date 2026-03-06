import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const segmentLabels: Record<string, string> = {
  dashboard: 'DASHBOARD',
  map: 'MAP',
  supply: 'SUPPLY',
  equipment: 'EQUIPMENT',
  maintenance: 'MAINTENANCE',
  requisitions: 'REQUISITIONS',
  personnel: 'PERSONNEL',
  readiness: 'READINESS',
  medical: 'MEDICAL',
  transportation: 'TRANSPORTATION',
  fuel: 'FUEL',
  custody: 'CUSTODY',
  ingestion: 'INGESTION',
  'data-sources': 'DATA SOURCES',
  reports: 'REPORTS',
  alerts: 'ALERTS',
  audit: 'AUDIT',
  admin: 'ADMIN',
  docs: 'DOCS',
};

interface Crumb {
  label: string;
  path: string;
}

export default function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  const crumbs: Crumb[] = [{ label: 'KEYSTONE', path: '/dashboard' }];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = segmentLabels[segment] || segment.toUpperCase();
    crumbs.push({ label, path: currentPath });
  }

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '1px',
        marginBottom: 12,
      }}
    >
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <span key={crumb.path} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {index > 0 && (
              <ChevronRight size={12} style={{ color: 'var(--color-text-muted)' }} />
            )}
            {isLast ? (
              <span
                style={{
                  color: 'var(--color-text-bright)',
                  fontWeight: 600,
                }}
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                style={{
                  color: 'var(--color-text-muted)',
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }}
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
