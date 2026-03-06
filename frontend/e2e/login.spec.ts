import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('shows KEYSTONE branding', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('KEYSTONE')).toBeVisible();
    await expect(page.getByText('LOGISTICS COMMON OPERATING PICTURE')).toBeVisible();
  });

  test('shows classification banners', async ({ page }) => {
    await page.goto('/login');
    const banners = page.getByText('UNCLASSIFIED');
    await expect(banners.first()).toBeVisible();
  });

  test('demo mode shows role picker with search', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/SELECT YOUR ROLE/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder(/search by name/i)).toBeVisible();
  });

  test('search filters demo users', async ({ page }) => {
    await page.goto('/login');
    const search = page.getByPlaceholder(/search by name/i);
    await expect(search).toBeVisible({ timeout: 5000 });
    await search.fill('bn_co');
    await page.waitForTimeout(300);
    // Should show David R. Harris card
    await expect(page.getByText('David R. Harris')).toBeVisible();
  });

  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.removeItem('keystone_token');
      localStorage.removeItem('keystone_user');
      localStorage.removeItem('keystone_permissions');
    });
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('authenticated user reaches dashboard', async ({ page }) => {
    // Set auth state directly
    await page.goto('/login');
    await page.evaluate(() => {
      const user = {
        id: 1, username: 'bn_co', full_name: 'David R. Harris',
        role: 'COMMANDER', unit_id: 1, email: 'bn_co@keystone.usmc.mil',
        is_active: true, created_at: '2026-01-01T00:00:00Z',
        permissions: ['dashboard:view', 'map:view', 'supply:view'],
      };
      localStorage.setItem('keystone_token', 'demo-jwt-token-e2e');
      localStorage.setItem('keystone_user', JSON.stringify(user));
      localStorage.setItem('keystone_permissions', JSON.stringify(user.permissions));
    });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 10000 });
  });
});
