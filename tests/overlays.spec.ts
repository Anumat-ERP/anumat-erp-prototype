import { expect, test } from '@playwright/test';

test('request filter restores focus after dismissal', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Desktop filter interaction');
  await page.goto('/requests');
  const status = page.getByRole('group', { name: 'Filters' }).getByRole('button', { name: 'Status' });
  await status.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(status).toBeFocused();
});

test('account menu follows dark mode', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Desktop menu interaction');
  await page.addInitScript(() => localStorage.setItem('anumat-theme', 'dark'));
  await page.goto('/home');
  await page.getByRole('button', { name: /^Account:/ }).click();
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  const bg = await menu.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe('rgb(255, 255, 255)');
});
