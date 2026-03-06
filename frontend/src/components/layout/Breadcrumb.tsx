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
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 font-mono text-[11px] tracking-[1px] mb-3"
    >
      <ol className="flex items-center gap-1.5 list-none p-0 m-0">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li key={`${index}-${crumb.path}`} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight size={12} className="text-text-muted" aria-hidden="true" />
              )}
              {isLast ? (
                <span
                  className="text-text-bright font-semibold"
                  aria-current="page"
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-text-muted no-underline transition-colors duration-150 hover:text-accent"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
