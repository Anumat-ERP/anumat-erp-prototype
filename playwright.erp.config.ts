import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig(base, {
  // A repeatable acceptance gate for the connected prototype, including its
  // existing recruitment, privacy, import, survey and meeting regressions.
  testMatch: [
    '**/commercial-domain.spec.ts',
    '**/commercial.spec.ts',
    '**/advanced-workflows-domain.spec.ts',
    '**/advanced-workflows.spec.ts',
    '**/prototype-foundation-domain.spec.ts',
    '**/prototype-foundation.spec.ts',
    '**/erp-acceptance.spec.ts',
    '**/erp-recovery.spec.ts',
    '**/hr-domain.spec.ts',
    '**/recruitment-domain.spec.ts',
    '**/workflow-domain.spec.ts',
    '**/hr-workspace.spec.ts',
    '**/hr-workspace-ux.spec.ts',
    '**/app-workflows.spec.ts',
    '**/candidate-stages.spec.ts',
    '**/recruitment-workspace.spec.ts',
    '**/app-people.spec.ts',
    '**/meeting-lifecycle.spec.ts',
  ],
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: 0,
  outputDir: 'test-results/erp',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/erp', open: 'never' }],
    ['json', { outputFile: 'test-results/erp-results.json' }],
  ],
  use: { actionTimeout: 10_000, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: base.projects!.map(project => ({
    ...project,
    // Pure domain tests do not depend on screen size; run them once.
    ...(project.name === 'mobile' ? { testIgnore: '**/*-domain.spec.ts' } : {}),
  })),
});
