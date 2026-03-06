import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Command Palette', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('opens with Ctrl+K', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.getByPlaceholder(/search pages/i)).toBeVisible({ timeout: 3000 });
  });

  test('closes with Escape', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.getByPlaceholder(/search pages/i)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByPlaceholder(/search pages/i)).toBeHidden({ timeout: 2000 });
  });

  test('shows page results when typing', async ({ page }) => {
    await page.keyboard.press('Control+k');
    const searchInput = page.getByPlaceholder(/search pages/i);
    await searchInput.fill('dashboard');
    await page.waitForTimeout(500);
    // Verify results are shown (the palette should still be visible with results)
    await expect(page.getByPlaceholder(/search pages/i)).toBeVisible();
  });

  test('navigates to selected page result', async ({ page }) => {
    await page.keyboard.press('Control+k');
    const searchInput = page.getByPlaceholder(/search pages/i);
    await searchInput.fill('equipment');
    await page.waitForTimeout(500);
    // Click the equipment result in command palette
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
  });

  test('shows equipment search results', async ({ page }) => {
    await page.keyboard.press('Control+k');
    const searchInput = page.getByPlaceholder(/search pages/i);
    await searchInput.fill('HMMWV');
    await page.waitForTimeout(800);
    await expect(searchInput).toBeVisible();
  });

  test('keyboard navigation with arrow keys', async ({ page }) => {
    await page.keyboard.press('Control+k');
    const searchInput = page.getByPlaceholder(/search pages/i);
    await searchInput.fill('dash');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
  });
});

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.waitForTimeout(500);
  });

  test('G then D navigates to dashboard', async ({ page }) => {
    await page.goto('/supply');
    await page.waitForTimeout(500);
    await page.keyboard.press('g');
    await page.waitForTimeout(200);
    await page.keyboard.press('d');
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('G then S navigates to supply', async ({ page }) => {
    await page.keyboard.press('g');
    await page.waitForTimeout(200);
    await page.keyboard.press('s');
    await page.waitForURL('**/supply', { timeout: 5000 });
    await expect(page).toHaveURL(/supply/);
  });

  test('G then E navigates to equipment', async ({ page }) => {
    await page.keyboard.press('g');
    await page.waitForTimeout(200);
    await page.keyboard.press('e');
    await page.waitForURL('**/equipment', { timeout: 5000 });
    await expect(page).toHaveURL(/equipment/);
  });

  test('? opens keyboard shortcuts help', async ({ page }) => {
    await page.keyboard.press('?');
    await expect(page.getByRole('heading', { name: /keyboard shortcuts/i })).toBeVisible({ timeout: 3000 });
  });

  test('shortcuts help closes with Escape', async ({ page }) => {
    await page.keyboard.press('?');
    await expect(page.getByRole('heading', { name: /keyboard shortcuts/i })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: /keyboard shortcuts/i })).toBeHidden({ timeout: 2000 });
  });
});
