import { expect } from '@playwright/test';
import { test, seed, state, choose } from './helpers/erp';
test('employee plan creates linked tasks, survives reload and explains incomplete closure', async ({page}) => {
  await seed(page); const e=(await state(page)).hr.employees[0]!;
  await page.goto(`/employees?record=${e.id}`);
  await page.getByText('Additional workflows',{exact:true}).click();
  await choose(page,'Choose a workflow','Start an employee plan');
  await choose(page,'Plan type','probation');
  await page.getByRole('textbox',{name:'Due date',exact:true}).fill('2026-10-15');
  await page.getByRole('button',{name:'Start an employee plan'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const p=(await state(page)).hr.plans![0]!; expect(p.taskIds).toHaveLength(3);
  await page.goto(`/employees?record=${e.id}`);await page.reload();
  await page.getByText('Additional workflows',{exact:true}).click();
  await page.getByRole('button',{name:'Close completed plan'}).click();
  await expect(page.getByRole('alert')).toContainText('Complete every linked task');
  await page.locator(`a[href="/tasks?task=${p.taskIds[0]}"]`).click();
  await expect(page.getByRole('dialog')).toHaveCount(1);
});
test('verification evidence stays pending until a different HR admin reviews it', async({page})=>{
  await seed(page);const e=(await state(page)).hr.employees[0]!;
  await page.goto(`/employees?record=${e.id}`);await page.getByText('Additional workflows',{exact:true}).click();
  await choose(page,'Choose a workflow','Add document verification evidence');
  await page.getByRole('textbox',{name:'Document name',exact:true}).fill('Fictional identity document');
  await page.getByRole('textbox',{name:'Verification evidence',exact:true}).fill('Checked the fictional document in person.');
  await page.getByRole('button',{name:'Add document verification evidence'}).click();
  expect((await state(page)).hr.employees.find(x=>x.id===e.id)!.verifications![0]!.status).toBe('pending');
  await page.goto(`/employees?record=${e.id}`);await page.getByText('Additional workflows',{exact:true}).click();
  await page.getByRole('combobox',{name:'Choose a workflow',exact:true}).click();
  await expect(page.getByRole('option',{name:'Review document evidence',exact:true})).toHaveCount(0);
});
test('course capacity and waitlist admission are available without changing the core course form',async({page})=>{
  await seed(page);const s=await state(page),c=s.hr.courses[0]!;
  await page.goto(`/training?record=${c.id}`);await page.getByText('Additional workflows',{exact:true}).click();
  await choose(page,'Choose a workflow','Set capacity and prerequisite');
  await page.getByRole('spinbutton',{name:'Course capacity',exact:true}).fill('1');
  await page.getByRole('button',{name:'Set capacity and prerequisite'}).click();
  expect((await state(page)).hr.courses.find(x=>x.id===c.id)?.capacity).toBe(1);
});
test('restricted minutes are visible to their author and hidden from another participant', async({page})=>{
  await seed(page);await page.goto('/meetings/ops-weekly');
  await choose(page,'Note type','Meeting minutes');await choose(page,'Note visibility','Selected meeting participants');
  await page.getByRole('textbox',{name:'Record meeting minutes',exact:true}).fill('Confidential fictional employment context');
  await page.getByRole('button',{name:'Record',exact:true}).click();
  await expect(page.getByText('Confidential fictional employment context',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:/^Account:/}).click();await page.getByRole('menuitem',{name:/Alex Tan/}).click();
  await expect(page.getByText('Confidential fictional employment context',{exact:true})).toHaveCount(0);
});
test('closed named survey produces a linked task using aggregate interpretation',async({page})=>{
  await seed(page);await page.goto('/surveys/party');await page.getByRole('tab',{name:'Results',exact:true}).click();
  await page.getByRole('textbox',{name:'Aggregate interpretation',exact:true}).fill('The group needs a clearer venue confirmation.');
  await page.getByRole('textbox',{name:'Improvement task',exact:true}).fill('Confirm the fictional party venue');
  await page.getByRole('button',{name:'Create improvement task',exact:true}).click();
  const s=await state(page);const task=s.tasks.find(t=>t.title==='Confirm the fictional party venue')!;
  expect(task.source?.href).toBe('/surveys/party');expect(s.surveys.find(x=>x.id==='party')!.followUps![0]!.taskId).toBe(task.id);
  await page.getByRole('link',{name:'Confirm the fictional party venue',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(1);
});
