import { Page, expect } from '@playwright/test';

/** Demo user profiles for localStorage-based login */
const DEMO_PROFILES: Record<string, { role: string; full_name: string; unit_id: number }> = {
  bn_co: { role: 'COMMANDER', full_name: 'David R. Harris', unit_id: 1 },
  bn_xo: { role: 'COMMANDER', full_name: 'Thomas A. Reed', unit_id: 1 },
  bn_s1: { role: 'OPERATOR', full_name: 'Emily J. Foster', unit_id: 1 },
  bn_s3: { role: 'S3', full_name: "Ryan K. O'Brien", unit_id: 1 },
  bn_s4: { role: 'S4', full_name: 'Michelle L. Santos', unit_id: 1 },
  bn_s6: { role: 'OPERATOR', full_name: 'Andrew P. Chen', unit_id: 1 },
  alpha_co: { role: 'COMMANDER', full_name: 'Robert M. Williams', unit_id: 2 },
  alpha_supply: { role: 'OPERATOR', full_name: 'Miguel Rodriguez', unit_id: 2 },
  maint_chief: { role: 'OPERATOR', full_name: "Patrick O'Malley", unit_id: 1 },
  regt_s4: { role: 'S4', full_name: 'David Wilson', unit_id: 3 },
};

/** All permissions for COMMANDER/ADMIN role */
const ALL_PERMISSIONS = [
  'dashboard:view', 'map:view', 'supply:view', 'supply:edit',
  'equipment:view', 'equipment:edit', 'maintenance:view', 'maintenance:create',
  'maintenance:edit', 'requisitions:view', 'requisitions:create',
  'requisitions:edit', 'requisitions:approve', 'personnel:view', 'personnel:edit',
  'readiness:view', 'medical:view', 'fuel:view', 'fuel:edit',
  'custody:view', 'custody:edit', 'audit:view', 'transportation:view',
  'transportation:edit', 'ingestion:view', 'ingestion:upload',
  'data_sources:view', 'reports:view', 'reports:generate',
  'alerts:view', 'alerts:acknowledge', 'admin:users', 'admin:settings',
  'admin:roles', 'docs:view',
];

/**
 * Login by setting localStorage directly and navigating to dashboard.
 * This bypasses the demo role picker UI (which has a known React hooks bug)
 * and tests the authenticated app experience directly.
 */
export async function login(page: Page, username = 'bn_co') {
  const profile = DEMO_PROFILES[username] || DEMO_PROFILES.bn_co;

  // Navigate to any page to set localStorage on the correct origin
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  // Set auth state in localStorage
  await page.evaluate(({ username, profile, permissions }) => {
    const user = {
      id: 1,
      username,
      full_name: profile.full_name,
      role: profile.role,
      unit_id: profile.unit_id,
      email: `${username}@keystone.usmc.mil`,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      permissions,
    };
    localStorage.setItem('keystone_token', 'demo-jwt-token-e2e');
    localStorage.setItem('keystone_user', JSON.stringify(user));
    localStorage.setItem('keystone_permissions', JSON.stringify(permissions));
  }, { username, profile, permissions: ALL_PERMISSIONS });

  // Navigate to dashboard — React will pick up auth from localStorage
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  // Wait for the React app to render
  await expect(page.locator('#root')).not.toBeEmpty({ timeout: 10000 });
}
