import { expect, test } from '@playwright/test';

test('template catalog is empty and process creation stays available', async ({ page }) => {
  await page.goto('/processes?tab=marketplace');
  await expect(page.getByRole('heading', { name: 'No templates available' })).toBeVisible();
  await page.getByRole('button', { name: 'New process' }).click();
  await expect(page).toHaveURL(/\/processes\/proc-/);
  await expect(page.getByRole('textbox', { name: 'Request type name' }).first()).toHaveValue('New request type');
  await page.goto('/processes');
  await expect(page.getByText('New request type').first()).toBeVisible();
});
