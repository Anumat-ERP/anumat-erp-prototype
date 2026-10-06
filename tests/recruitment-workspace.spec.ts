import { expect, test, type Page } from '@playwright/test';
async function examples(page: Page) {
  await page.goto('/home?app=recruitment');
  await page
    .getByRole('button', { name: 'Load HR examples', exact: true })
    .click();
}
async function choose(page: Page, label: string, value: string) {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: value, exact: true }).click();
}
async function persona(page: Page, id: string, path: string) {
  await page.evaluate((id) => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    root.spaces[root.active].meId = id;
    localStorage.setItem('anumat-hackathon-v1', JSON.stringify(root));
  }, id);
  await page.goto(path);
}
async function saved(page: Page) {
  return page.evaluate(() => {
    const r = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    return r.spaces[r.active];
  });
}
test('recruitment dashboard and all sections fit desktop and mobile', async ({
  page,
}, info) => {
  await examples(page);
  await expect(
    page.getByRole('heading', { name: 'Recruitment funnel', exact: true }),
  ).toBeVisible();
  if (info.project.name === 'mobile') {
    await expect(page.getByRole('combobox', { name: 'Recruitment sections', exact: true })).toContainText('Dashboard');
    await choose(page, 'Recruitment sections', 'Pipeline');
    await expect(page).toHaveURL(/recruitment\?tab=pipeline$/);
    await choose(page, 'Recruitment sections', 'Dashboard');
    await expect(page).toHaveURL(/home\?app=recruitment$/);
    await expect(page.getByRole('heading', { name: 'Recruitment funnel', exact: true })).toBeVisible();
  }
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({
    path: `/tmp/anumat-recruitment-review/dashboard-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  });
  for (const tab of [
    'pipeline',
    'positions',
    'requisitions',
    'interviews',
    'offers',
    'onboarding',
    'careers',
  ]) {
    await page.goto(`/recruitment?tab=${tab}`);
    await expect(
      page.getByRole('heading', {
        name: 'Recruitment management',
        exact: true,
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(0);
  }
  await page.goto('/recruitment?tab=pipeline');
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({
    path: `/tmp/anumat-recruitment-review/pipeline-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  });
});
test('position rich editor, requisition, independent approval, publication and applicant preview connect', async ({
  page,
}, info) => {
  await examples(page);
  await page.goto('/recruitment?tab=positions');
  await page
    .getByRole('button', { name: 'Create position', exact: true })
    .click();
  let dialog = page.getByRole('dialog', {
    name: 'Position and job description',
    exact: true,
  });
  await dialog
    .getByRole('textbox', { name: 'Job title', exact: true })
    .fill('Office administrator');
  await dialog
    .getByRole('textbox', { name: 'Department', exact: true })
    .fill('Operations');
  await dialog
    .getByRole('textbox', { name: 'Branch', exact: true })
    .fill('Phnom Penh');
  await dialog
    .getByRole('textbox', { name: 'Description', exact: true })
    .fill('Coordinate office work and record outcomes.');
  await dialog
    .getByRole('textbox', { name: 'Required skills and outcomes', exact: true })
    .fill('Communication and accurate records.');
  await dialog.getByRole('textbox', { name: 'Job code', exact: true }).fill('OFFICE-001');
  await dialog.getByRole('textbox', { name: 'Job level', exact: true }).fill('Junior');
  await dialog.getByRole('textbox', { name: 'Reports to', exact: true }).fill('Operations Lead');
  await dialog.getByRole('textbox', { name: 'Key responsibilities', exact: true }).fill('Maintain office records and coordinate suppliers.');
  await dialog.getByRole('textbox', { name: 'Education and certifications', exact: true }).fill('Relevant qualification or equivalent experience.');
  await dialog.getByRole('spinbutton', { name: 'Minimum years of experience', exact: true }).fill('0');
  await choose(page, 'Work arrangement', 'Hybrid');
  await dialog.getByRole('textbox', { name: 'Working hours', exact: true }).fill('Weekday office schedule');
  await dialog.getByRole('textbox', { name: 'Benefits and development opportunities', exact: true }).fill('Mentoring and training');
  await dialog.getByRole('spinbutton', { name: 'Minimum monthly salary', exact: true }).fill('500');
  await dialog.getByRole('spinbutton', { name: 'Maximum monthly salary', exact: true }).fill('400');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Enter a valid salary range');
  await dialog.getByRole('spinbutton', { name: 'Maximum monthly salary', exact: true }).fill('700');
  await dialog.getByRole('checkbox', { name: 'Show salary range to applicants', exact: true }).check();
  await dialog.getByRole('button', { name: 'Preview job description', exact: true }).click();
  await expect(dialog.getByRole('region', { name: 'Job description preview', exact: true })).toContainText('500 – 700 USD');
  await dialog.getByRole('heading', { name: 'Working conditions and benefits', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `/tmp/anumat-recruitment-review/job-description-${info.project.name}.png`, animations: 'disabled' });
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await page.goto('/recruitment?tab=requisitions');
  await page
    .getByRole('button', { name: 'Create requisition', exact: true })
    .click();
  dialog = page.getByRole('dialog', {
    name: 'Headcount requisition',
    exact: true,
  });
  await choose(page, 'Position', 'Office administrator · v1');
  await dialog.getByRole('textbox', { name: 'Closing date', exact: true }).fill('2030-12-20');
  await dialog
    .getByRole('textbox', { name: 'Hiring justification', exact: true })
    .fill('Improve office coordination');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await page
    .getByRole('button', { name: 'Office administrator', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Decision reason', exact: true })
    .fill('Headcount needed');
  await page
    .getByRole('button', { name: 'Submit headcount approval', exact: true })
    .click();
  const headcount = (await saved(page)).hr.recruitment.requisitions.find((q: { position: { title: string } }) => q.position.title === 'Office administrator');
  await persona(page, 'alex', `/requests/${headcount.requestId}`);
  await page.getByRole('button', { name: 'Open requisition', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Decision reason', exact: true })
    .fill('Budget approved');
  await page
    .getByRole('button', { name: 'Approve headcount', exact: true })
    .click();
  await persona(page, 'dara', '/recruitment?tab=vacancies');
  await page
    .getByRole('button', { name: 'Office administrator', exact: true })
    .click();
  await expect(page.getByRole('textbox', { name: 'Job title', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Publish', exact: true });
  await dialog
    .getByRole('button', { name: 'Confirm action', exact: true })
    .click();
  await page.goto('/recruitment?tab=careers');
  const card = page
    .getByRole('heading', { name: 'Office administrator', exact: true })
    .locator('..')
    .locator('..');
  await expect(card.locator('..')).toContainText('Maintain office records and coordinate suppliers.');
  await expect(card.locator('..')).toContainText('500 – 700 USD');
  await card
    .getByRole('button', { name: 'Apply for this role', exact: true })
    .click();
  dialog = page.getByRole('dialog', {
    name: 'Apply for this role',
    exact: true,
  });
  await dialog
    .getByRole('textbox', { name: 'Candidate name', exact: true })
    .fill('Chan Dara');
  await dialog
    .getByRole('textbox', { name: 'Candidate email', exact: true })
    .fill('chan@example.test');
  await dialog
    .getByRole('button', { name: 'Submit application preview', exact: true })
    .click();
  await expect(dialog.getByRole('alert')).toContainText('Confirm consent');
  await dialog.getByRole('checkbox').check();
  await dialog
    .getByRole('button', { name: 'Submit application preview', exact: true })
    .click();
  await expect(
    page.getByText('Application received', { exact: true }),
  ).toBeVisible();
  const s = await saved(page);
  expect(
    s.hr.applications.find(
      (a: { email: string }) => a.email === 'chan@example.test',
    ).status,
  ).toBe('applied');
  expect(
    s.hr.recruitment.requisitions.find(
      (q: { position: { title: string } }) =>
        q.position.title === 'Office administrator',
    ).status,
  ).toBe('approved');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Office administrator', exact: true }),
  ).toBeVisible();
});
test('interviewer sees own assignment and can assess without candidate offer access', async ({
  page,
}) => {
  await examples(page);
  await page.goto('/recruitment?tab=applications');
  await page
    .getByRole('button', { name: 'សុភា សុខ · Sophea Sok', exact: true })
    .click();
  await page.getByRole('button', { name: 'Shortlist', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Shortlist', exact: true })
    .getByRole('button', { name: 'Confirm action', exact: true })
    .click();
  await page.goto('/recruitment?tab=interviews');
  await page
    .getByRole('button', { name: 'Schedule interview', exact: true })
    .click();
  let dialog = page.getByRole('dialog', {
    name: 'Interview and assessment',
    exact: true,
  });
  await dialog.getByRole('textbox', { name: 'Interview date', exact: true }).fill('2030-10-10');
  await dialog.getByRole('button', { name: 'Open calendar for Interview date', exact: true }).click();
  await page.getByRole('dialog', { name: 'Choose date', exact: true }).locator('[data-day="2030-10-11"] button').click();
  await expect(dialog.getByRole('textbox', { name: 'Interview date', exact: true })).toHaveValue('2030-10-11');
  await choose(page, 'Interviewer', 'Alex Tan');
  await dialog
    .getByRole('textbox', { name: 'Location', exact: true })
    .fill('Angkor room');
  await dialog
    .getByRole('textbox', { name: 'Assessment criteria', exact: true })
    .fill('Coordination and evidence');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  expect((await saved(page)).hr.recruitment.interviews[0].startsAt).toBe('2030-10-11T09:00');
  await page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    root.spaces[root.active].appMembers.recruitment.alex = 'member';
    localStorage.setItem('anumat-hackathon-v1', JSON.stringify(root));
  });
  await persona(page, 'alex', '/recruitment?tab=interviews');
  await page
    .getByRole('button', { name: 'សុភា សុខ · Sophea Sok', exact: true })
    .click();
  dialog = page.getByRole('dialog', {
    name: 'Interview and assessment',
    exact: true,
  });
  await expect(dialog.getByText('Offer base pay', { exact: true })).toHaveCount(
    0,
  );
  await dialog
    .getByRole('spinbutton', { name: 'Assessment score', exact: true })
    .fill('85');
  await dialog
    .getByRole('textbox', { name: 'Assessment evidence', exact: true })
    .fill('Clear documented scenario');
  await dialog
    .getByRole('button', { name: 'Submit assessment', exact: true })
    .click();
  await expect(page.getByText('Completed', { exact: true })).toBeVisible();
  await page.goto('/recruitment?tab=applications');
  await expect(
    page.getByRole('button', { name: 'សុភា សុខ · Sophea Sok', exact: true }),
  ).toHaveCount(0);
});
test('Khmer dark recruitment dashboard and sections use translated controls', async ({
  page,
}, info) => {
  await examples(page);
  await page.evaluate(() => {
    localStorage.setItem('anumat-locale', 'km');
    localStorage.setItem('anumat-theme', 'dark');
  });
  await page.goto('/home?app=recruitment');
  await expect(
    page.getByRole('heading', {
      name: 'ដំណាក់កាលជ្រើសរើសបុគ្គលិក',
      exact: true,
    }),
  ).toBeVisible();
  await page.goto('/recruitment?tab=positions');
  await page
    .getByRole('button', { name: 'បង្កើតមុខតំណែង', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', {
      name: 'មុខតំណែង និងការពិពណ៌នាការងារ',
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(0);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({
    path: `/tmp/anumat-recruitment-review/position-km-dark-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  });
});

test('candidate documents persist locally and open the shared document viewer', async ({
  page,
}) => {
  await examples(page);
  await page.goto('/recruitment?tab=applications');
  await page
    .getByRole('button', { name: 'សុភា សុខ · Sophea Sok', exact: true })
    .click();
  const dialog = page.getByRole('dialog', {
    name: 'សុភា សុខ · Sophea Sok',
    exact: true,
  });
  await dialog
    .locator('input[type=file]')
    .setInputFiles({
      name: 'candidate-resume.txt.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\nDemo resume'),
    });
  await expect(
    dialog.getByRole('button', {
      name: 'candidate-resume.txt.pdf',
      exact: true,
    }),
  ).toBeVisible();
  await dialog
    .getByRole('button', { name: 'Save changes', exact: true })
    .click();
  await page.reload();
  await page
    .getByRole('button', { name: 'សុភា សុខ · Sophea Sok', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'candidate-resume.txt.pdf', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'candidate-resume.txt.pdf', exact: true }),
  ).toBeVisible();
});

test('recruitment records reopen from URLs, preserve saved decisions and hide restricted records', async ({ page }) => {
  await examples(page);
  const state = await saved(page);
  const position = state.hr.recruitment.positions[0];
  await page.goto(`/recruitment?tab=positions&record=${position.id}`);
  let dialog = page.getByRole('dialog', { name: 'Position and job description', exact: true });
  await expect(dialog.getByRole('textbox', { name: 'Job title', exact: true })).toHaveValue(position.title);
  await dialog.getByRole('link', { name: 'Create requisition', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Headcount requisition', exact: true });
  await expect(dialog.getByRole('combobox', { name: 'Position', exact: true })).toContainText(position.title);
  await dialog.getByRole('textbox', { name: 'Hiring justification', exact: true }).fill('Expand customer support');
  await dialog.getByRole('textbox', { name: 'Closing date', exact: true }).fill('2030-12-20');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  const requisition = (await saved(page)).hr.recruitment.requisitions.find((q: { reason: string }) => q.reason === 'Expand customer support');
  await page.goto(`/recruitment?tab=requisitions&record=${requisition.id}`);
  await page.reload();
  dialog = page.getByRole('dialog', { name: 'Headcount requisition', exact: true });
  await expect(dialog.getByRole('textbox', { name: 'Closing date', exact: true })).toHaveValue('2030-12-20');
  await dialog.getByRole('textbox', { name: 'Hiring justification', exact: true }).fill('Unsaved budget change');
  await expect(dialog.getByRole('button', { name: 'Submit headcount approval', exact: true })).toBeDisabled();
  await dialog.getByRole('button', { name: 'Close', exact: true }).last().click();
  expect((await saved(page)).hr.recruitment.requisitions.find((q: { id: string }) => q.id === requisition.id).reason).toBe('Expand customer support');
  await page.goto(`/recruitment?tab=requisitions&record=${requisition.id}`);
  await page.getByRole('textbox', { name: 'Decision reason', exact: true }).fill('Ready for independent review');
  await page.getByRole('button', { name: 'Submit headcount approval', exact: true }).click();
  expect((await saved(page)).hr.recruitment.requisitions.find((q: { id: string }) => q.id === requisition.id).status).toBe('pending');
  await persona(page, 'alex', '/home?app=recruitment');
  await page.locator(`a[href="/recruitment?tab=requisitions&record=${requisition.id}"]`).click();
  await expect(page.getByRole('dialog', { name: 'Headcount requisition', exact: true })).toBeVisible();
  await page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    root.spaces[root.active].appMembers.recruitment.alex = 'member';
    localStorage.setItem('anumat-hackathon-v1', JSON.stringify(root));
  });
  await page.reload();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('This record is unavailable or you do not have access.', { exact: true })).toBeVisible();
});

test('candidate background supports multiple entries, validation, persistence and draft cancellation', async ({ page }, info) => {
  await examples(page);
  await page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('anumat-hackathon-v1')!);
    delete root.spaces[root.active].hr.applications[0].profile;
    localStorage.setItem('anumat-hackathon-v1', JSON.stringify(root));
  });
  await page.goto('/recruitment?tab=applications&record=hr-application');
  let dialog = page.getByRole('dialog', { name: 'សុភា សុខ · Sophea Sok', exact: true });
  await dialog.getByRole('button', { name: 'Add education', exact: true }).click();
  await dialog.getByRole('textbox', { name: 'University or institution', exact: true }).fill('Royal University of Phnom Penh');
  await dialog.getByRole('textbox', { name: 'Degree or qualification', exact: true }).fill('Bachelor of Information Technology');
  await dialog.getByRole('textbox', { name: 'Field of study', exact: true }).fill('Computer science');
  await dialog.getByRole('spinbutton', { name: 'Start year', exact: true }).fill('2020');
  await dialog.getByRole('spinbutton', { name: 'End year', exact: true }).fill('2019');
  await dialog.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(dialog.getByRole('alert').filter({ hasText: 'Check education years.' })).toBeVisible();
  await dialog.getByRole('spinbutton', { name: 'End year', exact: true }).fill('2024');
  await dialog.getByRole('button', { name: 'Add education', exact: true }).click();
  await dialog.getByRole('textbox', { name: 'University or institution', exact: true }).last().fill('Example Training Centre');
  await dialog.getByRole('textbox', { name: 'Degree or qualification', exact: true }).last().fill('Project management certificate');
  await dialog.getByRole('checkbox', { name: 'Currently studying', exact: true }).last().check();
  await expect(dialog.getByRole('spinbutton', { name: 'End year', exact: true }).last()).toBeDisabled();
  await dialog.getByRole('button', { name: 'Add experience', exact: true }).click();
  await dialog.getByRole('textbox', { name: 'Company or organization', exact: true }).fill('Example Software Co.');
  await dialog.getByRole('textbox', { name: 'Role or job title', exact: true }).fill('Frontend developer');
  await dialog.getByRole('textbox', { name: 'Employment start date', exact: true }).fill('2024-07-01');
  await dialog.getByRole('checkbox', { name: 'Currently working here', exact: true }).check();
  await expect(dialog.getByRole('textbox', { name: 'Employment end date', exact: true })).toBeDisabled();
  await dialog.getByRole('textbox', { name: 'Responsibilities and achievements', exact: true }).fill('Built accessible internal tools.');
  await dialog.getByRole('button', { name: 'Add skill', exact: true }).click();
  await dialog.getByRole('textbox', { name: 'Skill name', exact: true }).fill('React');
  await choose(page, 'Proficiency', 'Advanced');
  await dialog.getByRole('button', { name: 'Add project', exact: true }).click();
  await dialog.getByRole('textbox', { name: 'Project name', exact: true }).fill('Campus timetable');
  await choose(page, 'Project type', 'Academic');
  await dialog.getByRole('textbox', { name: 'Your contribution', exact: true }).fill('Designed the frontend');
  await dialog.getByRole('textbox', { name: 'Portfolio or project URL', exact: true }).fill('https://example.test/portfolio');
  await dialog.getByRole('textbox', { name: 'Project outcomes and skills used', exact: true }).fill('React scheduling prototype');
  await dialog.getByRole('textbox', { name: 'Recruiter notes', exact: true }).fill('Discuss project outcomes in interview.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await dialog.getByRole('button', { name: 'Save changes', exact: true }).click();
  await page.goto('/recruitment?tab=applications&record=hr-application');
  dialog = page.getByRole('dialog', { name: 'សុភា សុខ · Sophea Sok', exact: true });
  await expect(dialog.getByRole('textbox', { name: 'University or institution', exact: true }).first()).toHaveValue('Royal University of Phnom Penh');
  await expect(dialog.getByRole('combobox', { name: 'Project type', exact: true })).toContainText('Academic');
  const profile = (await saved(page)).hr.applications[0].profile;
  expect(profile.education).toHaveLength(2);
  expect(profile.experience[0].startDate).toBe('2024-07-01');
  expect(profile.skills[0]).toEqual({ name: 'React', level: 'Advanced' });
  await dialog.getByRole('textbox', { name: 'Recruiter notes', exact: true }).fill('Unsaved notes');
  await dialog.getByRole('button', { name: 'Remove Education 2', exact: true }).click();
  await dialog.getByRole('button', { name: 'Close', exact: true }).last().click();
  await page.getByRole('dialog', { name: 'Discard unsaved changes?', exact: true }).getByRole('button', { name: 'Discard changes', exact: true }).click();
  expect((await saved(page)).hr.applications[0].profile).toEqual(profile);
  await page.evaluate(() => { localStorage.setItem('anumat-locale', 'km'); localStorage.setItem('anumat-theme', 'dark'); });
  await page.goto('/recruitment?tab=applications&record=hr-application');
  await expect(page.getByRole('heading', { name: 'ប្រវត្តិបេក្ខជន', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'សាកលវិទ្យាល័យ ឬស្ថាប័ន', exact: true }).first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: `/tmp/anumat-recruitment-review/candidate-background-${info.project.name}.png`, animations: 'disabled' });
});

test('applicant preview collects optional background without recruiter notes', async ({ page }) => {
  await examples(page);
  await page.goto('/recruitment?tab=careers');
  await page.getByRole('button', { name: 'Apply for this role', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Apply for this role', exact: true });
  await dialog.getByText('Add optional candidate background', { exact: true }).click();
  await expect(dialog.getByRole('textbox', { name: 'Recruiter notes', exact: true })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Add skill', exact: true }).click();
  await dialog.getByRole('textbox', { name: 'Skill name', exact: true }).fill('Khmer communication');
  await dialog.getByRole('textbox', { name: 'Candidate name', exact: true }).fill('Example Applicant');
  await dialog.getByRole('textbox', { name: 'Candidate email', exact: true }).fill('profile@example.test');
  await dialog.getByRole('checkbox', { name: 'I agree to use these details for this recruitment assessment.', exact: true }).check();
  await dialog.getByRole('button', { name: 'Submit application preview', exact: true }).click();
  await expect(page.getByText('Application received', { exact: true })).toBeVisible();
  const application = (await saved(page)).hr.applications.find((a: { email: string }) => a.email === 'profile@example.test');
  expect(application.profile.skills[0].name).toBe('Khmer communication');
  expect(application.profile.notes).toBe('');
});

test('job descriptions duplicate, archive, restore and keep revision history', async ({ page }) => {
  await examples(page);
  await page.goto('/recruitment?tab=positions&record=hr-position');
  let dialog = page.getByRole('dialog', { name: 'Position and job description', exact: true });
  await dialog.getByRole('link', { name: 'Duplicate job description', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Position and job description', exact: true });
  await expect(dialog.getByRole('textbox', { name: 'Job title', exact: true })).toHaveValue('Copy of Operations coordinator');
  await expect(dialog.getByRole('textbox', { name: 'Job code', exact: true })).toHaveValue('');
  await expect(dialog.getByRole('textbox', { name: 'Reports to', exact: true })).toHaveValue('Operations Lead');
  await dialog.getByRole('textbox', { name: 'Job title', exact: true }).fill('Office team lead');
  await dialog.getByRole('textbox', { name: 'Job code', exact: true }).fill('TEAM-LEAD');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  const copied = (await saved(page)).hr.recruitment.positions.find((p: { code: string }) => p.code === 'TEAM-LEAD');
  await page.goto(`/recruitment?tab=positions&record=${copied.id}`);
  await choose(page, 'Job description status', 'Archived');
  await page.getByRole('textbox', { name: 'Revision note', exact: true }).fill('Pause this role while planning the team');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await choose(page, 'Filter job descriptions', 'Active');
  await expect(page.getByRole('button', { name: 'Office team lead', exact: true })).toHaveCount(0);
  await choose(page, 'Filter job descriptions', 'Archived');
  await page.getByRole('button', { name: 'Office team lead', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Position and job description', exact: true });
  await expect(dialog.getByRole('link', { name: 'Create requisition', exact: true })).toHaveCount(0);
  await dialog.getByText('History', { exact: true }).click();
  await expect(dialog.getByRole('list').getByText('Pause this role while planning the team', { exact: true })).toBeVisible();
  await dialog.getByText('View revision 1', { exact: true }).click();
  await expect(dialog.getByText('View revision 1', { exact: true }).locator('..').getByText('Coordinate daily handoffs, maintain dispatch records and report exceptions.', { exact: true })).toBeVisible();
  await choose(page, 'Job description status', 'Active');
  await dialog.getByRole('textbox', { name: 'Revision note', exact: true }).fill('Resume hiring');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  expect((await saved(page)).hr.recruitment.positions.find((p: { id: string }) => p.id === copied.id).status).toBe('active');
  await page.goto('/recruitment?tab=careers');
  await expect(page.getByText('Advertised monthly salary', { exact: true })).toHaveCount(0);
});


test('recruitment shortcuts open forms and pipeline filters restore all stages', async ({ page }) => {
  await page.goto('/recruitment');
  await page.getByRole('link', { name: 'Create requisition', exact: true }).last().click();
  await expect(page.getByRole('dialog', { name: 'Headcount requisition', exact: true })).toBeVisible();
  await examples(page);
  await page.goto('/recruitment?tab=pipeline');
  await page.getByRole('link', { name: 'Add candidate', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Candidate name', exact: true })).toBeVisible();
  await page.goto('/recruitment?tab=pipeline&stage=applied');
  await expect(page.locator('.an-rec-board section')).toHaveCount(1);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.locator('.an-rec-board section')).toHaveCount(6);
  await page.getByRole('searchbox', { name: 'Search candidates', exact: true }).fill('no such candidate');
  await expect(page.locator('.an-rec-candidate')).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.locator('.an-rec-candidate')).toHaveCount(1);
});
