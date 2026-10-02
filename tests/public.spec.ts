import { expect, test } from '@playwright/test';

test('homepage keeps the original slogan and all six product modules', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Every request becomes a clear decision.');
  for (const title of ['Requests', 'Approvals', 'Approval processes', 'Meetings', 'Documents', 'Tasks']) {
    await expect(page.locator('#product').getByRole('heading', { name: title, exact: true })).toBeVisible();
  }
  await page.getByRole('link', { name: 'Documentation', exact: true }).click();
  await expect(page).toHaveURL(/\/docs$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Introduction');
});

test('docs search and navigation lead to working guides and section anchors', async ({ page }) => {
  await page.goto('/docs');
  const navigation = page.locator('.an-docs-sidebar');
  await page.getByRole('searchbox', { name: 'Search documentation' }).fill('Approval processes');
  await expect(navigation.getByRole('link', { name: 'Requests', exact: true })).toHaveCount(0);
  await navigation.getByRole('link', { name: 'Approval processes', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Approval processes');
  await expect(navigation.getByRole('link', { name: 'Approval processes', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.goto('/docs/quickstart#request');
  await expect(page.getByRole('heading', { name: '2. Raise a request' })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search documentation' }).fill('unknown-guide');
  await expect(page.getByRole('status')).toHaveText('No results found');
  await page.goto('/docs/missing');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
});

test('public pages fit English and Khmer at the configured viewport', async ({ page }) => {
  for (const locale of ['en', 'km']) {
    await page.addInitScript(value => localStorage.setItem('anumat-locale', value), locale);
    for (const path of ['/', '/docs', '/docs/approvals']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const width = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: window.innerWidth }));
      expect(width.content).toBeLessThanOrEqual(width.viewport);
    }
  }
});
