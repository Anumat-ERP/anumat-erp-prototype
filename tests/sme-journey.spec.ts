import { expect, test } from '@playwright/test';

test('setup restores choices and creates an isolated company with actionable progress', async ({ page }) => {
  await page.goto('/welcome');
  await page.getByRole('textbox', { name: 'Company name', exact: false }).fill('SME Pilot');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'What would you like to improve first?' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('SME Pilot', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Create workspace', exact: true }).click();
  await expect(page).toHaveURL(/home\?app=approvals$/);
  const saved = await page.evaluate(() => { const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!); return root.spaces[root.active]; });
  expect(saved.people).toHaveLength(1);
  expect(saved.people[0].id).toBe(saved.meId);
  for (const key of ['requests', 'processes', 'tasks', 'meetings', 'documents', 'surveys', 'leads']) expect(saved[key]).toHaveLength(0);
  expect(saved.hr.employees).toHaveLength(0);
  await expect(page.getByText('0 of 4 steps complete')).toBeVisible();
  await page.getByRole('button', { name: 'Hide for now' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Show getting started' }).click();
  await expect(page.getByText('Set up an active process first.')).toBeVisible();
  await page.getByRole('link', { name: 'Start: Submit your first request' }).click();
  await expect(page).toHaveURL(/processes$/);
});

test('people starter routes to employee setup without demonstration employees', async ({ page }) => {
  await page.goto('/welcome?starter=people');
  await page.getByRole('textbox', { name: 'Company name', exact: false }).fill('People Pilot');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('radio', { name: /People & HR/ })).toBeChecked();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Create workspace', exact: true }).click();
  await expect(page).toHaveURL(/home\?app=employees$/);
  await expect(page.getByText('0 of 3 steps complete')).toBeVisible();
  await page.getByRole('link', { name: 'Start: Add your first employee' }).click();
  await expect(page).toHaveURL(/employees\?tab=employees&create=1$/);
});

test('public workflow choices and mobile navigation remain usable', async ({ page }, info) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'People & HR' }).click();
  await expect(page.getByRole('link', { name: 'Set up this workflow' })).toHaveAttribute('href', '/welcome?starter=people');
  if (info.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Browse Anumat' }).click();
    await page.getByRole('menuitem', { name: 'Pricing' }).click();
    await expect(page).toHaveURL(/pricing$/);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
