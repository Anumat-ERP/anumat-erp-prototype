import { expect, test } from '@playwright/test';

test('home shows the flow strip with live counts', async ({ page }) => {
  await page.goto('/home');
  const flow = page.getByRole('list', { name: 'Ask, approve, execute, track' });
  await expect(flow.getByRole('listitem')).toHaveCount(4);
  await expect(flow.getByRole('link', { name: /Approve.*0/ })).toHaveAttribute('href', '/approvals');
  await expect(page.getByRole('heading', { name: 'Waiting on you' })).toBeVisible();
  await expect(page.getByRole('figure', { name: /Requests over time/ })).toBeVisible();
});

test('home survives reset demo data', async ({ page }) => {
  await page.goto('/home');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText('NaN')).toHaveCount(0);
});

test('chart range tabs change the period', async ({ page }) => {
  await page.goto('/home');
  const figure = page.getByRole('figure', { name: /Requests over time/ });
  await figure.getByRole('tab', { name: '7 days' }).click();
  await expect(figure).toHaveAccessibleName(/last 7 days/);
});
