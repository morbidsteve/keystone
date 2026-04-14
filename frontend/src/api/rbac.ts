import apiClient from './client';
import { isDemoMode } from './mockClient';
import type { Permission, CustomRole, ApiResponse } from '@/lib/types';

// ---------------------------------------------------------------------------
// Mock data for demo mode
// ---------------------------------------------------------------------------

const MOCK_PERMISSIONS: Permission[] = [
  // Dashboard
  { id: 1, code: 'dashboard:view', displayName: 'View Dashboard', category: 'Dashboard' },

  // Map
  { id: 2, code: 'map:view', displayName: 'View Map', category: 'Map' },

  // Supply
  { id: 3, code: 'supply:view', displayName: 'View Supply', category: 'Supply' },
  { id: 4, code: 'supply:edit', displayName: 'Edit Supply', category: 'Supply' },

  // Equipment
  { id: 5, code: 'equipment:view', displayName: 'View Equipment', category: 'Equipment' },
  { id: 6, code: 'equipment:edit', displayName: 'Edit Equipment', category: 'Equipment' },

  // Maintenance
  { id: 7, code: 'maintenance:view', displayName: 'View Maintenance', category: 'Maintenance' },
  { id: 8, code: 'maintenance:create', displayName: 'Create Work Orders', category: 'Maintenance' },
  { id: 9, code: 'maintenance:edit', displayName: 'Edit Work Orders', category: 'Maintenance' },

  // Requisitions
  { id: 10, code: 'requisitions:view', displayName: 'View Requisitions', category: 'Requisitions' },
  { id: 11, code: 'requisitions:create', displayName: 'Create Requisitions', category: 'Requisitions' },
  { id: 12, code: 'requisitions:edit', displayName: 'Edit Requisitions', category: 'Requisitions' },
  { id: 13, code: 'requisitions:approve', displayName: 'Approve Requisitions', category: 'Requisitions' },

  // Personnel
  { id: 14, code: 'personnel:view', displayName: 'View Personnel', category: 'Personnel' },
  { id: 15, code: 'personnel:edit', displayName: 'Edit Personnel', category: 'Personnel' },

  // Readiness
  { id: 16, code: 'readiness:view', displayName: 'View Readiness', category: 'Readiness' },
  { id: 17, code: 'readiness:edit', displayName: 'Edit Readiness', category: 'Readiness' },

  // Medical
  { id: 18, code: 'medical:view', displayName: 'View Medical', category: 'Medical' },
  { id: 19, code: 'medical:edit', displayName: 'Edit Medical', category: 'Medical' },

  // Fuel
  { id: 20, code: 'fuel:view', displayName: 'View Fuel', category: 'Fuel' },
  { id: 21, code: 'fuel:edit', displayName: 'Edit Fuel', category: 'Fuel' },

  // Custody
  { id: 22, code: 'custody:view', displayName: 'View Chain of Custody', category: 'Custody' },
  { id: 23, code: 'custody:edit', displayName: 'Edit Chain of Custody', category: 'Custody' },

  // Audit
  { id: 24, code: 'audit:view', displayName: 'View Audit Log', category: 'Audit' },

  // Transportation
  { id: 25, code: 'transportation:view', displayName: 'View Transportation', category: 'Transportation' },
  { id: 26, code: 'transportation:edit', displayName: 'Edit Transportation', category: 'Transportation' },

  // Ingestion
  { id: 27, code: 'ingestion:view', displayName: 'View Ingestion', category: 'Ingestion' },
  { id: 28, code: 'ingestion:upload', displayName: 'Upload Data', category: 'Ingestion' },

  // Data Sources
  { id: 29, code: 'data_sources:view', displayName: 'View Data Sources', category: 'Data Sources' },
  { id: 30, code: 'data_sources:manage', displayName: 'Manage Data Sources', category: 'Data Sources' },

  // Reports
  { id: 31, code: 'reports:view', displayName: 'View Reports', category: 'Reports' },
  { id: 32, code: 'reports:generate', displayName: 'Generate Reports', category: 'Reports' },

  // Alerts
  { id: 33, code: 'alerts:view', displayName: 'View Alerts', category: 'Alerts' },
  { id: 34, code: 'alerts:acknowledge', displayName: 'Acknowledge Alerts', category: 'Alerts' },

  // Admin
  { id: 35, code: 'admin:users', displayName: 'Manage Users', category: 'Admin' },
  { id: 36, code: 'admin:settings', displayName: 'Manage Settings', category: 'Admin' },
  { id: 37, code: 'admin:roles', displayName: 'Manage Roles', category: 'Admin' },

  // Docs
  { id: 38, code: 'docs:view', displayName: 'View Documentation', category: 'Docs' },

  // Simulator
  { id: 39, code: 'simulator:manage', displayName: 'Manage Simulator', category: 'Simulator' },
];

function permsForCodes(codes: string[]): Permission[] {
  return MOCK_PERMISSIONS.filter((p) => codes.includes(p.code));
}

const MOCK_ROLES: CustomRole[] = [
  {
    id: 1,
    name: 'Admin',
    description: 'Full system access — all permissions granted',
    isSystem: true,
    permissions: [...MOCK_PERMISSIONS],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Commander',
    description: 'Command-level oversight — view all, approve requisitions, manage alerts',
    isSystem: true,
    permissions: permsForCodes([
      'dashboard:view', 'map:view', 'supply:view', 'equipment:view',
      'maintenance:view', 'requisitions:view', 'requisitions:approve',
      'personnel:view', 'readiness:view', 'medical:view', 'fuel:view',
      'custody:view', 'audit:view', 'transportation:view', 'ingestion:view',
      'ingestion:upload', 'reports:view', 'reports:generate', 'alerts:view',
      'alerts:acknowledge', 'docs:view',
    ]),
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'S-4 (Logistics)',
    description: 'Supply, equipment, maintenance, fuel, custody, transportation management',
    isSystem: true,
    permissions: permsForCodes([
      'dashboard:view', 'map:view', 'supply:view', 'supply:edit',
      'equipment:view', 'equipment:edit', 'maintenance:view', 'maintenance:create',
      'maintenance:edit', 'requisitions:view', 'requisitions:create',
      'requisitions:edit', 'requisitions:approve', 'readiness:view',
      'fuel:view', 'fuel:edit', 'custody:view', 'custody:edit',
      'transportation:view', 'transportation:edit', 'ingestion:view',
      'ingestion:upload', 'reports:view', 'reports:generate', 'alerts:view',
      'alerts:acknowledge', 'docs:view',
    ]),
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 4,
    name: 'S-3 (Operations)',
    description: 'Personnel, medical, readiness, transportation, and operations management',
    isSystem: true,
    permissions: permsForCodes([
      'dashboard:view', 'map:view', 'personnel:view', 'personnel:edit',
      'medical:view', 'readiness:view', 'readiness:edit', 'equipment:view',
      'transportation:view', 'transportation:edit', 'reports:view',
      'reports:generate', 'alerts:view', 'alerts:acknowledge', 'docs:view',
    ]),
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 5,
    name: 'Operator',
    description: 'Day-to-day operations — view most data, create requisitions and upload data',
    isSystem: true,
    permissions: permsForCodes([
      'dashboard:view', 'map:view', 'supply:view', 'equipment:view',
      'maintenance:view', 'requisitions:view', 'requisitions:create',
      'requisitions:edit', 'personnel:view', 'readiness:view', 'medical:view',
      'fuel:view', 'custody:view', 'transportation:view', 'ingestion:view',
      'ingestion:upload', 'reports:view', 'alerts:view', 'docs:view',
    ]),
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 6,
    name: 'Viewer',
    description: 'Read-only access to dashboards, supply, equipment, readiness, and reports',
    isSystem: true,
    permissions: permsForCodes([
      'dashboard:view', 'map:view', 'supply:view', 'equipment:view',
      'readiness:view', 'alerts:view', 'reports:view', 'personnel:view',
      'docs:view',
    ]),
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

// In-memory state for demo mode custom role CRUD
let demoRoles = [...MOCK_ROLES];
let nextRoleId = 100;

const mockDelay = (ms = 200 + Math.random() * 200): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function fetchPermissions(): Promise<Permission[]> {
  if (isDemoMode) {
    await mockDelay();
    return [...MOCK_PERMISSIONS];
  }
  const response = await apiClient.get<ApiResponse<Permission[]>>('/rbac/permissions');
  return response.data.data;
}

export async function fetchRoles(): Promise<CustomRole[]> {
  if (isDemoMode) {
    await mockDelay();
    return [...demoRoles];
  }
  const response = await apiClient.get<ApiResponse<CustomRole[]>>('/rbac/roles');
  return response.data.data;
}

export async function fetchRole(id: number): Promise<CustomRole> {
  if (isDemoMode) {
    await mockDelay();
    const role = demoRoles.find((r) => r.id === id);
    if (!role) throw new Error('Role not found');
    return { ...role };
  }
  const response = await apiClient.get<ApiResponse<CustomRole>>(`/rbac/roles/${id}`);
  return response.data.data;
}

export async function createRole(data: {
  name: string;
  description?: string;
  permission_ids: number[];
}): Promise<CustomRole> {
  if (isDemoMode) {
    await mockDelay();
    const newRole: CustomRole = {
      id: nextRoleId++,
      name: data.name,
      description: data.description,
      isSystem: false,
      permissions: MOCK_PERMISSIONS.filter((p) => data.permission_ids.includes(p.id)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    demoRoles.push(newRole);
    return { ...newRole };
  }
  const response = await apiClient.post<ApiResponse<CustomRole>>('/rbac/roles', data);
  return response.data.data;
}

export async function updateRole(
  id: number,
  data: { name?: string; description?: string; permission_ids?: number[] },
): Promise<CustomRole> {
  if (isDemoMode) {
    await mockDelay();
    const idx = demoRoles.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Role not found');
    if (demoRoles[idx].isSystem) throw new Error('Cannot modify system roles');
    const updated: CustomRole = {
      ...demoRoles[idx],
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.permission_ids !== undefined && {
        permissions: MOCK_PERMISSIONS.filter((p) => data.permission_ids!.includes(p.id)),
      }),
      updatedAt: new Date().toISOString(),
    };
    demoRoles[idx] = updated;
    return { ...updated };
  }
  const response = await apiClient.put<ApiResponse<CustomRole>>(`/rbac/roles/${id}`, data);
  return response.data.data;
}

export async function deleteRole(id: number): Promise<void> {
  if (isDemoMode) {
    await mockDelay();
    const role = demoRoles.find((r) => r.id === id);
    if (!role) throw new Error('Role not found');
    if (role.isSystem) throw new Error('Cannot delete system roles');
    demoRoles = demoRoles.filter((r) => r.id !== id);
    return;
  }
  await apiClient.delete(`/rbac/roles/${id}`);
}

export async function fetchUserPermissions(userId: number): Promise<string[]> {
  if (isDemoMode) {
    await mockDelay();
    return MOCK_PERMISSIONS.map((p) => p.code);
  }
  const response = await apiClient.get<ApiResponse<{ role_name: string; permissions: string[] }>>(`/rbac/users/${userId}/permissions`);
  return response.data.data.permissions;
}

export async function assignUserRole(userId: number, roleId: number): Promise<void> {
  if (isDemoMode) {
    await mockDelay();
    return;
  }
  await apiClient.put(`/rbac/users/${userId}/role`, { custom_role_id: roleId });
}

export { MOCK_PERMISSIONS };
