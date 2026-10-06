import { expect, test } from '@playwright/test';
import { APP_CATALOG, APP_GROUPS } from '../src/lib/appCatalog';
import { km } from '../src/i18n/messages';

test('catalog filters workflows, retains URL state, and recovers from empty search', async ({ page }, info) => {
  await page.goto('/discover');
  for (const group of APP_GROUPS) await expect(page.getByRole('heading', { name: group.title })).toBeVisible();
  await page.getByRole('button', { name: 'People & growth', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: '4 apps found' })).toBeVisible();
  await expect(page.locator('.an-modules').getByRole('link', { name: /Payroll management/ })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'People & growth', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'All apps', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Find an app or workflow' }).fill('leave');
  await expect(page.locator('.an-modules').getByRole('link', { name: /Employee management/ })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Find an app or workflow' }).fill('nonexistent-workflow');
  await expect(page.getByRole('heading', { name: 'No apps match your search' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: '12 apps found' })).toBeVisible();
  await page.screenshot({ path: `test-results/organized-apps-${info.project.name}.png`, fullPage: true, animations: 'disabled' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('each app dashboard has actionable, optional guidance and a full guide', async ({ page }, info) => {
  for (const app of Object.keys(APP_CATALOG)) {
    await page.goto(`/home?app=${app}`);
    const guide = page.locator('.an-workflow-guidance');
    const trigger = guide.getByRole('button', { name: 'How this app works' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    if (info.project.name === 'mobile') await trigger.click();
    else { await trigger.focus(); await trigger.press('Enter'); }
    await expect(guide.locator('ol > li')).toHaveCount(3);
    await guide.getByRole('link', { name: 'Read the full guide' }).click();
    await expect(page.getByRole('heading', { level: 1, name: APP_CATALOG[app as keyof typeof APP_CATALOG].title })).toBeVisible();
  }
  await page.goto('/home?app=tasks');
  await page.getByRole('button', { name: 'How this app works' }).click();
  await page.screenshot({ path: `test-results/workflow-guidance-${info.project.name}.png`, animations: 'disabled', fullPage: true });
});

test('global search finds an app by its workflow and opens it with the keyboard', async ({ page }) => {
  await page.goto('/discover');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('combobox').fill('Plan work');
  await expect(page.getByRole('option').filter({ hasText: 'Tasks' })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/home\?app=tasks$/);
  await expect(page.getByRole('heading', { name: 'Tasks dashboard' })).toBeVisible();
});

test('discovery and global search respect app access', async ({ page }) => {
  await page.goto('/discover');
  await page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    const state = root.spaces[root.active];
    state.meId = 'alex';
    delete state.appMembers.meetings.alex;
    localStorage.setItem('anumat-hackathon-v1', JSON.stringify(root));
  });
  await page.reload();
  const card = page.locator('.an-catalog-locked').filter({ hasText: 'Meetings' });
  await expect(card).toContainText('Ask an app admin for access.');
  await expect(card.getByRole('link')).toHaveCount(0);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('combobox').fill('Plan a meeting');
  await expect(page.getByRole('option').filter({ hasText: 'Meetings' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.goto('/home?app=meetings');
  await expect(page.getByRole('heading', { name: 'You do not have access to this app' })).toBeVisible();
});

test('documentation searches workflow content and links to real sections', async ({ page }, info) => {
  test.setTimeout(60_000);
  await page.goto('/docs/tasks');
  const nav = page.getByRole('navigation', { name: 'Documentation', exact: true });
  if (info.project.name === 'mobile') await page.getByRole('button', { name: 'Browse guides' }).click();
  await expect(nav.getByRole('link', { name: 'Tasks', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('searchbox', { name: 'Search documentation' }).fill('evidence');
  await expect(nav.getByRole('link', { name: 'Tasks', exact: true })).toBeVisible();
  await nav.getByRole('link', { name: 'Tasks', exact: true }).click();
  await expect(page.getByRole('searchbox', { name: 'Search documentation' })).toHaveValue('');
  if (info.project.name === 'mobile') {
    await expect(nav).toBeHidden();
    await page.getByRole('searchbox', { name: 'Search documentation' }).fill('a');
    await expect(nav).toBeVisible();
    await page.getByRole('button', { name: 'Browse guides' }).click();
    await expect(nav).toBeHidden();
    await expect(page.getByRole('searchbox', { name: 'Search documentation' })).toHaveValue('');
  }
  await page.getByRole('link', { name: 'Open Plan work' }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await page.goto('/docs/payroll');
  await page.screenshot({ path: `test-results/organized-docs-${info.project.name}.png`, animations: 'disabled', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('every catalog workflow has Khmer copy and works in dark mode', async ({ page }, info) => {
  for (const text of [...APP_GROUPS.flatMap(g => [g.title, g.description]), ...Object.values(APP_CATALOG).flatMap(g => [g.title, g.description, ...g.steps.flatMap(s => [s.title, s.text])])]) expect(km[text], text).toBeTruthy();
  await page.addInitScript(() => { localStorage.setItem('anumat-locale', 'km'); localStorage.setItem('anumat-theme', 'dark'); });
  await page.goto('/discover');
  await page.getByRole('searchbox', { name: 'ស្វែងរកកម្មវិធី ឬដំណើរការការងារ' }).fill('ការឈប់សម្រាក');
  await expect(page.locator('.an-modules').getByRole('link', { name: /ការគ្រប់គ្រងបុគ្គលិក/ })).toBeVisible();
  await page.goto('/home?app=tasks');
  await page.getByRole('button', { name: 'របៀបប្រើកម្មវិធីនេះ' }).click();
  await expect(page.locator('.an-workflow-guidance ol > li')).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `test-results/workflow-km-dark-${info.project.name}.png`, animations: 'disabled', fullPage: true });
});
