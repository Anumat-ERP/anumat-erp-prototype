import { expect, test } from '@playwright/test';

test('templates: browse, preview the route, install, turn on, then request it', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Sidebar link is desktop; the flow itself is covered on mobile below');
  await page.goto('/home');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: /^Templates/ }).click();
  await expect(page.getByRole('tab', { name: 'Templates', exact: true })).toHaveAttribute('aria-selected', 'true');

  // Built-in processes show as already added.
  const purchase = page.getByRole('button', { name: /^Purchase approval/ });
  await expect(purchase).toContainText('Added');

  // Category chips filter the grid.
  await page.getByRole('group', { name: 'Categories' }).getByRole('button', { name: /^Finance/ }).click();
  await expect(page.getByRole('button', { name: /^Leave request/ })).toHaveCount(0);
  await page.getByRole('button', { name: /^Vendor onboarding/ }).click();

  // The sheet shows the route with approvers already suggested.
  const sheet = page.getByRole('dialog', { name: 'Vendor onboarding' });
  await expect(sheet.getByRole('list', { name: 'Route' }).getByRole('listitem')).toHaveCount(3);
  await expect(sheet.getByRole('combobox', { name: /^1\./ })).toContainText('Priya Shah');
  await sheet.getByRole('button', { name: 'Use template', exact: true }).click();

  // Lands paused in the editor, can be turned on and saved.
  await expect(page).toHaveURL(/\/processes\/[^/?#]+$/);
  await expect(page.getByText(/This process is paused/)).toBeVisible();
  await page.getByRole('button', { name: 'Turn on', exact: true }).click();
  await page.getByRole('button', { name: 'Save process', exact: true }).first().click();
  await expect(page.getByText(/This process is paused/)).toHaveCount(0);

  // People can now raise it.
  await page.goto('/requests/new');
  await page.getByRole('combobox', { name: /What kind of request/ }).click();
  await expect(page.getByRole('option', { name: 'Vendor onboarding' })).toBeVisible();
});

test('process list explains paused processes and links to templates', async ({ page }) => {
  await page.goto('/processes');
  await expect(page.getByRole('heading', { level: 1, name: 'Approval processes' })).toBeVisible();
  await page.getByRole('link', { name: /Browse templates/ }).click();
  await expect(page.getByRole('tab', { name: 'Templates', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: /^IT access request/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Use template', exact: true }).click();
  await page.goto('/processes');
  await expect(page.getByRole('article', { name: 'IT access request' })).toContainText('Paused');
  await expect(page.getByText(/\b1 days\b/)).toHaveCount(0);
});
