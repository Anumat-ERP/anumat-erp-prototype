import { expect, test } from '@playwright/test';
import { FIELDS } from '../src/hr/catalog';
import { FIELD_GROUPS } from '../src/hr/WorkspaceGuide';

test('every collection keeps all of its fields in the grouped editor', () => {
  for (const collection of Object.keys(FIELDS) as (keyof typeof FIELDS)[]) {
    const keys = FIELD_GROUPS[collection].flatMap(group => group.keys);
    expect(new Set(keys).size).toBe(keys.length);
    expect([...keys].sort()).toEqual(FIELDS[collection].map(field => field.key).sort());
  }
});

test('record sorting, attention filters and pagination work across reload and record closure', async ({ page }) => {
  await page.goto('/employees');
  await page.getByRole('button', { name: 'Load HR examples', exact: true }).click();
  await page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    const state = root.spaces[root.active];
    const model = state.hr.employees[0];
    state.hr.employees = Array.from({ length: 45 }, (_, i) => ({ ...model, id: `batch-${i}`, code: `B-${i}`, accountId: '', name: `Batch employee ${String(i + 1).padStart(2, '0')}`, status: i < 5 ? 'probation' : 'active' }));
    localStorage.setItem('anumat-hackathon-v1', JSON.stringify(root));
  });
  await page.reload();
  await page.getByRole('combobox', { name: 'Sort records', exact: true }).click();
  await page.getByRole('option', { name: 'Name A–Z', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Batch employee 01', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Batch employee 21', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await page.reload();
  await page.getByRole('button', { name: 'Batch employee 21', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).last().click();
  await expect(page).toHaveURL(/page=2/);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: /^Needs attention/ }).click();
  await expect(page).not.toHaveURL(/page=/);
  await expect(page.getByRole('button', { name: 'Batch employee 01', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Batch employee 06', exact: true })).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'Search records', exact: true }).fill('does not exist');
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Batch employee 06', exact: true })).toBeVisible();
});

test('new and existing forms preserve edits when closing and explain missing prerequisites', async ({ page }) => {
  await page.goto('/attendance?create=1');
  await expect(page.getByText('Add the required records first', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create record', exact: true })).toBeDisabled();
  await page.goto('/employees?create=1');
  const editor = page.getByRole('dialog', { name: 'Add employee', exact: true });
  await expect(editor.getByRole('region', { name: 'Identity & contact', exact: true })).toBeVisible();
  await editor.getByRole('textbox', { name: 'Full name', exact: true }).fill('Unsaved person');
  await page.keyboard.press('Escape');
  const discard = page.getByRole('dialog', { name: 'Discard unsaved changes?', exact: true });
  await expect(discard).toBeVisible();
  await discard.getByRole('button', { name: 'Keep editing', exact: true }).click();
  await expect(editor.getByRole('textbox', { name: 'Full name', exact: true })).toHaveValue('Unsaved person');
  await editor.getByRole('button', { name: 'Close', exact: true }).last().click();
  await discard.getByRole('button', { name: 'Discard changes', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Load HR examples', exact: true }).click();
  await page.getByRole('button', { name: 'Dara Sok', exact: true }).click();
  await page.getByRole('textbox', { name: 'Full name', exact: true }).fill('Unsaved update');
  await expect(page.getByRole('button', { name: 'Complete offboarding', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await discard.getByRole('button', { name: 'Discard changes', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Dara Sok', exact: true })).toBeVisible();
});

for (const [workspace, route, label, record] of [
  ['employee', '/employees?view=attention', 'Search records', 'Dara Sok'],
  ['candidate pipeline', '/recruitment?tab=pipeline&stage=applied', 'Search candidates', 'សុភា សុខ · Sophea Sok'],
  ['job description', '/recruitment?tab=positions&status=active', 'Search records', 'Operations coordinator'],
] as const) {
  test(`clearing ${workspace} filters cancels a search that has not settled yet`, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-05T03:00:00Z') });
    await page.goto('/employees');
    await page.getByRole('button', { name: 'Load HR examples', exact: true }).click();
    await page.goto(route);
    // Hold browser time so Clear filters wins the race against a pending search.
    await page.clock.pauseAt(new Date('2026-10-05T03:01:00Z'));
    const search = page.getByRole('searchbox', { name: label, exact: true });
    await search.fill('does not exist');
    await page.getByRole('button', { name: 'Clear filters', exact: true }).first().click();
    await page.clock.runFor(500);
    await expect(search).toHaveValue('');
    await expect(page).not.toHaveURL(/[?&](q|view|status|stage|page)=/);
    await expect(page.getByRole('main').getByText(record, { exact: true })).toBeVisible();
    await page.reload();
    await expect(search).toHaveValue('');
    await expect(page.getByRole('main').getByText(record, { exact: true })).toBeVisible();
  });
}
