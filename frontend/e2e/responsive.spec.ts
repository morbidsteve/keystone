import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Mobile Responsive', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('login page renders on mobile', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('KEYSTONE')).toBeVisible();
    await expect(page.getByText('UNCLASSIFIED').first()).toBeVisible();
  });

  test('dashboard loads on mobile', async ({ page }) => {
    await login(page);
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { name: 'DASHBOARD' })).toBeVisible({ timeout: 5000 });
  });

  test('classification banners visible on mobile', async ({ page }) => {
    await page.goto('/login');
    const banners = page.getByText('UNCLASSIFIED');
    await expect(banners.first()).toBeVisible();
  });
});

test.describe('Desktop Layout', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('sidebar visible on desktop', async ({ page }) => {
    await login(page);
    await expect(page.getByRole('button', { name: 'OPERATIONS', exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'LOGISTICS', exact: true })).toBeVisible();
  });

  test('classification banners at top and bottom', async ({ page }) => {
    await login(page);
    const banners = page.getByText('UNCLASSIFIED');
    const count = await banners.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('breadcrumb visible on desktop', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: /^SUPPLY$/ }).click();
    await page.waitForURL('**/supply', { timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'SUPPLY' })).toBeVisible({ timeout: 5000 });
  });

  test('page transitions work smoothly', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: /^SUPPLY$/ }).click();
    await page.waitForURL('**/supply', { timeout: 5000 });
    await page.getByRole('link', { name: /^EQUIPMENT$/ }).click();
    await page.waitForURL('**/equipment', { timeout: 5000 });
    await page.getByRole('link', { name: /^MAINTENANCE/ }).click();
    await page.waitForURL('**/maintenance', { timeout: 5000 });
    await expect(page).toHaveURL(/maintenance/);
  });
});
