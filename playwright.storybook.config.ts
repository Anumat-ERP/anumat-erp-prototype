import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './storybook-tests', fullyParallel: true, workers: 4,
  use: {baseURL:'http://127.0.0.1:6007',trace:'retain-on-failure'},
  projects: [{name:'desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:1000}}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}],
  webServer:{command:'python3 -m http.server 6007 --bind 127.0.0.1 --directory storybook-static',url:'http://127.0.0.1:6007',reuseExistingServer:false},
});
