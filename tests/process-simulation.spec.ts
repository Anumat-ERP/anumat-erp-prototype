import { expect, test, type Page } from '@playwright/test';
import { km } from '../src/i18n/messages';

async function createFlow(page: Page) {
  await page.goto('/processes');
  await page.getByRole('button', { name: 'New process' }).first().click();
  await page.evaluate(() => {
    const key = 'anumat-hackathon-v1'; const root = JSON.parse(localStorage.getItem(key)!);
    const process = root.spaces[root.active].processes.at(-1);
    process.steps.push({ id: 'finance-review', name: 'Finance review', role: 'Finance', approverId: 'priya', slaHours: 24, minAmount: 1000 });
    localStorage.setItem(key, JSON.stringify(root));
  });
  await page.reload();
  await page.getByRole('tab', { name: 'Preview & check' }).click();
}

test('simulation follows approval, return and decline outcomes without creating requests', async ({ page }, info) => {
  await createFlow(page);
  const simulator = page.getByRole('region', { name: 'Approval flow simulation', exact: true });
  await simulator.getByRole('button', { name: 'Start simulation', exact: true }).click();
  await expect(simulator.getByRole('status')).toContainText('waiting for Dara Sok');
  await simulator.getByRole('button', { name: 'Simulate approval', exact: true }).click();
  await expect(simulator.getByRole('status')).toContainText('waiting for Priya Shah');
  await simulator.getByRole('tab', { name: 'List', exact: true }).click();
  await expect(simulator.locator('li[data-state="current"]')).toContainText('Finance review');
  await simulator.getByRole('button', { name: 'Simulate approval', exact: true }).click();
  await expect(simulator.getByRole('status')).toHaveText('Simulation: request approved');
  await simulator.getByRole('button', { name: 'Try again', exact: true }).click();
  await simulator.getByRole('button', { name: 'Start simulation', exact: true }).click();
  await simulator.getByRole('button', { name: 'Simulate send back', exact: true }).click();
  await expect(simulator.getByRole('status')).toHaveText('Simulation: returned to the requester');
  await simulator.getByRole('button', { name: 'Try again', exact: true }).click();
  await simulator.getByRole('button', { name: 'Start simulation', exact: true }).click();
  await simulator.getByRole('button', { name: 'Simulate decline', exact: true }).click();
  await expect(simulator.getByRole('status')).toHaveText('Simulation: request declined');
  await page.getByRole('textbox', { name: 'Request amount', exact: true }).fill('100');
  await expect(simulator.getByRole('status')).toHaveText('Ready to simulate');
  await simulator.getByRole('button', { name: '1 steps skipped by these inputs' }).click();
  await expect(simulator.getByText('Finance review', { exact: true })).toBeVisible();
  await simulator.getByRole('button', { name: 'Start simulation', exact: true }).click();
  await simulator.getByRole('button', { name: 'Simulate approval', exact: true }).click();
  await expect(simulator.getByRole('status')).toHaveText('Simulation: request approved');
  expect(await page.evaluate(() => { const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!); return root.spaces[root.active].requests.length; })).toBe(0);
  await page.getByRole('textbox', { name: 'Request amount', exact: true }).fill('2000');
  await simulator.getByRole('button', { name: 'Start simulation', exact: true }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await simulator.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `test-results/process-simulation-${info.project.name}.png`, animations: 'disabled' });
});

test('Khmer translates simulation controls and dynamic builder errors in dark mode', async ({ page }, info) => {
  await createFlow(page);
  await page.evaluate(() => { localStorage.setItem('anumat-locale', 'km'); localStorage.setItem('anumat-theme', 'dark'); });
  await page.reload();
  await page.getByRole('tab', { name: km['Preview & check'], exact: true }).click();
  const simulator = page.getByRole('region', { name: km['Approval flow simulation'], exact: true });
  await simulator.getByRole('button', { name: km['Start simulation'], exact: true }).click();
  await expect(simulator.getByRole('status')).toContainText('កំពុងរង់ចាំ Dara Sok');
  await simulator.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `test-results/process-simulation-km-${info.project.name}.png`, animations: 'disabled' });
  await page.getByRole('tab', { name: km['Details'], exact: true }).click();
  await page.getByRole('textbox', { name: km['Request type name'], exact: true }).fill('');
  await page.getByRole('button', { name: km['Save process'], exact: true }).first().click();
  await expect(page.getByText(km['Give the request type a name.'], { exact: true }).first()).toBeVisible();
  await page.getByRole('tab', { name: km['Request form'], exact: true }).click();
  await page.getByRole('button', { name: `${km['Add']} ${km['field']}`, exact: true }).click();
  await page.getByRole('menuitem', { name: km['Short answer'], exact: true }).click();
  await page.getByRole('tab', { name: km['Preview & check'], exact: true }).click();
  await expect(page.getByText('ទម្រង់សំណើ៖ សំណួរ 1 ត្រូវការអត្ថបទសំណួរ។', { exact: true })).toBeVisible();
});
