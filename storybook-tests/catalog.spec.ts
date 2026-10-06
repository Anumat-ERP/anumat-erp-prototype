import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const index=JSON.parse(readFileSync('storybook-static/index.json','utf8')) as {entries:Record<string,{id:string;type:string;title:string}>};
const stories=Object.values(index.entries).filter(e=>e.type==='story');
// Each published story must render on both devices. Test the built artifact, including lazy chunks.
for(const story of stories) test(`renders ${story.id}`,async({page})=>{
  const errors:string[]=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
  await expect(page.locator('#storybook-root > *').first()).toBeAttached();
  await expect(page.locator('.sb-errordisplay')).not.toBeVisible();
  expect(errors).toEqual([]);
});

test('interactive controls, translated errors, and isolated data',async({page})=>{
  await page.goto('/iframe.html?id=components-overlays-modal--default&viewMode=story');
  await page.getByRole('button',{name:'Open confirmation'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button',{name:'Open confirmation'})).toBeFocused();
  await page.goto('/iframe.html?id=patterns-approval-simulation--full-route&viewMode=story');
  await page.getByRole('button',{name:'Start simulation',exact:true}).click();
  await page.getByRole('button',{name:'Simulate approval',exact:true}).click();
  await page.getByRole('button',{name:'Simulate approval',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('approved');
  expect(await page.evaluate(()=>localStorage.getItem('anumat-hackathon-v1'))).toBeNull();
  await page.goto('/iframe.html?id=components-forms-datepicker--invalid-date&viewMode=story&globals=locale:km;theme:dark');
  await expect(page.getByRole('alert')).toBeVisible();
  expect(await page.locator('html').getAttribute('data-theme')).toBe('dark');
  expect(await page.locator('html').getAttribute('lang')).toBe('km');
  await expect(page.getByRole('alert')).not.toContainText('Enter a real date');
});

test('app examples and documentation',async({page},info)=>{
  for(const id of ['apps-workspace--discover','apps-workspace--tasks-viewer','apps-workspace--notification-preferences','patterns-approval-simulation--full-route']) {
    await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=locale:km;theme:dark`);
    await expect(page.locator('#storybook-root > *').first()).toBeAttached();
    await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
    await page.evaluate(()=>document.fonts.ready);
    await info.attach(id,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  }
  await page.goto('/?path=/docs/welcome-anumat--docs');
  if(info.project.name==='mobile') await expect(page.getByRole('button',{name:'Open navigation menu'})).toBeVisible();
  else await expect(page.getByRole('link',{name:'Anumat · UI Library'})).toBeVisible();
  const frame=page.frameLocator('#storybook-preview-iframe');
  await expect(frame.locator('h1').filter({hasText:'Anumat UI library'})).toBeVisible();
});

test('HR stories preserve scoped fields and run local candidate transitions', async ({ page }, info) => {
  await page.goto('/iframe.html?id=apps-hr-lifecycle--employee-self-service&viewMode=story');
  await expect(page.getByRole('dialog', { name: 'Alex Tan', exact: true })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Illustrative base pay', exact: true })).toHaveCount(0);
  await page.goto('/iframe.html?id=apps-hr-lifecycle--candidate-details&viewMode=story');
  await page.getByRole('button', { name: 'Shortlist', exact: true }).click();
  await page.getByRole('dialog', { name: 'Shortlist', exact: true }).getByRole('button', { name: 'Confirm action', exact: true }).click();
  await expect(page.getByText('Shortlisted', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('anumat-hackathon-v1'))).toBeNull();
  await page.goto('/iframe.html?id=apps-hr-lifecycle--employee-khmer-dark&viewMode=story');
  await expect(page.getByRole('heading', { name: 'ការគ្រប់គ្រងបុគ្គលិក', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await info.attach('hr-khmer-dark', { body: await page.screenshot({ fullPage: true, animations: 'disabled' }), contentType: 'image/png' });
});
