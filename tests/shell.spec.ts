import { expect, test } from '@playwright/test';

test('sidebar groups and collapse', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/home');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  for (const name of ['Dashboard', 'Requests', 'Approvals', 'Tasks', 'Insights', 'Approval processes', 'Templates', 'People & roles'])
    await expect(nav.getByRole('link', { name: new RegExp(`^${name}`) })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Dashboard');
  await page.getByRole('button', { name: 'Toggle sidebar' }).click();
  await expect(nav.getByRole('link', { name: /^Requests/ })).toHaveAttribute('data-collapsed', 'true');
  // The choice is remembered.
  await page.reload();
  await expect(nav.getByRole('link', { name: /^Requests/ })).toHaveAttribute('data-collapsed', 'true');
  await page.getByRole('button', { name: 'Toggle sidebar' }).click();
  await expect(nav.getByRole('link', { name: /^Requests/ })).not.toHaveAttribute('data-collapsed', 'true');
});

test('mobile sheet closes after navigating', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile');
  await page.goto('/home');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  const sheet = page.getByRole('dialog', { name: 'Navigation' });
  await sheet.getByRole('link', { name: /^Requests/ }).click();
  await expect(page).toHaveURL(/\/requests$/);
  await expect(sheet).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});
