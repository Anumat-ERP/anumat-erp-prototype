import { expect, test } from '@playwright/test';

test('Khmer translates seeded workflow content and form choices', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('anumat-locale', 'km'));
  await page.goto('/home');
  await expect(page.getByText('កុំព្យូទ័រយួរដៃសម្រាប់សមាជិកថ្មី', { exact: true }).first()).toBeVisible();
  await page.goto('/processes/proc-purchase');
  await expect(page.getByRole('heading', { name: 'ការអនុម័តការទិញ' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: /ប្រភេទចម្លើយ/ }).first()).toBeVisible();
  await expect(page.getByText('ជម្រើសច្រើន', { exact: true }).first()).toBeVisible();
  await page.goto('/tasks');
  await expect(page.getByText('កំណត់តំបន់ឃ្លាំងសម្រាប់សាកល្បងរាប់ស្តុក', { exact: true }).first()).toBeVisible();
});

test('requests support search, clearing, filtering and view tabs', async ({
  page,
}) => {
  await page.goto('/requests');
  await expect(page.getByRole('button', { name: 'New request', exact: true })).toHaveCSS('background-color', 'rgb(40, 95, 240)');
  await expect(
    page.getByRole('heading', { name: 'Requests', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('searchbox', { name: 'Search requests' })
    .fill('Laptops');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(12);
  await page
    .getByRole('group', { name: 'Filters', exact: true })
    .getByRole('button', { name: 'Status', exact: true })
    .click();
  await page.getByRole('checkbox', { name: 'Approved', exact: true }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Approved', exact: true }),
  ).toBeChecked();
  await page.keyboard.press('Escape');
  await expect(page.locator('tbody tr')).toHaveCount(4);
  await page.getByRole('button', { name: 'Clear all', exact: true }).click();
  await page
    .getByRole('tab', { name: 'Submitted by you', exact: true })
    .click();
  await expect(page.locator('tbody tr')).toHaveCount(2);
});

test('new request submission keeps values and demo persistence', async ({
  page,
}) => {
  await page.goto('/requests/new?demo=laptops');
  await page
    .getByRole('textbox', { name: 'Title', exact: false })
    .fill('Material UI request smoke test');
  await page
    .getByRole('button', { name: 'Submit for approval', exact: true })
    .click();
  await expect(page).toHaveURL(/\/requests\/PR-\d+/);
  await expect(
    page.getByRole('heading', {
      name: 'Material UI request smoke test',
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', {
      name: 'Material UI request smoke test',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText('Quote_Supplier_A.pdf', { exact: true }),
  ).toBeVisible();
});

test('approval dialog validates required comments, then persists the decision', async ({
  page,
}) => {
  await page.goto('/requests/LV-2031');
  await page
    .getByRole('button', { name: 'Request changes', exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Request changes' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Send back', exact: true }).click();
  await expect(
    dialog.getByText(/Say what needs to change, so the requester can fix it\./),
  ).toBeVisible();
  await dialog
    .getByRole('textbox', { name: 'What needs to change?', exact: false })
    .fill('Please confirm the leave dates.');
  await dialog.getByRole('button', { name: 'Send back', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByText('Changes requested', { exact: true }).first(),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText('Please confirm the leave dates.', { exact: false }).first(),
  ).toBeVisible();
});

test('bulk approval selects the visible rows and updates the queue', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === 'mobile',
    'Mobile uses individual request cards.',
  );
  await page.goto('/approvals');
  await page
    .getByRole('checkbox', { name: 'Select all 4 requests on this page' })
    .check();
  await expect(page.getByText('4 selected', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'All caught up', exact: true }),
  ).toBeVisible();
});

test('preset marketplace installs an independent paused process', async ({
  page,
}) => {
  await page.goto('/processes');
  await page
    .getByRole('tab', { name: 'Preset marketplace', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Start with an approval preset' }),
  ).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Search presets' })
    .fill('Business travel');
  await page.getByRole('button', { name: /^Business travel/ }).click();
  await page
    .getByRole('button', { name: 'Use this preset', exact: true })
    .click();
  await expect(page.getByText(/Choose an approver\./)).toHaveCount(2);
  for (const select of await page
    .getByRole('combobox', { name: /^(1|2)\./ })
    .all()) {
    await select.click();
    await page.getByRole('option').filter({ hasNotText: 'Choose an approver…' }).first().click();
  }
  await page
    .getByRole('button', { name: 'Use this preset', exact: true })
    .click();
  await expect(page).toHaveURL(/\/processes\/(?!\?)[^/]+/);
  await expect(page.getByRole('textbox', { name: 'Request type name', exact: true }).first()).toHaveValue(
    'Business travel',
  );
  const paused = await page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    return root.spaces[root.active].processes.find(
      (p: { name: string }) => p.name === 'Business travel',
    )?.active;
  });
  expect(paused).toBe(false);
});

test('account menu works by keyboard and restores trigger focus', async ({
  page,
}) => {
  await page.goto('/home');
  const trigger = page.getByRole('button', { name: /^Account:/ });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menu')).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /Dara Sok/ })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: /Alex Tan/ })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole('menuitem', { name: /Alex Tan/ }).click();
  await expect(
    page.getByRole('button', { name: /^Account: Alex Tan/ }),
  ).toBeVisible();
});

test('dark theme, Khmer and mobile navigation stay usable', async ({
  page,
}, testInfo) => {
  await page.goto('/home');
  await page.getByRole('button', { name: /^Account:/ }).click();
  await page.getByRole('menuitem', { name: 'Dark theme', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page
    .getByRole('combobox', { name: 'Language', exact: true })
    .click();
  await page.getByRole('option', { name: 'ខ្មែរ' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'km');
  if (testInfo.project.name === 'mobile') {
    await page
      .getByRole('button', { name: 'បើកការរុករក', exact: true })
      .click();
    await expect(page.locator('.MuiDrawer-paper')).toBeVisible();
    await page.locator('.MuiDrawer-paper a[href="/requests"]').click();
    await expect(page).toHaveURL('/requests');
    await expect(page.locator('.MuiDrawer-paper')).not.toBeVisible();
  }
  const overflow = await page.evaluate(
    () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > window.innerWidth,
  );
  expect(overflow).toBe(false);
  const utilities = await page.locator('.an-utilities').boundingBox();
  expect(utilities!.x + utilities!.width).toBeLessThanOrEqual(testInfo.project.use.viewport!.width);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('lang', 'km');
});

test('task owner select exposes grouped choices and supports keyboard dismissal', async ({ page }) => {
  await page.goto('/tasks');
  const owner = page.getByRole('combobox', { name: 'Whose tasks' });
  await owner.click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await expect(page.getByRole('option', { name: 'Priya Shah' })).toBeVisible();
  await page.getByRole('option', { name: 'Priya Shah' }).click();
  await expect(owner).toContainText('Priya Shah');
  await owner.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).not.toBeVisible();
  await expect(owner).toBeFocused();
});

test('all prototype routes render without runtime errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const route of [
    '/',
    '/signin',
    '/welcome',
    '/pricing',
    '/home',
    '/requests',
    '/approvals',
    '/processes',
    '/processes/proc-purchase',
    '/settings/people',
    '/settings/notifications',
    '/insights',
    '/tasks',
    '/meetings',
    '/documents',
    '/surveys',
    '/support',
    '/telegram',
  ]) {
    await page.goto(route);
    await expect(page.locator('#root')).not.toBeEmpty();
    await expect(page.getByRole('heading').first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('dashboard request links keep the personal scope and status on reload', async ({ page }) => {
  await page.goto('/home');
  const personal = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Your requests', exact: true }) });
  await personal.getByRole('link', { name: 'View all', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Submitted by you', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await page.reload();
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await page.goto('/home');
  await personal.getByRole('link', { name: 'Drafts' }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText('Warehouse barcode scanners');
});

test('page actions and workspace utilities remain separately clickable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Mobile utilities use a separate header.');
  for (const width of [1440, 1100, 900]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/requests');
    const action = await page.getByRole('button', { name: 'New request', exact: true }).boundingBox();
    const tools = await page.locator('.an-utilities').boundingBox();
    expect(action).not.toBeNull();
    expect(tools).not.toBeNull();
    const overlaps = action!.x < tools!.x + tools!.width && action!.x + action!.width > tools!.x && action!.y < tools!.y + tools!.height && action!.y + action!.height > tools!.y;
    expect(overlaps).toBe(false);
  }
});

test('workspace setup validates the company and processes before creating a workspace', async ({ page }) => {
  await page.goto('/welcome');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText(/Enter your company’s name. You can change it later\./)).toBeVisible();
  await page.getByRole('textbox', { name: 'Company name', exact: false }).fill('Quay Operations');
  await page.getByRole('combobox', { name: 'Company size', exact: false }).click();
  await page.getByRole('option', { name: /1–49/ }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Invite your team', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Choose how things get approved', exact: true })).toBeVisible();
  for (const checkbox of await page.getByRole('checkbox').all()) await checkbox.uncheck();
  await page.getByRole('button', { name: 'Create workspace', exact: true }).click();
  await expect(page.getByText('Turn on at least one process, so requests have somewhere to go.', { exact: true })).toBeVisible();
  await page.getByRole('checkbox').first().check();
  await page.getByRole('button', { name: 'Create workspace', exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);
  await page.reload();
  if (page.viewportSize()!.width < 768) await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Workspace: Quay Operations. Switch workspace', exact: true })).toBeVisible();
});

test('login validates fields, reveals password, verifies code and remembers only email', async ({ page }) => {
  await page.goto('/signin');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByText(/Enter the email you use for work/)).toBeVisible();
  await page.getByRole('textbox', { name: 'Email address' }).fill('alex@example.com');
  await page.getByLabel(/^Password/).fill('demo-password');
  await page.getByRole('button', { name: 'Show password', exact: true }).click();
  await expect(page.getByLabel(/^Password/)).toHaveAttribute('type', 'text');
  await page.getByRole('checkbox', { name: 'Remember me' }).check();
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByRole('heading', { name: /6-digit code/ })).toBeFocused();
  await page.getByRole('textbox', { name: 'Digit 1 of 6' }).fill('999999');
  await page.getByRole('button', { name: 'Verify code', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Wrong verification code');
  await page.getByRole('textbox', { name: 'Digit 1 of 6' }).fill('123456');
  await page.getByRole('button', { name: 'Verify code', exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole('heading', { name: /Alex/ })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('anumat-demo-email'))).toBe('alex@example.com');
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('demo-password');
  await page.goto('/signin');
  await expect(page.getByRole('textbox', { name: 'Email address' })).toHaveValue('alex@example.com');
  await expect(page.getByLabel(/^Password/)).toHaveValue('');
});

test('recovery validates confirmation and returns to demo login', async ({ page }) => {
  await page.goto('/signin');
  await page.getByRole('button', { name: 'Forgot password?', exact: true }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('priya@example.com');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText(/This prototype sends no email/)).toBeVisible();
  await page.getByRole('button', { name: 'Open demo reset link' }).click();
  await page.getByLabel(/^New password/).fill('demo-reset-password');
  await page.getByLabel(/^Confirm password/).fill('mismatch');
  await page.getByRole('button', { name: 'Reset password', exact: true }).click();
  await expect(page.getByText(/The passwords do not match/)).toBeVisible();
  await page.getByLabel(/^Confirm password/).fill('demo-reset-password');
  await page.getByRole('button', { name: 'Reset password', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You’re ready to log in' })).toBeVisible();
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back!' })).toBeVisible();
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('demo-reset-password');
});

test('SSO demo supports code paste, replacement and keyboard correction', async ({ page }) => {
  await page.goto('/signin');
  await page.getByRole('button', { name: 'Log in with SSO', exact: true }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('sokha@example.com');
  await page.getByRole('button', { name: 'Continue with SSO' }).click();
  const first = page.getByRole('textbox', { name: 'Digit 1 of 6' });
  await first.evaluate(element => {
    const clipboardData = new DataTransfer(); clipboardData.setData('text', '123 456');
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
  });
  await expect(page.getByRole('textbox', { name: 'Digit 6 of 6' })).toHaveValue('6');
  await page.getByRole('textbox', { name: 'Digit 6 of 6' }).press('Backspace');
  await page.getByRole('textbox', { name: 'Digit 6 of 6' }).press('Backspace');
  await expect(page.getByRole('textbox', { name: 'Digit 5 of 6' })).toBeFocused();
  await page.getByRole('textbox', { name: 'Digit 5 of 6' }).fill('56');
  await page.getByRole('button', { name: 'Verify code' }).click();
  await expect(page.getByRole('heading', { name: /Sokha/ })).toBeVisible();
});
