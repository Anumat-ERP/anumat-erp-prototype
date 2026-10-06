import { expect, test } from '@playwright/test';
test('current app identity persists across pages and the switcher updates the app', async ({ page }, info) => {
  await page.goto('/tasks/people');
  const context = info.project.name === 'desktop' ? page.locator('.an-app-switch-sidebar') : page.getByRole('region', { name: 'Current app', exact: true });
  await expect(context.getByText('Task management', { exact: true })).toBeVisible();
  await (info.project.name === 'desktop' ? context : context.getByRole('button')).click();
  await page.getByRole('menuitem', { name: 'Meeting management', exact: true }).click();
  await expect(page).toHaveURL(/\/home\?app=meetings$/);
  await expect(context.getByText('Meeting management', { exact: true })).toBeVisible();
  await page.reload();
  await expect(context.getByText('Meeting management', { exact: true })).toBeVisible();
  await page.screenshot({ path: `test-results/app-context-${info.project.name}.png`, animations: 'disabled' });
  await page.goto('/tasks/people');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(context).toBeInViewport();
  const position = await context.boundingBox();
  const toolbar = await page.locator('.an-utilities').boundingBox();
  if (info.project.name !== 'desktop') expect(position!.y).toBeGreaterThanOrEqual(toolbar!.y + toolbar!.height - 1);
  if (info.project.name === 'desktop') {
    await page.getByRole('button', { name: 'Toggle sidebar', exact: true }).click();
    await expect(page.locator('.an-app-switch-rail')).toBeVisible();
  }
  await page.goto('/discover');
  await expect(context).toHaveCount(0);
});
test('app identity fits Khmer dark mode and disables apps without membership', async ({ page }, info) => {
  await page.goto('/tasks');
  await page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!); const state = root.spaces[root.active];
    state.meId = 'alex'; delete state.appMembers.meetings.alex;
    localStorage.setItem('anumat-hackathon-v1', JSON.stringify(root));
    localStorage.setItem('anumat-locale', 'km'); localStorage.setItem('anumat-theme', 'dark');
  });
  await page.reload();
  const context = info.project.name === 'desktop' ? page.locator('.an-app-switch-sidebar') : page.getByRole('region', { name: 'កម្មវិធីបច្ចុប្បន្ន', exact: true });
  await expect(context).toBeVisible();
  await (info.project.name === 'desktop' ? context : context.getByRole('button')).click();
  await expect(page.getByRole('menuitem').filter({ hasText: 'ការគ្រប់គ្រងកិច្ចប្រជុំ' })).toBeDisabled();
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `test-results/app-context-km-dark-${info.project.name}.png`, animations: 'disabled' });
});
