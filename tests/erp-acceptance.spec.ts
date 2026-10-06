import { expect } from '@playwright/test';
import { action, actor, choose, create, csv, dates, employee, open, save, seed, state, test, time } from './helpers/erp';

test.beforeEach(async ({ page }) => { await seed(page); });
test.setTimeout(90_000);

test('ERP-E04 employee custody blocks exit; rehire preserves employment history without creating a login', async ({ page }) => {
  const people = (await state(page)).people;
  const record = await employee(page);
  expect(record.accountId).toBe('');
  expect((await state(page)).people).toEqual(people);
  await open(page, 'employees', record.id);
  await action(page, 'Confirm probation');
  await open(page, 'employees', record.id);
  await page.getByRole('button', { name: 'Schedule employee change', exact: true }).click();
  const change = page.getByRole('dialog', { name: 'Schedule employee change', exact: true });
  await change.getByRole('textbox', { name: 'Position', exact: true }).fill('Senior coordinator');
  await change.getByRole('spinbutton', { name: 'Illustrative base pay', exact: true }).fill('900');
  await change.getByRole('textbox', { name: 'Change reason', exact: true }).fill('Promotion approved for today');
  await change.getByRole('button', { name: 'Schedule change', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect((await state(page)).hr.employees.find(e => e.id === record.id)?.salary).toBe(800);
  await open(page, 'employees', record.id);
  await page.getByRole('button', { name: 'Apply effective change', exact: true }).click();
  await expect.poll(async () => (await state(page)).hr.employees.find(e => e.id === record.id)?.salary).toBe(900);
  await open(page, 'assets', 'hr-laptop');
  await choose(page, 'Custodian', /ERP Acceptance Employee/); await save(page, false);
  await open(page, 'assets', 'hr-laptop'); await action(page, 'Assign asset');
  await open(page, 'employees', record.id);
  await page.getByRole('textbox', { name: 'Last working day', exact: true }).fill('2026-10-05');
  await page.getByRole('textbox', { name: 'Change reason', exact: true }).fill('Agreed final working day'); await save(page, false);
  await open(page, 'employees', record.id);
  await action(page, 'Complete offboarding', { error: 'Return assigned assets before completing offboarding.' });
  await open(page, 'assets', 'hr-laptop'); await action(page, 'Return asset');
  await open(page, 'employees', record.id); await action(page, 'Complete offboarding');
  await page.reload();
  let hr = (await state(page)).hr;
  expect(hr.employees.find(e => e.id === record.id)?.status).toBe('exited');
  expect(hr.episodes.filter(e => e.employeeId === record.id)).toEqual([expect.objectContaining({ startDate: '2026-01-05', endDate: '2026-10-05' })]);
  await open(page, 'employees', record.id);
  await action(page, 'Rehire employee', { reason: '2026-10-06 Approved second employment term' });
  await page.reload();
  hr = (await state(page)).hr;
  expect(hr.employees.filter(e => e.email === record.email)).toHaveLength(1);
  expect(hr.employees.find(e => e.id === record.id)).toMatchObject({ status: 'probation', salary: 900, accountId: '', endDate: '' });
  expect(hr.episodes.filter(e => e.employeeId === record.id)).toEqual([
    expect.objectContaining({ endDate: '2026-10-05' }),
    expect.objectContaining({ startDate: '2026-10-06', position: 'Senior coordinator', salary: 900 }),
  ]);
  expect((await state(page)).people).toEqual(people);
});

test('ERP-E03 leave rejects self-approval and overlaps; approval and cancellation reconcile the ledger', async ({ page }) => {
  await actor(page, 'Alex Tan');
  await create(page, 'leaves'); await choose(page, 'Employee', /Alex Tan/);
  await page.getByRole('textbox', { name: 'First day of leave', exact: true }).fill('2030-10-07');
  await page.getByRole('textbox', { name: 'Last day of leave', exact: true }).fill('2030-10-08');
  await page.getByRole('textbox', { name: 'Leave reason', exact: true }).fill('Family appointment'); await save(page);
  const leave = (await state(page)).hr.leaves[0]!;
  await open(page, 'leaves', leave.id); await action(page, 'Submit for review');
  await open(page, 'leaves', leave.id);
  await action(page, 'Approve', { error: 'Another Employee admin must approve your leave.' });
  await actor(page, 'Dara Sok'); await open(page, 'leaves', leave.id); await action(page, 'Approve');
  await page.reload();
  expect((await state(page)).hr.leaveLedger).toEqual([expect.objectContaining({ leaveId: leave.id, days: 2, kind: 'used' })]);
  await create(page, 'leaves'); await choose(page, 'Employee', /Alex Tan/);
  await page.getByRole('textbox', { name: 'First day of leave', exact: true }).fill('2030-10-08');
  await page.getByRole('textbox', { name: 'Last day of leave', exact: true }).fill('2030-10-09');
  await page.getByRole('textbox', { name: 'Leave reason', exact: true }).fill('Overlapping request');
  const beforeOverlap = await state(page);
  await page.getByRole('button', { name: 'Create record', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('This employee already has overlapping leave.');
  expect(await state(page)).toEqual(beforeOverlap);
  await page.getByRole('textbox', { name: 'First day of leave', exact: true }).fill('2030-10-09');
  await save(page);
  await open(page, 'leaves', leave.id); await action(page, 'Cancel');
  await page.reload();
  const ledger = (await state(page)).hr.leaveLedger;
  expect(ledger.map(e => [e.kind, e.days])).toEqual([['used', 2], ['reversal', -2]]);
  expect(ledger.reduce((total, entry) => total + entry.days, 0)).toBe(0);
  await open(page, 'employees', 'hr-alex');
  await expect(page.getByText('Leave balance: 18', { exact: true })).toBeVisible();
});

test('ERP-H02/P01 overnight attendance, independent payroll review and frozen exports reconcile', async ({ page }) => {
  await actor(page, 'Alex Tan');
  await create(page, 'attendance'); await choose(page, 'Employee', /Alex Tan/);
  await page.getByRole('textbox', { name: 'Shift date', exact: true }).fill('2030-10-07');
  await time(page, 'Clock in', '22:00');
  await time(page, 'Clock out', '06:00'); await save(page);
  const shift = (await state(page)).hr.attendance[0]!;
  await open(page, 'attendance', shift.id); await action(page, 'Submit for review');
  await open(page, 'attendance', shift.id);
  await action(page, 'Approve', { error: 'Another Attendance admin must review your attendance.' });
  await actor(page, 'Dara Sok');
  await create(page, 'attendancePeriods');
  await page.getByRole('textbox', { name: 'Period name', exact: true }).fill('October overnight attendance');
  await dates(page); await save(page);
  const period = (await state(page)).hr.attendancePeriods[0]!;
  await open(page, 'attendancePeriods', period.id);
  await action(page, 'Close attendance period', { error: 'Resolve attendance exceptions before closing this period.' });
  await create(page, 'payroll');
  await page.getByRole('textbox', { name: 'Period name', exact: true }).fill('October reconciled preview');
  await dates(page);
  await page.getByRole('spinbutton', { name: 'Flat adjustment per employee', exact: true }).fill('-17.25');
  await page.getByRole('textbox', { name: 'Calculation note', exact: true }).fill('Approved illustrative adjustment'); await save(page);
  const payroll = (await state(page)).hr.payroll[0]!;
  await open(page, 'payroll', payroll.id);
  await action(page, 'Prepare preview', { error: 'Close an attendance period covering this pay period first.' });
  await open(page, 'attendance', shift.id); await action(page, 'Approve');
  await open(page, 'attendancePeriods', period.id); await action(page, 'Close attendance period');
  expect((await state(page)).hr.attendancePeriods[0]!.snapshot).toEqual([(await state(page)).hr.attendance[0]]);
  await open(page, 'payroll', payroll.id); await action(page, 'Prepare preview');
  await open(page, 'payroll', payroll.id);
  await action(page, 'Independent review', { error: 'Another Payroll admin must review the prepared preview.' });
  await actor(page, 'Alex Tan'); await open(page, 'payroll', payroll.id); await action(page, 'Independent review');
  await actor(page, 'Dara Sok'); await open(page, 'payroll', payroll.id); await action(page, 'Freeze period');
  const frozen = (await state(page)).hr.payroll[0]!;
  expect(frozen).toMatchObject({ status: 'frozen', preparedById: 'dara', reviewedById: 'alex' });
  expect(frozen.lines).toHaveLength(4);
  expect(frozen.lines!.find(l => l.employeeId === 'hr-alex')).toMatchObject({ base: 750, adjustment: -17.25, total: 732.75, attendanceHours: 8 });
  expect(frozen.lines!.reduce((n, l) => n + l.total, 0)).toBe(3131);
  await open(page, 'payroll', payroll.id);
  await expect(page.getByRole('button', { name: 'Save changes', exact: true })).toHaveCount(0);
  const download = await csv(page, 'Export preview CSV');
  expect(download.filename).toBe(`${payroll.id}.csv`);
  expect(download.content.replace(/^\uFEFF/, '').split('\r\n')).toHaveLength(5);
  expect(download.content).toContain('"hr-alex","Alex Tan","USD","750","-17.25","732.75"');
  await open(page, 'attendance', shift.id);
  await action(page, 'Request correction', { error: 'Reopen the affected period before changing its inputs.' });
  await open(page, 'attendancePeriods', period.id);
  await action(page, 'Reopen attendance period', { error: 'Reopen the affected payroll period first.' });
  await page.reload();
  expect((await state(page)).hr.payroll[0]).toEqual(frozen);
});

test('ERP-L01 failed training retains attempts and enrollment criteria; completion creates only one evaluation', async ({ page }) => {
  await create(page, 'enrollments'); await choose(page, 'Employee', /Alex Tan/);
  await choose(page, 'Course', 'Safety and data confidentiality'); await save(page);
  const enrollment = (await state(page)).hr.enrollments[0]!;
  expect(enrollment).toMatchObject({ passScoreSnapshot: 70, validMonthsSnapshot: 12 });
  await open(page, 'enrollments', enrollment.id); await action(page, 'Record attendance');
  await open(page, 'enrollments', enrollment.id);
  await action(page, 'Assess learning', { error: 'Add assessment evidence before recording the result.' });
  await page.getByRole('spinbutton', { name: 'Assessment score', exact: true }).fill('60');
  await page.getByRole('textbox', { name: 'Assessment evidence', exact: true }).fill('First practical exercise: 60 of 100'); await save(page, false);
  await open(page, 'enrollments', enrollment.id); await action(page, 'Assess learning');
  expect((await state(page)).hr.enrollments[0]).toMatchObject({ status: 'failed', attempts: [expect.objectContaining({ score: 60 })] });
  await open(page, 'courses', 'hr-course');
  await page.getByRole('spinbutton', { name: 'Passing score', exact: true }).fill('100');
  await page.getByRole('spinbutton', { name: 'Certificate validity in months', exact: true }).fill('1'); await save(page, false);
  await open(page, 'enrollments', enrollment.id); await action(page, 'Retry assessment');
  await open(page, 'enrollments', enrollment.id);
  await page.getByRole('spinbutton', { name: 'Assessment score', exact: true }).fill('80');
  await page.getByRole('textbox', { name: 'Assessment evidence', exact: true }).fill('Second practical exercise: 80 of 100'); await save(page, false);
  await open(page, 'enrollments', enrollment.id); await action(page, 'Assess learning');
  await page.reload();
  expect((await state(page)).hr.enrollments[0]).toMatchObject({ status: 'completed', passScoreSnapshot: 70, expiresAt: '2027-10-05', attempts: [expect.objectContaining({ score: 60 }), expect.objectContaining({ score: 80 })] });
  const surveysBefore = (await state(page)).surveys.length;
  await open(page, 'enrollments', enrollment.id);
  await page.getByRole('button', { name: 'Create training evaluation', exact: true }).click();
  const surveyId = (await state(page)).hr.enrollments[0]!.surveyId;
  expect(surveyId).toBeTruthy();
  await open(page, 'enrollments', enrollment.id); await page.reload();
  await expect(page.getByRole('button', { name: 'Create training evaluation', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Open training evaluation', exact: true })).toHaveAttribute('href', `/surveys/${surveyId}/edit`);
  expect((await state(page)).surveys).toHaveLength(surveysBefore + 1);
});

test('ERP-X02 rooms reject overlaps but permit adjacent bookings and reuse after cancellation', async ({ page }) => {
  async function booking(start: string, end: string) {
    await create(page, 'reservations'); await choose(page, 'Room', 'Angkor meeting room');
    await choose(page, 'Employee', /Alex Tan/);
    await page.getByRole('textbox', { name: 'Reservation date', exact: true }).fill('2030-10-07');
    await time(page, 'Start time', start);
    await time(page, 'End time', end);
    await page.getByRole('textbox', { name: 'Meeting purpose', exact: true }).fill('Quarterly planning');
  }
  await booking('09:00', '10:00'); await save(page);
  const first = (await state(page)).hr.reservations[0]!;
  await booking('09:30', '10:30');
  const before = await state(page);
  await page.getByRole('button', { name: 'Create record', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('This room is already reserved during that time.');
  expect(await state(page)).toEqual(before);
  await time(page, 'Start time', '10:00');
  await save(page); // The same draft can be corrected without starting over.
  await open(page, 'reservations', first.id); await action(page, 'Cancel');
  await booking('09:00', '10:00'); await save(page);
  await page.reload();
  expect((await state(page)).hr.reservations.map(r => [r.status, r.startTime, r.endTime])).toEqual([
    ['cancelled', '09:00', '10:00'], ['reserved', '10:00', '10:30'], ['reserved', '09:00', '10:00'],
  ]);
});

test('ERP-Q01 report filters and CSV match a saved snapshot until an explicit revision', async ({ page }) => {
  await create(page, 'reports');
  await page.getByRole('textbox', { name: 'Report name', exact: true }).fill('Operations headcount');
  await page.getByRole('combobox', { name: 'Department filter', exact: true }).fill('Operations');
  await dates(page, '2026-10-01', '2026-10-31'); await save(page);
  const report = (await state(page)).hr.reports[0]!;
  await open(page, 'reports', report.id); await action(page, 'Save report snapshot');
  const snapshot = (await state(page)).hr.reports[0]!.snapshot!;
  expect(snapshot.length).toBeGreaterThan(0);
  expect(snapshot.every(r => r.department === 'Operations')).toBe(true);
  await open(page, 'reports', report.id);
  const first = await csv(page, 'Export report CSV');
  expect(first.filename).toBe(`${report.id}.csv`);
  expect(first.content.replace(/^\uFEFF/, '').split('\r\n')).toHaveLength(snapshot.length + 1);
  for (const row of snapshot) expect(first.content).toContain(`"${row.name}","Operations"`);
  expect(first.content).not.toContain('Priya Shah');
  const newEmployee = await employee(page, 'Operations New Hire');
  await open(page, 'reports', report.id); await page.reload();
  expect((await state(page)).hr.reports[0]!.snapshot).toEqual(snapshot);
  expect((await csv(page, 'Export report CSV')).content).toBe(first.content);
  await action(page, 'Create new revision');
  await open(page, 'reports', report.id); await action(page, 'Save report snapshot');
  const revised = (await state(page)).hr.reports[0]!;
  expect(revised.snapshot).toHaveLength(snapshot.length + 1);
  expect(revised.snapshot).toContainEqual(expect.objectContaining({ id: newEmployee.id, name: 'Operations New Hire' }));
  expect((await state(page)).hr.history.filter(e => e.recordId === report.id && e.action === 'snapshot')).toHaveLength(2);
});

test('ERP-V01 review needs evidence, independent publication and employee acknowledgment', async ({ page }) => {
  await create(page, 'reviews'); await choose(page, 'Employee', /Alex Tan/);
  await page.getByRole('textbox', { name: 'Review title', exact: true }).fill('Service quality');
  await dates(page);
  await page.getByRole('textbox', { name: 'Measurable goal', exact: true }).fill('Resolve 95% of tickets in one day'); await save(page);
  const review = (await state(page)).hr.reviews[0]!;
  await open(page, 'reviews', review.id); await action(page, 'Start review');
  await actor(page, 'Alex Tan'); await open(page, 'reviews', review.id);
  await action(page, 'Submit for review', { error: 'Add self-review evidence before submitting.' });
  await page.getByRole('textbox', { name: 'Self-review evidence', exact: true }).fill('Resolved 97 of 100 tickets within one day'); await save(page, false);
  await open(page, 'reviews', review.id); await action(page, 'Submit for review');
  await open(page, 'reviews', review.id);
  await action(page, 'Publish', { error: 'Add manager evidence, a rating, and the development plan.' });
  await page.getByRole('textbox', { name: 'Manager assessment', exact: true }).fill('Ticket log verified');
  await page.getByRole('spinbutton', { name: 'Rating from 1 to 5', exact: true }).fill('4');
  await page.getByRole('textbox', { name: 'Development plan', exact: true }).fill('Practice escalation handling'); await save(page, false);
  await open(page, 'reviews', review.id);
  await action(page, 'Publish', { error: 'Another Performance admin must publish your review.' });
  await actor(page, 'Dara Sok'); await open(page, 'reviews', review.id); await action(page, 'Publish');
  await open(page, 'reviews', review.id);
  await action(page, 'Acknowledge', { error: 'Only the reviewed employee can acknowledge this review.' });
  await actor(page, 'Alex Tan'); await open(page, 'reviews', review.id); await action(page, 'Acknowledge');
  await page.reload();
  expect((await state(page)).hr.reviews[0]).toMatchObject({ status: 'acknowledged', rating: 4 });
  const history = (await state(page)).hr.history.filter(e => e.recordId === review.id);
  expect(history.find(e => e.action === 'publish')?.actorId).toBe('dara');
  expect(history.find(e => e.action === 'acknowledge')?.actorId).toBe('alex');
});

test('ERP-F03/Q02 report admin cannot read or export a source after its access is reduced', async ({ page }) => {
  await create(page, 'reports');
  await page.getByRole('textbox', { name: 'Report name', exact: true }).fill('Restricted headcount');
  await dates(page); await save(page);
  const report = (await state(page)).hr.reports[0]!;
  await open(page, 'reports', report.id); await action(page, 'Save report snapshot');
  const snapshot = (await state(page)).hr.reports[0]!.snapshot;
  await page.goto('/reports/people');
  await page.getByRole('button', { name: 'Invite member', exact: true }).click();
  await page.getByRole('tab', { name: 'Workspace person', exact: true }).click();
  await choose(page, 'Workspace person', 'Alex Tan');
  await choose(page, 'App role', 'Admin');
  await page.getByRole('button', { name: 'Add to app', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await actor(page, 'Alex Tan'); await open(page, 'reports', report.id);
  await expect(page.getByRole('button', { name: 'Export report CSV', exact: true })).toBeVisible();
  await actor(page, 'Dara Sok');
  await page.goto('/employees/people'); await choose(page, 'App role for Alex Tan', 'Viewer');
  await actor(page, 'Alex Tan'); await open(page, 'reports', report.id); await page.reload();
  await expect(page.getByText('You need Admin access to the report’s source app.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export report CSV', exact: true })).toHaveCount(0);
  await expect(page.getByRole('table', { name: 'Report results', exact: true })).toHaveCount(0);
  await expect(page.getByRole('dialog').getByText('Priya Shah', { exact: true })).toHaveCount(0);
  expect((await state(page)).hr.reports[0]!.snapshot).toEqual(snapshot);
  await page.goto('/employees?record=hr-priya');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/employees?record=hr-alex');
  await expect(page.getByRole('dialog', { name: 'Alex Tan', exact: true })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Illustrative base pay', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Save changes', exact: true })).toHaveCount(0);
});

test('ERP-R02 revised offer needs fresh independent approval; hire creates one employee and onboarding plan', async ({ page }) => {
  const application = (await state(page)).hr.applications[0]!;
  await open(page, 'applications', application.id); await action(page, 'Shortlist');
  await open(page, 'applications', application.id); await action(page, 'Record interview');
  async function approveOffer() {
    await open(page, 'applications', application.id);
    await page.getByRole('button', { name: 'Request offer approval', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Offer approval', exact: true });
    await dialog.getByRole('textbox', { name: 'Offer terms', exact: true }).fill('Terms reviewed with the candidate');
    await dialog.getByRole('button', { name: 'Request offer approval', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    const offer = (await state(page)).hr.recruitment!.offers.find(o => o.status === 'pending')!;
    await actor(page, 'Alex Tan');
    await page.goto(`/recruitment?tab=offers&record=${offer.id}`);
    await page.getByRole('textbox', { name: 'Decision reason', exact: true }).fill('Independently checked current offer terms');
    await page.getByRole('button', { name: 'Approve offer', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await actor(page, 'Dara Sok');
    return offer.id;
  }
  const originalId = await approveOffer();
  await open(page, 'applications', application.id);
  await page.getByRole('spinbutton', { name: 'Offer base pay', exact: true }).fill('725');
  await page.getByRole('textbox', { name: 'Change reason', exact: true }).fill('Revised negotiated base pay'); await save(page, false);
  const revised = (await state(page)).hr.applications[0]!;
  expect(revised.offerRevision).toBe(application.offerRevision + 1);
  expect((await state(page)).hr.recruitment!.offers.find(o => o.id === originalId)?.status).toBe('superseded');
  await open(page, 'applications', application.id);
  await action(page, 'Issue offer', { error: 'Request independent approval for the current offer revision before continuing.' });
  const currentId = await approveOffer();
  expect(currentId).not.toBe(originalId);
  for (const name of ['Issue offer', 'Accept offer', 'Hire & create onboarding']) {
    await open(page, 'applications', application.id); await action(page, name);
  }
  const hired = await state(page);
  const employeeId = hired.hr.applications[0]!.employeeId!;
  expect(hired.hr.employees.filter(e => e.email === application.email)).toEqual([
    expect.objectContaining({ id: employeeId, salary: 725, accountId: '' }),
  ]);
  expect(hired.hr.episodes.filter(e => e.employeeId === employeeId)).toHaveLength(1);
  expect(hired.tasks.filter(t => t.source?.href === `/employees?record=${employeeId}`)).toHaveLength(3);
  await open(page, 'applications', application.id); await page.reload();
  await expect(page.getByRole('button', { name: 'Hire & create onboarding', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Open hired employee', exact: true }).click();
  await expect(page.getByRole('dialog', { name: application.name, exact: true })).toBeVisible();
  expect((await state(page)).hr.episodes).toEqual(hired.hr.episodes);
  expect((await state(page)).tasks).toEqual(hired.tasks);
});
