import { expect, test, type Locator, type Page } from '@playwright/test';
async function choose(page: Page, trigger: Locator, label: string) { await trigger.click(); await page.getByRole('option', { name: label, exact: true }).click(); }
async function saved(page: Page) { return page.evaluate(() => { const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!); return root.spaces[root.active]; }); }
async function create(page: Page, title: string, priority = 'Medium', type = 'Task') {
  await page.getByRole('button', { name: 'New task', exact: true }).first().click();
  const editor = page.getByRole('dialog', { name: 'New task', exact: true });
  await editor.getByRole('textbox', { name: 'Task', exact: true }).fill(title);
  await choose(page, editor.getByRole('combobox', { name: 'Priority', exact: true }), priority);
  if (type !== 'Task') await choose(page, editor.getByRole('combobox', { name: 'Work item type', exact: true }), type);
  return editor;
}

test('full editor persists formatting, rich descriptions, priorities, and supports filtering', async ({ page }, info) => {
  await page.goto('/tasks');
  let dialog = await create(page, 'Deliver the onboarding portal', 'Highest', 'Epic');
  const description = dialog.getByRole('textbox', { name: 'Description', exact: true });
  await description.fill('Customer onboarding');
  await description.press('ControlOrMeta+A');
  await dialog.getByRole('button', { name: 'Heading', exact: true }).click();
  await expect(description.locator('h2')).toContainText('Customer onboarding');
  await description.press('ArrowRight');
  await description.press('Enter');
  await dialog.getByRole('button', { name: 'Bold', exact: true }).click();
  await description.pressSequentially('Deliver a clear welcome experience.');
  await dialog.getByRole('button', { name: 'Bold', exact: true }).click();
  await description.press('Enter');
  await dialog.getByRole('button', { name: 'Bullet list', exact: true }).click();
  await description.pressSequentially('Provide first-day instructions');
  await expect(description.locator('h2')).toContainText('Customer onboarding');
  await expect(description.locator('strong')).toContainText('Deliver a clear');
  await expect(description.locator('li')).toContainText('Provide first-day');
  await dialog.getByRole('button', { name: 'Add task', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Deliver the onboarding portal', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Task', exact: true });
  await expect(dialog.getByRole('combobox', { name: 'Priority', exact: true })).toContainText('Highest');
  await expect(dialog.getByRole('textbox', { name: 'Description', exact: true }).locator('h2')).toContainText('Customer onboarding');
  await dialog.getByRole('textbox', { name: 'Task', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `test-results/work-item-editor-${info.project.name}.png`, animations: 'disabled' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  const item = (await saved(page)).tasks.find((item: { title: string }) => item.title === 'Deliver the onboarding portal');
  expect(item.priority).toBe('highest'); expect(item.workType).toBe('epic'); expect(item.description.type).toBe('doc'); expect(item.notes).toContain('first-day instructions');
  await page.getByRole('button', { name: 'More filters' }).click();
  await choose(page, page.getByRole('combobox', { name: 'Priority filter', exact: true }), 'Highest');
  await expect(page.getByRole('button', { name: 'Deliver the onboarding portal', exact: true })).toBeVisible();
  await choose(page, page.getByRole('combobox', { name: 'Priority filter', exact: true }), 'Low');
  await expect(page.getByRole('button', { name: 'Deliver the onboarding portal', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('tab', { name: 'Board', exact: true }).click();
  await expect(page.getByText('Highest', { exact: true })).toBeVisible();
});

test('links reject unsafe URLs, cancel discards edits, and legacy notes remain editable', async ({ page }) => {
  await page.goto('/tasks');
  let dialog = await create(page, 'Link verification', 'High');
  let description = dialog.getByRole('textbox', { name: 'Description', exact: true });
  await description.fill('Project documentation');
  await description.press('ControlOrMeta+A');
  await dialog.getByRole('button', { name: 'Insert link', exact: true }).click();
  await dialog.getByRole('textbox', { name: 'Link address', exact: true }).fill('javascript:alert(1)');
  await dialog.getByRole('button', { name: 'Apply link', exact: true }).click();
  await expect(dialog.getByText('Enter an http, https, or email link.')).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Link address', exact: true }).fill('https://example.com/project');
  await dialog.getByRole('button', { name: 'Apply link', exact: true }).click();
  await expect(description.locator('a')).toHaveAttribute('href', 'https://example.com/project');
  await dialog.getByRole('button', { name: 'Add task', exact: true }).click();
  await page.getByRole('button', { name: 'Link verification', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Task', exact: true });
  await dialog.getByRole('textbox', { name: 'Description', exact: true }).fill('Unsaved replacement');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.evaluate(() => {
    const key = 'anumat-hackathon-v1'; const root = JSON.parse(localStorage.getItem(key)!);
    const item = root.spaces[root.active].tasks.find((item: { title: string }) => item.title === 'Link verification');
    delete item.description; delete item.priority; item.notes = 'Existing notes\n<script>plain text</script>';
    localStorage.setItem(key, JSON.stringify(root));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Link verification', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Task', exact: true });
  description = dialog.getByRole('textbox', { name: 'Description', exact: true });
  await expect(description).toContainText('Existing notes');
  await expect(description).toContainText('<script>plain text</script>');
  await expect(description.locator('script')).toHaveCount(0);
  await expect(dialog.getByRole('combobox', { name: 'Priority', exact: true })).toContainText('Medium');
  await description.press('ControlOrMeta+End'); await description.pressSequentially(' Updated');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  const item = (await saved(page)).tasks.find((item: { title: string }) => item.title === 'Link verification');
  expect(item.description.type).toBe('doc'); expect(item.notes).toContain('Updated');
});

test('read-only members see rich descriptions and Khmer dark mode retains a usable full editor', async ({ page }, info) => {
  await page.goto('/tasks');
  let dialog = await create(page, 'Workspace architecture', 'Low', 'Story');
  await dialog.getByRole('textbox', { name: 'Description', exact: true }).fill('Architecture and ownership notes');
  await dialog.getByRole('button', { name: 'Add task', exact: true }).click();
  await page.getByRole('button', { name: /^Account:/ }).click();
  await page.getByRole('menuitem', { name: /Alex Tan/ }).click();
  await choose(page, page.getByRole('combobox', { name: 'Whose tasks' }), 'Everyone');
  await page.getByRole('button', { name: 'Workspace architecture', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Task', exact: true });
  await expect(dialog.getByRole('textbox', { name: 'Description', exact: true })).toHaveAttribute('contenteditable', 'false');
  await expect(dialog.getByRole('textbox', { name: 'Description', exact: true })).toContainText('Architecture and ownership notes');
  await expect(dialog.getByRole('toolbar', { name: 'Description formatting' })).toHaveCount(0);
  await expect(dialog.getByRole('combobox', { name: 'Priority', exact: true })).toBeDisabled();
  await expect(dialog.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Close', exact: true }).last().click();
  await page.evaluate(() => { localStorage.setItem('anumat-locale', 'km'); localStorage.setItem('anumat-theme', 'dark'); });
  await page.reload();
  await choose(page, page.getByRole('combobox', { name: 'ភារកិច្ចរបស់អ្នកណា' }), 'គ្រប់គ្នា');
  await page.getByRole('button', { name: 'Workspace architecture', exact: true }).click();
  dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('textbox', { name: 'សេចក្តីពណ៌នា', exact: true })).toContainText('Architecture and ownership notes');
  await page.screenshot({ path: `test-results/work-item-km-dark-${info.project.name}.png`, animations: 'disabled' });
  await dialog.getByRole('button', { name: 'ទៅព័ត៌មានលម្អិត', exact: true }).click();
  await expect(dialog.getByRole('complementary', { name: 'ព័ត៌មានលម្អិតការងារ' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});
