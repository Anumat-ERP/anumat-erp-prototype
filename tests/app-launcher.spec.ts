import { expect, test } from '@playwright/test';

test('launcher selection reveals only the selected app and survives reload', async ({ page }, info) => {
  await page.goto('/home');
  await expect(page).toHaveURL(/\/discover$/);
  await expect(page.getByRole('heading', { name: 'What would you like to work on?' })).toBeVisible();
  if (info.project.name === 'mobile') await page.getByRole('button', { name: 'Open navigation' }).click();
  let nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav.getByRole('link', { name: 'Dashboard', exact: true })).toHaveCount(0);
  if (info.project.name === 'mobile') await page.getByRole('button', { name: 'Close navigation' }).click();
  await page.locator('.an-modules img').evaluateAll((images) => Promise.all(images.map((img) => (img as HTMLImageElement).decode())));
  await page.screenshot({ path: `test-results/launcher-${info.project.name}.png`, fullPage: true });
  await page.getByRole('link').filter({ has: page.getByText('Tasks', { exact: true }) }).click();
  await expect(page.getByRole('heading', { name: 'Tasks dashboard' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Tasks dashboard' })).toBeVisible();
  if (info.project.name === 'mobile') await page.getByRole('button', { name: 'Open navigation' }).click();
  nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav.getByRole('link', { name: 'Dashboard', exact: true })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Tasks', exact: true })).toBeVisible();
  await expect(nav.getByRole('link', { name: /^Approvals/ })).toHaveCount(0);
  await nav.getByRole('link', { name: 'Explore modules' }).click();
  await expect(page.getByRole('heading', { name: 'Work & collaboration' })).toBeVisible();
  await page.getByRole('link').filter({ has: page.getByText('Meetings', { exact: true }) }).click();
  await expect(page.getByRole('heading', { name: 'Meetings dashboard' })).toBeVisible();
  await page.goto('/home');
  await expect(page.getByRole('heading', { name: 'Meetings dashboard' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.goto('/discover');
  await page.getByRole('link').filter({ has: page.getByText('Surveys & evaluations', { exact: true }) }).click();
  await expect(page.getByRole('heading', { name: 'Surveys & evaluations dashboard' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Surveys & evaluations dashboard' })).toBeVisible();
  if (info.project.name === 'mobile') await page.getByRole('button', { name: 'Open navigation' }).click();
  nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav.getByRole('link', { name: 'Surveys', exact: true })).toBeVisible();
  await expect(nav.getByRole('link', { name: /^Tasks/ })).toHaveCount(0);
  await nav.getByRole('link', { name: 'Explore modules' }).click();
  await page.getByRole('link').filter({ has: page.getByText('Requests & approvals', { exact: true }) }).click();
  await expect(page).toHaveURL(/\/home\?app=approvals$/);
  await expect(page.getByRole('button', { name: 'New request', exact: true })).toBeVisible();
});

test('launcher works in dark theme and Khmer', async ({ page }, info) => {
  await page.addInitScript(() => {
    localStorage.setItem('anumat-locale', 'km');
    localStorage.setItem('anumat-theme', 'dark');
  });
  await page.goto('/discover');
  await expect(page.getByRole('heading', { name: 'ការងារ និងកិច្ចសហការ' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.locator('.an-modules img').evaluateAll((images) => Promise.all(images.map((img) => (img as HTMLImageElement).decode())));
  await page.screenshot({ path: `test-results/launcher-km-dark-${info.project.name}.png`, fullPage: true });
});


test('working concepts use labelled examples and support keyboard navigation', async ({ page }, info) => {
  await page.goto('/discover');
  const guide = page.getByRole('region', { name: 'A clearer way to work together' });
  await expect(guide.getByText('Standard operating procedures (SOPs)', { exact: false })).toBeVisible();
  await guide.getByRole('tab', { name: 'Work steps' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(guide.getByRole('tab', { name: 'Team roles' })).toHaveAttribute('aria-selected', 'true');
  await expect(guide.getByText('R · Responsible', { exact: true })).toBeVisible();
  await expect(guide.getByText('Owns the outcome', { exact: true })).toBeVisible();
  await guide.screenshot({ path: `test-results/guide-roles-${info.project.name}.png` });
  await guide.getByRole('tab', { name: 'Answer privacy' }).click();
  await expect(guide.getByText('Names hidden in results')).toBeVisible();
  await expect(guide.getByText('Anonymous survey totals appear after at least 3 responses.')).toBeVisible();
  await guide.screenshot({ path: `test-results/guide-privacy-${info.project.name}.png` });
  await guide.getByRole('tab', { name: 'Decision history' }).click();
  await expect(guide.getByText('Who decided and when')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await guide.getByRole('link', { name: 'Explore request history' }).click();
  await expect(page).toHaveURL(/\/requests$/);
});

test('survey dashboard exposes a saved evaluation draft only to managers', async ({ page }, info) => {
  await page.goto('/home?app=surveys');
  await page.getByRole('link', { name: 'New survey', exact: true }).click();
  await page.getByRole('button', { name: /Training feedback/ }).click();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Training evaluation test');
  await page.getByRole('button', { name: 'Save draft', exact: true }).first().click();
  await expect(page).toHaveURL(/\/surveys$/);
  await page.goto('/home?app=surveys');
  await expect(page.getByRole('link', { name: 'Training evaluation test Draft' })).toBeVisible();
  await page.getByRole('button', { name: /^Account:/ }).click();
  await page.getByRole('menuitem', { name: /Alex Tan/ }).click();
  await expect(page.getByRole('link', { name: 'Training evaluation test Draft' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'New survey', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'View surveys', exact: true }).last().click();
  await expect(page.getByRole('link', { name: 'Training evaluation test', exact: true })).toHaveCount(0);
  if (info.project.name === 'mobile') await page.getByRole('button', { name: 'Open navigation' }).click();
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav.getByRole('link', { name: 'Feedback & enquiries' })).toHaveCount(0);
});
