import { expect, test, type Locator, type Page } from '@playwright/test';
async function choose(page: Page, control: Locator, label: string) { await control.click(); await page.getByRole('option', { name: label, exact: true }).click(); }

test('shared calendar selects dates, respects bounds, and restores keyboard focus', async ({ page }, info) => {
  await page.goto('/tasks');
  await page.getByRole('button', { name: 'Task options', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Create sprint', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Create sprint' });
  await editor.getByRole('textbox', { name: 'Sprint name' }).fill('Calendar sprint');
  await editor.getByRole('button', { name: 'Open calendar for Start date' }).click();
  let calendar = page.getByRole('dialog', { name: 'Choose date' });
  await choose(page, calendar.getByRole('combobox', { name: 'Year', exact: true }), '2026');
  await choose(page, calendar.getByRole('combobox', { name: 'Month', exact: true }), 'October');
  await calendar.locator('[data-day="2026-10-05"] button').click();
  await expect(editor.getByRole('textbox', { name: 'Start date', exact: true })).toHaveValue('2026-10-05');
  await expect(editor.getByRole('textbox', { name: 'End date', exact: true })).toHaveValue('2026-10-18');
  await expect(editor.getByRole('textbox', { name: 'Start date', exact: true })).toBeFocused();
  await editor.getByRole('textbox', { name: 'Start date', exact: true }).press('ArrowDown');
  calendar = page.getByRole('dialog', { name: 'Choose date' });
  await expect(calendar.locator('[data-day="2026-10-05"] button')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(calendar.locator('[data-day="2026-10-06"] button')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(editor.getByRole('textbox', { name: 'Start date', exact: true })).toBeFocused();
  await editor.getByRole('button', { name: 'Open calendar for End date' }).click();
  calendar = page.getByRole('dialog', { name: 'Choose date' });
  await expect(calendar.locator('[data-day="2026-10-04"] button')).toBeDisabled();
  await expect(calendar.locator('[data-day="2026-10-05"] button')).toBeEnabled();
  await page.screenshot({ path: `test-results/calendar-${info.project.name}.png`, animations: 'disabled' });
  await calendar.locator('[data-day="2026-10-12"] button').click();
  await editor.getByRole('button', { name: 'Save sprint', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Calendar sprint', exact: true })).toBeVisible();
});

test('typed dates validate real calendar days and block saving invalid input', async ({ page }) => {
  await page.goto('/tasks');
  await page.getByRole('button', { name: 'Task options', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Create sprint', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Create sprint' });
  await editor.getByRole('textbox', { name: 'Sprint name' }).fill('Leap-date sprint');
  await editor.getByRole('textbox', { name: 'Start date', exact: true }).fill('2026-02-31');
  await editor.getByRole('button', { name: 'Save sprint', exact: true }).click();
  await expect(editor.getByRole('alert')).toContainText('Enter a real date');
  await expect(editor.getByRole('textbox', { name: 'Start date', exact: true })).toBeFocused();
  await expect(editor.getByRole('textbox', { name: 'Start date', exact: true })).toHaveAttribute('aria-invalid', 'true');
  await editor.getByRole('textbox', { name: 'Start date', exact: true }).fill('2028-02-29');
  await expect(editor.getByRole('textbox', { name: 'End date', exact: true })).toHaveValue('2028-03-13');
  await editor.getByRole('button', { name: 'Save sprint', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Leap-date sprint', exact: true })).toBeVisible();
});

test('meeting time uses shared hour and minute selectors; the calendar is themed and translated', async ({ page }, info) => {
  await page.goto('/meetings/new');
  await choose(page, page.getByRole('combobox', { name: 'Hour', exact: true }), '14');
  await choose(page, page.getByRole('combobox', { name: 'Minute', exact: true }), '37');
  await expect(page.getByRole('combobox', { name: 'Hour', exact: true })).toContainText('14');
  await expect(page.getByRole('combobox', { name: 'Minute', exact: true })).toContainText('37');
  await expect(page.locator('input[type="time"], input[type="date"], select:not([aria-hidden="true"]):visible')).toHaveCount(0);
  await page.evaluate(() => { localStorage.setItem('anumat-locale', 'km'); localStorage.setItem('anumat-theme', 'dark'); });
  await page.goto('/tasks');
  await page.getByRole('button', { name: 'ជម្រើសការងារ', exact: true }).click();
  await page.getByRole('menuitem', { name: 'បង្កើតវគ្គការងារ', exact: true }).click();
  await page.getByRole('button', { name: /បើកប្រតិទិនសម្រាប់/ }).first().click();
  const calendar = page.getByRole('dialog', { name: 'ជ្រើសរើសកាលបរិច្ឆេទ' });
  await expect(calendar.getByRole('combobox', { name: 'ខែ', exact: true })).toBeVisible();
  await expect(calendar.getByRole('combobox', { name: 'ឆ្នាំ', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `test-results/calendar-km-dark-${info.project.name}.png`, animations: 'disabled' });
});
