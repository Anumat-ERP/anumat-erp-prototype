import {expect} from '@playwright/test';
import {test,seed,state,choose,actor} from './helpers/erp';
test('owner can demonstrate trial, package confirmation and cancellation with retained history',async({page})=>{
 await seed(page);const before=(await state(page)).appMembers;
 await page.goto('/settings/package');await choose(page,'Choose package preview','team');
 await page.getByRole('textbox',{name:'Package decision reason',exact:true}).fill('Fictional SME evaluation');await page.getByRole('button',{name:'Start 14-day trial preview'}).click();
 expect((await state(page)).commercial?.status).toBe('trial');expect((await state(page)).appMembers).toEqual(before);
 await page.getByRole('textbox',{name:'Package decision reason',exact:true}).fill('Confirm the example choice');await page.getByRole('button',{name:'Confirm package preview'}).click();
 await page.getByRole('textbox',{name:'Package decision reason',exact:true}).fill('Finish the example');await page.getByRole('button',{name:'Cancel package preview'}).click();
 await page.reload();expect((await state(page)).commercial?.history).toHaveLength(3);
 await actor(page,'Alex Tan');await page.goto('/settings/package');await expect(page.getByRole('button',{name:'Start 14-day trial preview'})).toHaveCount(0);
});
test('support request becomes a scoped expiring count preview and remains owner-only in operator view',async({page})=>{
 await seed(page);await page.goto('/settings/package');
 await page.getByRole('textbox',{name:'Support subject',exact:true}).fill('Fictional task setup question');await page.getByRole('textbox',{name:'Describe the problem',exact:true}).fill('Please explain the prototype task workflow.');await page.getByRole('button',{name:'Save support request preview'}).click();
 await page.getByRole('textbox',{name:'Support decision reason',exact:true}).fill('Allow selected app count for this demo');await page.getByRole('button',{name:'Approve scoped support preview'}).click();
 await page.getByRole('link',{name:'Operator preview',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Approved support scope'})).toContainText('Task management');
 await page.clock.fastForward(60*60*1000+1);await expect(page.getByRole('status').filter({hasText:'Approved support scope'})).toHaveCount(0);await expect(page.getByRole('status').filter({hasText:'Support access expired'})).toBeVisible();
 await page.getByRole('textbox',{name:'Support decision reason',exact:true}).fill('Question resolved in demonstration');await page.getByRole('button',{name:'Resolve support request preview'}).click();await expect(page.getByRole('status').filter({hasText:'Approved support scope'})).toHaveCount(0);
 await actor(page,'Alex Tan');await page.goto('/operator');await expect(page.getByRole('status')).toContainText('Only a workspace owner');
});
