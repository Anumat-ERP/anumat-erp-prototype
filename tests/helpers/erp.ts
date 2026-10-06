import { readFile } from 'node:fs/promises';
import { expect, test as base, type Page } from '@playwright/test';
import type { DataState } from '../../src/data/types';
import { COLLECTION_APP, type HRCollection, type HRState } from '../../src/hr/types';

export const test = base.extend<{ runtimeErrors: void }>({
  runtimeErrors: [async ({ page, context }, use) => {
    const errors: string[] = [];
    const observe = (opened: Page) => opened.on('pageerror', error => errors.push(error.message));
    observe(page);
    context.on('page', observe);
    await use();
    expect.soft(errors, 'No unhandled browser errors during the workflow').toEqual([]);
  }, { auto: true }],
});

// Read-only assertions: all business records and reviewer changes go through the UI.
export async function state(page: Page): Promise<DataState & { hr: HRState }> {
  return page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    return root.spaces[root.active];
  });
}
export async function seed(page: Page) {
  // Keep business dates repeatable while allowing time (and generated IDs) to advance.
  await page.clock.install({ time: new Date('2026-10-05T03:00:00Z') });
  await page.goto('/home?app=employees');
  await page.getByRole('button', { name: 'Load HR examples', exact: true }).click();
  await expect.poll(async () => (await state(page)).hr.employees.length).toBe(4);
}
export async function actor(page: Page, name: 'Dara Sok' | 'Alex Tan') {
  await page.goto('/home?app=employees');
  await page.getByRole('button', { name: /^Account:/ }).click();
  await page.getByRole('menuitem', { name: new RegExp(name) }).click();
  await expect(page.getByRole('button', { name: new RegExp(`^Account: ${name}`) })).toBeVisible();
}
export async function choose(page: Page, label: string, value: string | RegExp) {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: value, exact: typeof value === 'string' }).click();
}
export async function time(page: Page, label: string, value: string) {
  const group = page.getByRole('group', { name: label, exact: true });
  const [hour, minute] = value.split(':');
  for (const [part, choice] of [['Hour', hour!], ['Minute', minute!]]) {
    await group.getByRole('combobox', { name: part, exact: true }).click();
    await page.getByRole('option', { name: choice, exact: true }).click();
  }
}
export async function open(page: Page, collection: HRCollection, id: string) {
  await page.goto(`/${COLLECTION_APP[collection]}?tab=${collection}&record=${id}`);
  await expect(page.getByRole('dialog')).toHaveCount(1);
}
export async function create(page: Page, collection: HRCollection) {
  await page.goto(`/${COLLECTION_APP[collection]}?tab=${collection}&create=1`);
  await expect(page.getByRole('dialog')).toHaveCount(1);
}
export async function save(page: Page, creating = true) {
  await page.getByRole('button', { name: creating ? 'Create record' : 'Save changes', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}
export async function action(page: Page, name: string, options: { error?: string; reason?: string } = {}) {
  const before = options.error ? await state(page) : undefined;
  await page.getByRole('button', { name, exact: true }).click();
  const dialog = page.getByRole('dialog', { name, exact: true });
  await dialog.getByRole('textbox', { name: name === 'Rehire employee' ? 'New start date and reason' : 'Action reason', exact: true })
    .fill(options.reason ?? 'Evidence checked during ERP acceptance');
  await dialog.getByRole('button', { name: 'Confirm action', exact: true }).click();
  if (options.error) {
    await expect(dialog.getByRole('alert')).toContainText(options.error);
    expect(await state(page)).toEqual(before);
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  } else {
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
}
export async function dates(page: Page, first = '2030-10-07', last = first) {
  await page.getByRole('textbox', { name: 'Period start', exact: true }).fill(first);
  await page.getByRole('textbox', { name: 'Period end', exact: true }).fill(last);
}
export async function csv(page: Page, button: string) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: button, exact: true }).click();
  const download = await pending;
  expect(await download.failure()).toBeNull();
  return { filename: download.suggestedFilename(), content: await readFile((await download.path())!, 'utf8') };
}
export async function employee(page: Page, name = 'ERP Acceptance Employee') {
  await create(page, 'employees');
  for (const [label, value] of Object.entries({
    'Employee code': 'ERP-9001', 'Full name': name, 'Work email': 'erp.acceptance@example.test',
    Department: 'Operations', Branch: 'Phnom Penh', Position: 'Coordinator', 'First working day': '2026-01-05',
  })) await page.getByRole(['Department','Branch'].includes(label) ? 'combobox' : 'textbox', { name: label, exact: true }).fill(value);
  await page.getByRole('spinbutton', { name: 'Illustrative base pay', exact: true }).fill('800');
  await save(page);
  return (await state(page)).hr.employees.find(e => e.email === 'erp.acceptance@example.test')!;
}
