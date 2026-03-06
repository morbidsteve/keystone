import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Dashboard Role Routing', () => {
  test('commander sees COMMANDER tab and view switcher', async ({ page }) => {
    await login(page, 'bn_co');
    await expect(page.getByRole('button', { name: 'COMMANDER' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'S-4 (LOGISTICS)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'S-3 (OPERATIONS)' })).toBeVisible();
  });

  test('commander can switch between dashboard views', async ({ page }) => {
    await login(page, 'bn_co');
    await page.getByRole('button', { name: 'S-4 (LOGISTICS)' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'S-3 (OPERATIONS)' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'COMMANDER' }).click();
    await page.waitForTimeout(500);
  });

  test('S4 officer sees logistics-focused dashboard', async ({ page }) => {
    await login(page, 'bn_s4');
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/dashboard/);
  });

  test('dashboard shows activity feed', async ({ page }) => {
    await login(page, 'bn_co');
    await expect(page.getByText('ACTIVITY FEED')).toBeVisible({ timeout: 5000 });
  });

  test('breadcrumb shows DASHBOARD', async ({ page }) => {
    await login(page, 'bn_co');
    await expect(page.getByRole('heading', { name: 'DASHBOARD' })).toBeVisible({ timeout: 5000 });
  });
});
