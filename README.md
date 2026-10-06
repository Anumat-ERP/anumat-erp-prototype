# Anumat ERP prototype

The current Anumat browser prototype, merged from the hackathon app. It demonstrates requests, approvals, configurable approval processes, people, insights, and supporting task, meeting, document, and survey flows. Demo data and changes stay in the browser; sign-in, notifications, and sales contacts are interactive previews rather than connected services.

**Live:** https://anumat-erp.github.io/anumat-erp-prototype/

The interface supports English and Khmer, light and dark themes, and desktop and mobile layouts. Its component system uses React, Radix primitives, Tailwind CSS, and app-owned controls in `src/ui/`. The production build is a static Vite site.

The twelve-app walkthrough is in [A-to-Z prototype guide](docs/roadmap/A_TO_Z_PROTOTYPE_GUIDE.md). Start at `/work` for your personal queue. The account menu opens company settings, owner backup/restore and personal delivery simulations. Saved leave retains its working calendar; restored backups create separate company copies. Uploaded file bytes are excluded from JSON backups.

## Develop and verify

```sh
bun install --frozen-lockfile
bun run dev
bun run check-types
bun run check:i18n
bun run build
bun run test:e2e
bun run test:erp
```

The browser tests cover the main request and approval workflows, setup, authentication previews, document viewing, the process marketplace, public pages, and responsive English/Khmer layouts. The demo verification code is `123456`.

`bun run test:erp` runs the connected ERP acceptance gate: HR business rules,
recruitment, imports, permissions, desktop/mobile workflows, meetings and surveys.
Run business scenarios with `bun run test:erp tests/erp-acceptance.spec.ts`, or
keyboard and two-tab recovery scenarios with `bun run test:erp tests/erp-recovery.spec.ts`.
On a fresh machine, install the test browser with `bunx playwright install chromium`.
Inspect the results with `bunx playwright show-report playwright-report/erp`;
failures retain screenshots and traces in `test-results/erp`, and machine-readable
results are in `test-results/erp-results.json`. Each test uses an isolated browser
context and fictional data. The CI workflow runs this gate on pull requests and
pushes to `main`; it does not deploy anything. These checks verify the local
prototype, not backend security, statutory payroll or production readiness.

## Deploy

Every push to `main` builds and deploys to GitHub Pages through [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). The workflow sets the base path from this repository's name, so assets load under `/anumat-erp-prototype/`. The build also copies `index.html` to `404.html` for direct links to app routes.

`bun run build:artifact` creates a self-contained HTML version in `dist-artifact/` for sharing as a single file.

## Product delivery roadmap

See [the development roadmap](DEVELOPMENT_ROADMAP.md) for prototype-first phases and the later sellable SaaS release. [Planning details](docs/roadmap/README.md) include the twelve-app backlog, connected journeys, acceptance evidence, and customer pilot gates.

### Connected HR prototype

Open `/discover` to choose among twelve apps. In `/employees`, use **Load HR examples** as the workspace owner to create fictional employee, recruitment, course, and asset data. Existing HR work is preserved. The second demo reviewer receives explicitly limited review roles. Each HR app has its own dashboard and people/roles page.

Try recruitment → hire → employee → onboarding tasks, leave → independent approval → ledger reversal, attendance → period closure → payroll preview → independent review → freeze, training → assessment → linked evaluation, and asset assignment → return → offboarding. Compensation access is configured separately in Employee people/roles.

See [implementation status](docs/roadmap/IMPLEMENTATION_STATUS.md) for demos, test evidence, and remaining development. Payroll is illustrative; data and notification settings stay in the browser.

### Recruitment prototype

Open `/home?app=recruitment` for the funnel, approval queue and interviews. The connected local journey includes versioned job descriptions, headcount approval, career/application preview, assigned assessments, independently approved offers, and employee/onboarding handoff. See [the recruitment demo](docs/roadmap/RECRUITMENT_PROTOTYPE.md). Existing records are retained; use People & roles to grant an independent reviewer if your HR workspace was populated before this update.

### Workflow completion and commercial previews

Existing record pages now include HR **Additional workflows**, independent employee-change review, approved-request execution previews, restricted meeting notes and closed-survey improvement tasks. Open `/settings/package` for local package/trial/support decisions and `/operator` for owner-only metadata and approved one-hour selected-app record counts. No billing, external support, payment or delivery occurs. See [the A-to-Z prototype guide](docs/roadmap/A_TO_Z_PROTOTYPE_GUIDE.md) for roles, prerequisites and recovery steps; remaining advanced roadmap criteria and production work remain separate.

The final scoped advanced/commercial/foundation run passed 31 checks. Re-run it with `bun run test:erp tests/advanced-workflows-domain.spec.ts tests/advanced-workflows.spec.ts tests/commercial-domain.spec.ts tests/commercial.spec.ts tests/prototype-foundation-domain.spec.ts`. Eight new `Apps/Workflow completion` stories passed 16 desktop/mobile render checks; after rebuilding Storybook, run `bun run test:storybook -g apps-workflow-completion`.
