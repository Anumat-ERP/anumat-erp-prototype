import { expect, test, type Page } from '@playwright/test';
async function examples(page: Page, path = '/employees') {
  await page.goto(path);
  await page
    .getByRole('button', { name: 'Load HR examples', exact: true })
    .click();
  await expect(page.getByText('Load HR examples', { exact: true })).toHaveCount(
    0,
  );
}
async function choose(page: Page, name: string, option: string) {
  await page.getByRole('combobox', { name, exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}
async function action(
  page: Page,
  name: string,
  reason = 'Reviewed in prototype',
) {
  await page.getByRole('button', { name, exact: true }).click();
  const dialog = page.getByRole('dialog', { name, exact: true });
  await dialog
    .getByRole('textbox', { name: 'Action reason', exact: true })
    .fill(reason);
  await dialog
    .getByRole('button', { name: 'Confirm action', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}
async function stored(page: Page) {
  return page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    return root.spaces[root.active];
  });
}

test('all eight HR apps have their own dashboard, workspace, and team routes', async ({
  page,
}, info) => {
  await examples(page);
  for (const [app, name] of Object.entries({
    employees: 'Employee management',
    recruitment: 'Recruitment management',
    attendance: 'Attendance management',
    payroll: 'Payroll management',
    performance: 'Performance management',
    training: 'Training management',
    assets: 'Assets management',
    reports: 'Report management',
  })) {
    await page.goto(`/home?app=${app}`);
    await expect(
      page.getByRole('heading', { name, exact: true }),
    ).toBeVisible();
    await page
      .getByRole('link', { name: 'Open workspace', exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/${app}$`));
    await expect(
      (info.project.name === 'desktop' ? page.locator('.an-app-switch-sidebar') : page.getByRole('region', { name: 'Current app', exact: true })).getByText(name, { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(0);
  }
  await page.goto('/employees');
  await page.screenshot({
    path: `test-results/hr-directory-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'More actions', exact: true }).click();
  await page
    .getByRole('menuitem', { name: 'People & roles', exact: true })
    .click();
  await expect(page).toHaveURL(/\/employees\/people$/);
  await expect(
    page.getByRole('button', { name: 'Invite member', exact: true }),
  ).toBeVisible();
});

test('recruitment workflow hires and links the employee and onboarding tasks', async ({
  page,
}) => {
  await examples(page, '/recruitment?tab=applications');
  const name = 'សុភា សុខ · Sophea Sok';
  for (const op of [
    'Shortlist',
    'Record interview',
    'Issue offer',
    'Accept offer',
    'Hire & create onboarding',
  ]) {
    if (op === 'Issue offer') {
      await page.getByRole('button', {name,exact:true}).click();
      await page.getByRole('button',{name:'Request offer approval',exact:true}).click();
      const dialog=page.getByRole('dialog',{name:'Offer approval',exact:true});
      await dialog.getByRole('textbox',{name:'Offer terms',exact:true}).fill('Demo employment terms');
      await dialog.getByRole('button',{name:'Request offer approval',exact:true}).click();
      await page.evaluate(()=>{const root=JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);root.spaces[root.active].meId='alex';localStorage.setItem('anumat-hackathon-v1',JSON.stringify(root));});
      await page.goto('/recruitment?tab=offers');
      await page.getByRole('button',{name,exact:true}).click();
      await page.getByRole('textbox',{name:'Decision reason',exact:true}).fill('Reviewed independently');
      await page.getByRole('button',{name:'Approve offer',exact:true}).click();
      await page.evaluate(()=>{const root=JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);root.spaces[root.active].meId='dara';localStorage.setItem('anumat-hackathon-v1',JSON.stringify(root));});
      await page.goto('/recruitment?tab=applications');
    }
    await page.getByRole('button', { name, exact: true }).click();
    await action(page, op);
  }
  const state = await stored(page);
  const application = state.hr.applications[0];
  expect(application.status).toBe('hired');
  expect(
    state.hr.employees.find(
      (e: { id: string }) => e.id === application.employeeId,
    ).accountId,
  ).toBe('');
  await page.getByRole('button', { name, exact: true }).click();
  await page
    .getByRole('link', { name: 'Open hired employee', exact: true })
    .click();
  await expect(page).toHaveURL(/\/employees\?record=employee-/);
  await expect(page.getByRole('dialog', { name })).toBeVisible();
  await page.goto('/recruitment?tab=onboarding');
  await page.getByRole('link',{name:/Verify employment documents/}).click();
  await expect(page.getByRole('dialog',{name:'Task',exact:true})).toBeVisible();
});

test('employee import validates, reconciles, skips invalid rows and persists accepted records', async ({
  page,
}) => {
  await examples(page);
  await page.getByRole('button', { name: 'More actions', exact: true }).click();
  await page
    .getByRole('menuitem', { name: 'Import employees', exact: true })
    .click();
  const csv =
    'code,name,email,department,branch,position,startDate,salary,currency,leaveAllowance\nEMP-2001,"សុភា, Sok",sok@example.test,Operations,Phnom Penh,Coordinator,2026-01-05,650,USD,18\nEMP-2001,Duplicate,duplicate@example.test,Operations,Phnom Penh,Coordinator,2026-01-05,650,USD,18';
  await page
    .getByRole('textbox', { name: 'Paste employee CSV', exact: true })
    .fill(csv);
  await page
    .getByRole('button', { name: 'Validate import', exact: true })
    .click();
  await expect(
    page.getByText('1 ready · 1 skipped · 2 total', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Import 1 valid rows', exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'សុភា, Sok', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Duplicate', exact: true }),
  ).toHaveCount(0);
});

test('future employee changes preserve current pay and show why they cannot apply early', async ({
  page,
}, info) => {
  await examples(page);
  await page.getByRole('button', { name: 'Alex Tan', exact: true }).click();
  await page
    .getByRole('button', { name: 'Schedule employee change', exact: true })
    .click();
  const dialog = page.getByRole('dialog', {
    name: 'Schedule employee change',
    exact: true,
  });
  const future = new Date();
  future.setUTCDate(future.getUTCDate() + 7);
  await dialog
    .getByRole('textbox', { name: 'Effective date', exact: true })
    .fill(future.toISOString().slice(0, 10));
  await dialog
    .getByRole('textbox', { name: 'Position', exact: true })
    .fill('Senior operations coordinator');
  await dialog
    .getByRole('textbox', { name: 'Change reason', exact: true })
    .fill('Promotion next week');
  await dialog
    .getByRole('button', { name: 'Schedule change', exact: true })
    .click();
  await page.getByRole('button', { name: 'Alex Tan', exact: true }).click();
  await page
    .getByRole('button', { name: 'Apply effective change', exact: true })
    .click();
  await expect(
    page.getByText('This change is not effective yet.', { exact: true }),
  ).toBeVisible();
  const state = await stored(page);
  expect(
    state.hr.employees.find((e: { id: string }) => e.id === 'hr-alex').position,
  ).not.toBe('Senior operations coordinator');
  await page.screenshot({
    path: `test-results/hr-change-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  });
});

test('member sees only own employee records, no pay fields, and HR access is workspace isolated', async ({
  page,
}) => {
  await examples(page);
  await page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    const s = root.spaces[root.active];
    s.meId = 'lina';
    s.appMembers.employees = { ...s.appMembers.employees, lina: 'member' };
    localStorage.setItem('anumat-hackathon-v1', JSON.stringify(root));
  });
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Dara Sok', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Lina Park', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Lina Park', exact: true }).click();
  await expect(
    page.getByRole('spinbutton', {
      name: 'Illustrative base pay',
      exact: true,
    }),
  ).toHaveCount(0);
  await page.goto('/recruitment');
  await expect(
    page.getByRole('heading', {
      name: 'You do not have access to this app',
      exact: true,
    }),
  ).toBeVisible();
  await page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    root.active = 'mekong';
    localStorage.setItem('anumat-hackathon-v1', JSON.stringify(root));
  });
  await page.goto('/employees');
  await expect(
    page.getByRole('heading', {
      name: 'You do not have access to this app',
      exact: true,
    }),
  ).toBeVisible();
});

test('HR pages fit Khmer dark mode and invalid dates preserve the employee draft', async ({
  page,
}, info) => {
  await examples(page);
  await page.getByRole('button', { name: 'Add employee', exact: true }).click();
  const dialog = page.getByRole('dialog', {
    name: 'Add employee',
    exact: true,
  });
  await dialog
    .getByRole('textbox', { name: 'First working day', exact: true })
    .fill('2026-02-30');
  await dialog
    .getByRole('button', { name: 'Create record', exact: true })
    .click();
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole('textbox', { name: 'First working day', exact: true }),
  ).toHaveAttribute('aria-invalid', 'true');
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    localStorage.setItem('anumat-locale', 'km');
    localStorage.setItem('anumat-theme', 'dark');
  });
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'ការគ្រប់គ្រងបុគ្គលិក', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(0);
  await page.screenshot({
    path: `test-results/hr-khmer-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  });
});

test('global search finds permitted HR records and hides another employee from own scope', async ({
  page,
}) => {
  await examples(page);
  await page.keyboard.press('Control+k');
  const search = page.getByRole('combobox', {
    name: 'Search pages, requests and people',
    exact: true,
  });
  await search.fill('Sophea');
  await page.getByRole('option', { name: /Sophea/ }).click();
  await expect(page).toHaveURL(
    /\/recruitment\?tab=applications&record=hr-application$/,
  );
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    const s = root.spaces[root.active];
    s.meId = 'lina';
    s.appMembers.employees = { lina: 'member' };
    localStorage.setItem('anumat-hackathon-v1', JSON.stringify(root));
  });
  await page.goto('/employees');
  await page.keyboard.press('Control+k');
  await search.fill('Sophea');
  await expect(page.getByRole('option', { name: /Sophea/ })).toHaveCount(0);
});

test('payroll CSV preserves numeric adjustments and escapes formula-like employee names', async ({
  page,
}) => {
  const { readFile } = await import('node:fs/promises');
  await examples(page);
  await page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    const state = root.spaces[root.active],
      at = new Date().toISOString();
    state.hr.payroll.push({
      id: 'csv-preview',
      version: 4,
      status: 'frozen',
      createdAt: at,
      updatedAt: at,
      title: 'CSV export preview',
      startDate: at.slice(0, 10),
      endDate: at.slice(0, 10),
      currency: 'USD',
      adjustment: -5,
      reason: 'Illustrative correction',
      lines: [
        {
          employeeId: 'hr-alex',
          name: '=HYPERLINK("https://example.test")',
          currency: 'USD',
          base: 650,
          adjustment: -5,
          total: 645,
          attendanceHours: 8,
          leaveDays: 0,
          employeeVersion: 1,
        },
      ],
    });
    localStorage.setItem('anumat-hackathon-v1', JSON.stringify(root));
  });
  await page.goto('/payroll?record=csv-preview');
  const downloaded = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Export preview CSV', exact: true })
    .click();
  const download = await downloaded;
  const content = await readFile((await download.path())!, 'utf8');
  expect(content).toContain('"\'=HYPERLINK');
  expect(content).toContain(',"-5",');
  expect(content).not.toContain('"\'-5"');
});
