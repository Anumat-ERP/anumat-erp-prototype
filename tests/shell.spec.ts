import { expect, test } from '@playwright/test';

test('sidebar groups and collapse', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/approvals');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  for (const name of ['Explore modules', 'Dashboard', 'Requests', 'Approvals', 'Insights', 'Approval processes', 'Templates', 'People & roles'])
    await expect(nav.getByRole('link', { name: new RegExp(`^${name}`) })).toBeVisible();
  await expect(nav.getByRole('link', { name: /^Tasks/ })).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Approvals');
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
  await page.goto('/approvals');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  const sheet = page.getByRole('dialog', { name: 'Navigation' });
  await sheet.getByRole('link', { name: /^Requests/ }).click();
  await expect(page).toHaveURL(/\/requests$/);
  await expect(sheet).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('each app keeps its own navigation while the catalog stays available', async ({ page }, info) => {
  await page.goto('/tasks');
  if (info.project.name === 'mobile') await page.getByRole('button', { name: 'Open navigation' }).click();
  let nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav.getByRole('link', { name: /^Tasks/ })).toBeVisible();
  await expect(nav.getByRole('link', { name: /^Approvals/ })).toHaveCount(0);
  await expect(nav.getByRole('link', { name: /^Meetings/ })).toHaveCount(0);
  await expect(nav.getByRole('link', { name: 'Explore modules' })).toBeVisible();

  await page.goto('/meetings');
  if (info.project.name === 'mobile') await page.getByRole('button', { name: 'Open navigation' }).click();
  nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav.getByRole('link', { name: /^Meetings/ })).toBeVisible();
  await expect(nav.getByRole('link', { name: /^Tasks/ })).toHaveCount(0);
  await expect(nav.getByRole('link', { name: /^Approvals/ })).toHaveCount(0);
});
