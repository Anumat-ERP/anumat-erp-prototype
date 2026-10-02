import { expect, test } from '@playwright/test';

test('overlays restore focus', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Header decision buttons are desktop-only');
  await page.goto('/requests/PR-1042');
  const decline = page.getByRole('button', { name: 'Decline', exact: true }).first();
  await decline.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(decline).toBeFocused();

  await page.goto('/requests');
  const status = page
    .getByRole('group', { name: 'Filters' })
    .getByRole('button', { name: 'Status' });
  await status.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(status).toBeFocused();
});

test('menus and toasts follow dark mode', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.addInitScript(() => localStorage.setItem('anumat-theme', 'dark'));
  await page.goto('/requests/PR-1042');
  await page.getByRole('button', { name: 'Approve', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const bg = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor);
  // Dark popover surface (#111a2c) or card (#0f1626), never white.
  expect(bg).not.toBe('rgb(255, 255, 255)');
});
