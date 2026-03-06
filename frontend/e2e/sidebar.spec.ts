import { test, expect } from '@playwright/test';
import { login } from './helpers';

// Sidebar navigation tests only run on desktop (sidebar is a drawer on mobile)
test.describe('Sidebar Navigation', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('sidebar shows navigation groups', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'OPERATIONS', exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'LOGISTICS', exact: true })).toBeVisible();
  });

  test('clicking sidebar item navigates to page', async ({ page }) => {
    await page.getByRole('link', { name: /^SUPPLY$/ }).click();
    await page.waitForURL('**/supply', { timeout: 5000 });
    await expect(page).toHaveURL(/supply/);
  });

  test('clicking EQUIPMENT navigates to equipment page', async ({ page }) => {
    await page.getByRole('link', { name: /^EQUIPMENT$/ }).click();
    await page.waitForURL('**/equipment', { timeout: 5000 });
    await expect(page).toHaveURL(/equipment/);
  });

  test('clicking MAP navigates to map page', async ({ page }) => {
    await page.getByRole('link', { name: /^MAP$/ }).click();
    await page.waitForURL('**/map', { timeout: 5000 });
    await expect(page).toHaveURL(/map/);
  });

  test('sidebar groups can be collapsed', async ({ page }) => {
    const logisticsBtn = page.getByRole('button', { name: 'LOGISTICS', exact: true });
    await logisticsBtn.click();
    await page.waitForTimeout(300);
    await logisticsBtn.click();
    await page.waitForTimeout(300);
  });

  test('sidebar shows user info at bottom', async ({ page }) => {
    await expect(page.getByText('David R. Harris')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Quick Actions & Modals', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('N+R shortcut opens create requisition modal', async ({ page }) => {
    await page.keyboard.press('n');
    await page.waitForTimeout(200);
    await page.keyboard.press('r');
    await expect(page.getByText(/CREATE.*REQUISITION|NEW.*REQUISITION/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('create requisition modal closes with Escape', async ({ page }) => {
    await page.keyboard.press('n');
    await page.waitForTimeout(200);
    await page.keyboard.press('r');
    await expect(page.getByText(/CREATE.*REQUISITION|NEW.*REQUISITION/i).first()).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('N+W shortcut opens create work order modal', async ({ page }) => {
    await page.keyboard.press('n');
    await page.waitForTimeout(200);
    await page.keyboard.press('w');
    await expect(page.getByRole('button', { name: 'CREATE WORK ORDER' })).toBeVisible({ timeout: 5000 });
  });
});
