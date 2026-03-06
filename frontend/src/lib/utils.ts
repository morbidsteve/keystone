import { clsx, type ClassValue } from 'clsx';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { SupplyStatus } from './types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(dateStr: string, fmt: string = 'dd MMM yyyy HH:mm'): string {
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM HH:mm');
  } catch {
    return dateStr;
  }
}

export function formatRelativeTime(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function getStatusColor(status: SupplyStatus | string): string {
  const s = (typeof status === 'string' ? status : '').toUpperCase();

  // Good status - green
  if (['GREEN', 'FMC', 'ACTIVE', 'APPROVED', 'RECEIVED', 'COMPLETED', 'COMPLETE', 'HEALTHY', 'GOOD', 'FULL', 'MC'].includes(s)) {
    return 'var(--color-success)';
  }

  // Warning status - yellow/amber
  if (['AMBER', 'DEGRADED', 'PENDING', 'PENDING_APPROVAL', 'IN_PROGRESS', 'IN-PROGRESS', 'PARTIAL', 'PMC', 'STOPPED', 'DELAYED', 'LOW', 'SUBMITTED', 'DRAFT'].includes(s)) {
    return 'var(--color-warning)';
  }

  // Critical/bad status - red
  if (['RED', 'BLACK', 'NMC', 'DENIED', 'FAILED', 'CRITICAL', 'OVERDUE', 'DEADLINED', 'CANCELLED', 'BROKEN_DOWN', 'EMERGENCY'].includes(s)) {
    return 'var(--color-danger)';
  }

  // Info status - blue
  if (['EN_ROUTE', 'EN-ROUTE', 'DISPATCHED', 'PROCESSING', 'PLANNED', 'MOVING', 'INFO', 'OPEN'].includes(s)) {
    return 'var(--color-info)';
  }

  // Inactive - gray
  if (['INACTIVE', 'ARCHIVED', 'RETIRED', 'STORED', 'N/A'].includes(s)) {
    return 'var(--color-text-muted)';
  }

  return 'var(--color-text-muted)';
}

export function getStatusBadgeClass(status: SupplyStatus | string): string {
  switch (status) {
    case SupplyStatus.GREEN:
    case 'GREEN':
      return 'status-badge status-badge-green';
    case SupplyStatus.AMBER:
    case 'AMBER':
      return 'status-badge status-badge-amber';
    case SupplyStatus.RED:
    case 'RED':
      return 'status-badge status-badge-red';
    default:
      return 'status-badge';
  }
}

export function getStatusDotClass(status: SupplyStatus | string): string {
  switch (status) {
    case SupplyStatus.GREEN:
    case 'GREEN':
      return 'status-dot status-dot-green';
    case SupplyStatus.AMBER:
    case 'AMBER':
      return 'status-dot status-dot-amber';
    case SupplyStatus.RED:
    case 'RED':
      return 'status-dot status-dot-red';
    default:
      return 'status-dot';
  }
}

export function getReadinessStatus(percent: number): SupplyStatus {
  if (percent >= 90) return SupplyStatus.GREEN;
  if (percent >= 75) return SupplyStatus.AMBER;
  return SupplyStatus.RED;
}

export function getDOSStatus(dos: number): SupplyStatus {
  if (dos >= 7) return SupplyStatus.GREEN;
  if (dos >= 3) return SupplyStatus.AMBER;
  return SupplyStatus.RED;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}
