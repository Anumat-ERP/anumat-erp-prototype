import { expect, test, type Page } from '@playwright/test';
async function examples(page: Page) {
  await page.goto('/home?app=employees');
  await page.getByRole('button', { name: 'Load HR examples', exact: true }).click();
}
async function choose(page: Page, label: string, value: string | RegExp) {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: value, exact: typeof value === 'string' }).click();
}
async function stored(page: Page) {
  return page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    return root.spaces[root.active];
  });
}
async function persona(page: Page, id: string, route: string) {
  await page.evaluate(id => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    root.spaces[root.active].meId = id;
    localStorage.setItem('anumat-hackathon-v1', JSON.stringify(root));
  }, id);
  await page.goto(route);
}
async function action(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true }).click();
  const dialog = page.getByRole('dialog', { name, exact: true });
  await dialog.getByRole('textbox', { name: 'Action reason', exact: true }).fill('Reviewed evidence in the prototype');
  await dialog.getByRole('button', { name: 'Confirm action', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}
async function save(page: Page, creating = true) {
  await page.getByRole('button', { name: creating ? 'Create record' : 'Save changes', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}
async function dates(page: Page, first = '2030-10-07', last = first) {
  await page.getByRole('textbox', { name: 'Period start', exact: true }).fill(first);
  await page.getByRole('textbox', { name: 'Period end', exact: true }).fill(last);
}

test('nine dashboards have working entry points and HR filters persist in URLs', async ({ page }, info) => {
  await examples(page);
  for (const [app, title, create] of [
    ['employees', 'Employee management', 'Add employee'],
    ['attendance', 'Attendance management', 'Record shift'],
    ['payroll', 'Payroll management', 'Create pay period'],
    ['performance', 'Performance management', 'Create performance review'],
    ['training', 'Training management', 'Create course'],
    ['assets', 'Assets management', 'Add asset'],
    ['reports', 'Report management', 'Create report'],
  ]) {
    await page.goto(`/home?app=${app}`);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Workflow summary', exact: true })).toBeVisible();
    await page.getByRole('link', { name: create, exact: true }).click();
    await expect(page.getByRole('dialog', { name: create, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  }
  await page.goto('/home?app=employees');
  await page.getByRole('link', { name: /On probation/ }).click();
  await expect(page).toHaveURL(/status=probation/);
  await expect(page.getByRole('combobox', { name: 'Status', exact: true })).toContainText('Probation');
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Status', exact: true })).toContainText('Probation');
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search records', exact: true }).fill('missing employee');
  await expect(page.getByRole('heading', { name: 'No matching records', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Dara Sok', exact: true })).toBeVisible();
  for (const [app, title] of [['meetings', 'Meetings dashboard'], ['surveys', 'Surveys & evaluations dashboard']]) {
    await page.goto(`/home?app=${app}`);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  }
  await page.goto('/home?app=attendance');
  await page.screenshot({ path: `/tmp/anumat-app-workflows/attendance-${info.project.name}.png`, fullPage: true, animations: 'disabled' });
  await page.evaluate(() => { localStorage.setItem('anumat-locale', 'km'); localStorage.setItem('anumat-theme', 'dark'); });
  for (const app of ['employees', 'attendance', 'payroll', 'performance', 'training', 'assets', 'reports', 'surveys', 'meetings']) {
    await page.goto(`/home?app=${app}`);
    await expect(page.locator('main h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  }
  await page.screenshot({ path: `/tmp/anumat-app-workflows/meetings-km-dark-${info.project.name}.png`, fullPage: true, animations: 'disabled' });
});

test('attendance and payroll complete submission, independent review, closure, freeze and export', async ({ page }) => {
  await examples(page);
  await page.goto('/home?app=attendance');
  await page.getByRole('link', { name: 'Record shift', exact: true }).click();
  await choose(page, 'Employee', /Alex Tan/);
  await page.getByRole('textbox', { name: 'Shift date', exact: true }).fill('2030-10-07');
  await save(page);
  let shift = (await stored(page)).hr.attendance[0];
  await page.goto(`/attendance?tab=attendance&record=${shift.id}`);
  await action(page, 'Submit for review');
  await page.goto(`/attendance?tab=attendance&record=${shift.id}`);
  await action(page, 'Approve');
  await page.goto('/home?app=attendance');
  await page.getByRole('link', { name: 'Create attendance period', exact: true }).click();
  await page.getByRole('textbox', { name: 'Period name', exact: true }).fill('October attendance');
  await dates(page); await save(page);
  const period = (await stored(page)).hr.attendancePeriods[0];
  await page.goto(`/attendance?tab=attendancePeriods&record=${period.id}`);
  await action(page, 'Close attendance period');
  expect((await stored(page)).hr.attendancePeriods[0].snapshot).toHaveLength(1);
  await page.goto('/home?app=payroll');
  await page.getByRole('link', { name: 'Create pay period', exact: true }).click();
  await page.getByRole('textbox', { name: 'Period name', exact: true }).fill('October pay preview');
  await dates(page);
  await page.getByRole('textbox', { name: 'Calculation note', exact: true }).fill('Demonstrate independently reviewed payroll');
  await save(page);
  let payroll = (await stored(page)).hr.payroll[0];
  await page.goto(`/payroll?record=${payroll.id}`);
  await action(page, 'Prepare preview');
  await persona(page, 'alex', `/payroll?record=${payroll.id}`);
  await action(page, 'Independent review');
  await persona(page, 'dara', `/payroll?record=${payroll.id}`);
  await action(page, 'Freeze period');
  payroll = (await stored(page)).hr.payroll[0];
  expect(payroll.status).toBe('frozen'); expect(payroll.lines.length).toBeGreaterThan(0);
  await page.goto(`/payroll?record=${payroll.id}`);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export preview CSV', exact: true }).click();
  expect((await download).suggestedFilename()).toBe(`${payroll.id}.csv`);
});

test('employee leave and performance review finish through member and manager actions', async ({ page }) => {
  await examples(page);
  await page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    const state = root.spaces[root.active];
    state.appMembers.employees = { ...state.appMembers.employees, alex: 'member' };
    state.appMembers.performance = { ...state.appMembers.performance, alex: 'member' };
    localStorage.setItem('anumat-hackathon-v1', JSON.stringify(root));
  });
  await persona(page, 'alex', '/employees?tab=leaves&create=1');
  await choose(page, 'Employee', /Alex Tan/);
  await page.getByRole('textbox', { name: 'First day of leave', exact: true }).fill('2030-10-07');
  await page.getByRole('textbox', { name: 'Last day of leave', exact: true }).fill('2030-10-07');
  await page.getByRole('textbox', { name: 'Leave reason', exact: true }).fill('Personal appointment');
  await save(page);
  const leave = (await stored(page)).hr.leaves[0];
  await page.goto(`/employees?tab=leaves&record=${leave.id}`);
  await action(page, 'Submit for review');
  await persona(page, 'dara', `/employees?tab=leaves&record=${leave.id}`);
  await action(page, 'Approve');
  expect((await stored(page)).hr.leaveLedger).toHaveLength(1);
  await page.goto('/home?app=performance');
  await page.getByRole('link', { name: 'Create performance review', exact: true }).click();
  await choose(page, 'Employee', /Alex Tan/);
  await page.getByRole('textbox', { name: 'Review title', exact: true }).fill('Service quality review');
  await dates(page, '2030-10-01', '2030-10-31');
  await page.getByRole('textbox', { name: 'Measurable goal', exact: true }).fill('Resolve 95% of customer requests within one working day');
  await save(page);
  const review = (await stored(page)).hr.reviews[0];
  await page.goto(`/performance?record=${review.id}`); await action(page, 'Start review');
  await persona(page, 'alex', `/performance?record=${review.id}`);
  await page.getByRole('textbox', { name: 'Self-review evidence', exact: true }).fill('Resolved 97 of 100 requests within one day');
  await save(page, false);
  await page.goto(`/performance?record=${review.id}`); await action(page, 'Submit for review');
  await persona(page, 'dara', `/performance?record=${review.id}`);
  await page.getByRole('textbox', { name: 'Manager assessment', exact: true }).fill('Verified the customer support log');
  await page.getByRole('spinbutton', { name: 'Rating from 1 to 5', exact: true }).fill('4');
  await page.getByRole('textbox', { name: 'Development plan', exact: true }).fill('Practice handling escalations');
  await save(page, false);
  await page.goto(`/performance?record=${review.id}`); await action(page, 'Publish');
  await persona(page, 'alex', `/performance?record=${review.id}`); await action(page, 'Acknowledge');
  expect((await stored(page)).hr.reviews[0].status).toBe('acknowledged');
});

test('HR dashboards respect viewer scope and omit administrative creation links', async ({ page }) => {
  await examples(page);
  await page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    const state = root.spaces[root.active];
    state.meId = 'alex';
    for (const app of ['employees', 'attendance', 'payroll', 'performance', 'training', 'assets', 'reports']) state.appMembers[app] = { ...state.appMembers[app], alex: 'viewer' };
    localStorage.setItem('anumat-hackathon-v1', JSON.stringify(root));
  });
  for (const app of ['employees', 'attendance', 'payroll', 'performance', 'training', 'assets', 'reports']) {
    await page.goto(`/home?app=${app}`);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('main a[href*="create=1"]')).toHaveCount(0);
    await expect(page.locator('main a[href*="record=hr-dara"]')).toHaveCount(0);
  }
  await page.goto('/home?app=employees');
  await expect(page.locator('main a[href*="record=hr-alex"]')).toHaveCount(1);
  await page.locator('main a[href*="record=hr-alex"]').click();
  await expect(page.getByRole('spinbutton', { name: 'Illustrative base pay', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Save changes', exact: true })).toHaveCount(0);
});

test('training creates evaluation, asset custody returns, and reports preserve and export a snapshot', async ({ page }) => {
  await examples(page);
  await page.goto('/home?app=training');
  await page.getByRole('link', { name: 'Enroll employee', exact: true }).click();
  await choose(page, 'Employee', /Alex Tan/);
  await choose(page, 'Course', 'Safety and data confidentiality');
  await save(page);
  const enrollment = (await stored(page)).hr.enrollments[0];
  await page.goto(`/training?tab=enrollments&record=${enrollment.id}`); await action(page, 'Record attendance');
  await page.goto(`/training?tab=enrollments&record=${enrollment.id}`);
  await page.getByRole('spinbutton', { name: 'Assessment score', exact: true }).fill('90');
  await page.getByRole('textbox', { name: 'Assessment evidence', exact: true }).fill('Completed the practical safety exercise');
  await save(page, false);
  await page.goto(`/training?tab=enrollments&record=${enrollment.id}`); await action(page, 'Assess learning');
  await page.goto(`/training?tab=enrollments&record=${enrollment.id}`);
  await page.getByRole('button', { name: 'Create training evaluation', exact: true }).click();
  const evaluation = (await stored(page)).hr.enrollments[0].surveyId;
  expect(evaluation).toBeTruthy();
  await page.goto('/home?app=surveys');
  await expect(page.locator(`a[href="/surveys/${evaluation}/edit"]`)).toBeVisible();
  await page.goto('/assets?tab=assets&record=hr-laptop');
  await choose(page, 'Custodian', /Alex Tan/);
  await save(page, false);
  await page.goto('/assets?tab=assets&record=hr-laptop'); await action(page, 'Assign asset');
  await page.goto('/assets?tab=assets&record=hr-laptop'); await action(page, 'Return asset');
  expect((await stored(page)).hr.assets.find((asset: { id: string }) => asset.id === 'hr-laptop').employeeId).toBe('');
  await page.goto('/home?app=reports');
  await page.getByRole('link', { name: 'Create report', exact: true }).click();
  await page.getByRole('textbox', { name: 'Report name', exact: true }).fill('Employee headcount snapshot');
  await dates(page, '2030-10-01', '2030-10-31');
  await save(page);
  const report = (await stored(page)).hr.reports[0];
  await page.goto(`/reports?record=${report.id}`); await action(page, 'Save report snapshot');
  expect((await stored(page)).hr.reports[0].snapshot.length).toBeGreaterThan(0);
  await page.goto(`/reports?record=${report.id}`);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export report CSV', exact: true }).click();
  expect((await download).suggestedFilename()).toBe(`${report.id}.csv`);
});

test('meetings dashboard reaches scheduling, decisions, assigned actions and persistent search filters', async ({ page }) => {
  await page.goto('/home?app=meetings');
  await page.getByRole('link', { name: 'Schedule a meeting', exact: true }).click();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('October planning review');
  await page.getByRole('textbox', { name: 'Date', exact: true }).fill('2030-10-08');
  await page.getByRole('textbox', { name: 'Where', exact: true }).fill('Planning room');
  await page.getByRole('checkbox', { name: 'Alex Tan · Operations Lead', exact: true }).check();
  await page.getByRole('button', { name: 'Schedule and invite', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'October planning review', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Record a decision', exact: true }).fill('Confirm the delivery plan');
  await page.getByRole('button', { name: 'Record', exact: true }).click();
  await page.getByRole('textbox', { name: 'New action item', exact: true }).fill('Send the planning notes');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.goto('/home?app=meetings');
  await page.getByRole('button', { name: /Send the planning notes/ }).click();
  await expect(page.getByRole('dialog', { name: 'Task', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: /Your upcoming meetings/ }).click();
  await expect(page).toHaveURL(/mine=1/);
  await expect(page.getByRole('link', { name: /October planning review/ })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search meetings', exact: true }).fill('October planning');
  await expect(page).toHaveURL(/q=October/);
  await page.reload();
  await expect(page.getByRole('searchbox', { name: 'Search meetings', exact: true })).toHaveValue('October planning');
  await page.getByRole('searchbox', { name: 'Search meetings', exact: true }).fill('unmatched meeting');
  await expect(page.getByRole('heading', { name: 'No matching meetings', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.getByRole('link', { name: /October planning review/ })).toBeVisible();
});

test('surveys dashboard supports publishing, answering, results and closing with status links', async ({ page }) => {
  await page.goto('/home?app=surveys');
  await page.getByRole('link', { name: 'New survey', exact: true }).click();
  await page.getByRole('button', { name: /Event sign-up/ }).click();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('October team event');
  await page.getByRole('button', { name: 'Review and send', exact: true }).first().click();
  await page.getByRole('dialog', { name: 'Send this survey?', exact: true }).getByRole('button', { name: /Send to .* people/ }).click();
  const surveyId = (await stored(page)).surveys.find((survey: { title: string }) => survey.title === 'October team event').id;
  await persona(page, 'alex', '/home?app=surveys');
  await page.getByRole('link', { name: /Waiting for your answer/ }).click();
  await expect(page).toHaveURL(/waiting=1/);
  await page.getByRole('link', { name: 'October team event', exact: true }).click();
  await page.getByRole('radio', { name: 'No', exact: true }).click();
  await page.getByRole('button', { name: 'Send answers', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Send answers', exact: true })).toHaveCount(0);
  await persona(page, 'dara', `/surveys/${surveyId}`);
  await page.getByRole('button', { name: 'More actions', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Close survey', exact: true }).click();
  expect((await stored(page)).surveys.find((survey: { id: string }) => survey.id === surveyId).status).toBe('closed');
  await page.goto('/home?app=surveys');
  await page.getByRole('link', { name: /Closed surveys/ }).click();
  await expect(page).toHaveURL(/status=closed/);
  await expect(page.getByRole('link', { name: 'October team event', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Survey status', exact: true })).toContainText('Closed');
});
