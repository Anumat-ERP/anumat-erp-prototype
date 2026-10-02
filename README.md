# Anumat ERP prototype · hackathon edition

A clickable prototype of **Anumat**, the decision and operations ERP:
requests, approvals and approval processes in one
workspace. Built with Material UI, themed for Anumat, and deployed to GitHub Pages.

**Live:** https://anumat-erp.github.io/anumat-erp-prototype-hackathon/

This is the **demo-day copy** of [anumat-erp-prototype](https://github.com/Anumat-ERP/anumat-erp-prototype)
in the hackathon brand: **Anumat Blue `#003D96`** and the submitted logo. The complete interface follows the user-supplied Remote marketing, setup and dashboard references: a full-height
sidebar, cool gray canvas, spacious white panels, task rows with pastel type icons,
and a smaller team column. Public pages use large rounded headings, pill buttons,
spacious floating-label setup forms and an original textured illustration.
The Anumat logo keeps its original brand blue; interface
actions use the brighter blue documented in [DESIGN.md](DESIGN.md). It also keeps the back-office interaction principles in
[anumat-erp-web/packages/brand](https://github.com/Anumat-ERP/anumat-erp-web/tree/main/packages/brand):
⌘K / Ctrl+K search, A/R/D shortcuts for approvers, exact times on hover, compact
spacing in the account menu. Motion is quiet and explains changes: pages settle in, what you just added or changed is briefly highlighted, charts grow once, and light/dark cross-fade (all off with reduced motion). Only fix demo-breaking bugs here; build new features in the main
prototype (or the real app) and copy them over deliberately.

Everything runs in the browser with demo data. Changes you make (approving a
request, adding a task, editing a process) are saved in your browser only.
Use the account menu → **Reset demo data** to start over.

## MVP experience

The main menu focuses on **Home, Requests and Approvals**. **Administration**
contains approval processes, people and roles, and insights. Meetings, tasks,
documents and surveys remain accessible by their existing routes for historical
prototype demos, but are hidden from navigation, search and the home screen.
The guided tour follows the approval MVP.

Under **Approval processes → Preset marketplace**, search six starter presets by
name or purpose, filter by category, and preview form fields and approval rules.
Choose an approver for every step and select **Use this preset** to create an
independent, paused process. Review it in the editor, save any changes, then enable
it from **Your processes**. Only admins and members with process-building access
can add presets. All preset installations remain browser-local demo data.

Choose **English / ខ្មែរ** in the app header. The core approval
interface supports Khmer; the choice is remembered on this device and switching
preserves unsaved forms. Company names, configured process names, form questions
and entered content retain their original language. Some marketing, tour narration,
advanced configuration and legacy module copy remains English.

Light and dark themes use Anumat Blue, cool gray light surfaces and navy dark surfaces,
with a self-hosted Noto Sans Khmer font. Material UI components use the same palette and fonts in both themes.
The shared setup layout supports all three existing onboarding steps, including
large selectable process cards and field validation.

Everything here is a browser-only demo. Use the account menu to switch among demo
people, choose a theme, or reset demo data. No real email or Telegram messages are sent.

## How it is built

- **Vite + React 19 + TypeScript**, React Router, Tailwind CSS v4.
- **UI:** Material UI (`@mui/material`) with Emotion. `src/ui/` contains
  app-owned adapters for the workflow-facing APIs, plus shared layout helpers.
  Buttons, fields, tables, tabs, navigation, dialogs, drawers, menus, notifications
  and typography render Material UI components. Custom clickable rows use MUI
  ButtonBase. Native date/select/file controls retain browser and mobile behavior.
- **Theme:** `src/ui/theme.tsx` configures the workspace palette, typography and
  responsive breakpoints. It follows `data-theme` so portal content and the app
  change themes together. CSS layers keep MUI above resets and below explicit
  layout utilities; `index.html` declares the order before Emotion loads.
- **Layout tokens:** `src/ui/styles/` and `src/ui/lib/` retain the original
  Anumat semantic token names for existing screen layouts. The original
  `vendor/ui/` is retained as migration provenance, excluded from application
  imports and TypeScript compilation. It is no longer synced or used at runtime.
- **Brand:** `src/styles/anumat.css` points the design system's tokens at the
  Anumat palette and fonts from
  [anumat-erp-branding](https://github.com/Anumat-ERP/anumat-erp-branding):
  Anumat Blue #003D96 remains in the logo and original palette.
  `src/styles/theme.css` applies workspace blue #285FF0, cool gray #F3F5F9,
  near-black text, Inter body copy, Plus Jakarta Sans headings and
  JetBrains Mono identifiers. Both themes include Noto Sans Khmer.
- **Data:** `src/data/seed.ts` and `src/data/seedMekong.ts` (two demo
  workspaces, dates relative to today) and `src/data/store.tsx` (reducer, saved
  to `localStorage`).
- **Contact details:** `src/config.ts` holds the support Telegram, Facebook and
  email, the sales email, the Telegram bot and optional form-service URLs. They
  are empty until you fill them in, and the app shows "Not set up yet" instead
  of a made-up link.

```
src/
  layout/Shell.tsx     AppShell, navigation, top bar
  pages/               one file per screen
  components/          app-level pieces (logo, approval timeline, decision modal…)
  data/                types, seed data, store
  styles/              app.css (entry) and anumat.css (brand layer)
src/ui/                Material UI adapters, theme and semantic layout tokens
vendor/ui/             original upstream source (reference only)
```

## Develop

```sh
bun install
bun run dev            # http://localhost:5173
bun run build          # type-check + production build into dist/
```

## UI development and verification

Edit the shared theme in `src/ui/theme.tsx` and the adapters in
`src/ui/components/`. Application code imports `@app/ui`; it does not import
`vendor/ui`. Tailwind remains for screen layouts and app-specific visuals.
Lucide remains the icon set. Demo storage and request/process data are unchanged.
No MUI X commercial packages are required.

```sh
bun run check-types
bun run build
bunx playwright install chromium  # once per development machine
bun run test:e2e                  # desktop + mobile workflow checks
```

Browser checks cover request filtering and submission, approval validation,
bulk decisions, preset installation, keyboard menus, dark mode, Khmer, mobile
navigation and the existing prototype routes. They also verify dashboard request
links preserve personal filters after reload and that page actions do not overlap
workspace utilities. Setup checks validate company details and process selection,
create a workspace and confirm persistence; sign-in checks select a demo person.
Each check uses isolated demo data. Authentication checks cover validation, password
visibility, recovery/reset, code pasting and keyboard navigation, and remembered email.

At `/signin`, use any email and password, then verification code **123456**.
Login, SSO and recovery are interactive demos. Recovery opens a local reset preview;
no email is sent and no password is saved. **Remember me** stores only the email.

## Deploy

Every push to `main` builds and deploys to GitHub Pages
(`.github/workflows/deploy.yml`). Deep links work because the build copies
`index.html` to `404.html`, which Pages serves for unknown paths.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

### Share as a single page

`bun run build:artifact` writes `dist-artifact/anumat-prototype.html`: the
whole prototype in one self-contained file (scripts, styles and fonts inlined),
with navigation kept in memory instead of the URL. Use it where you can host a
single HTML page, such as a claude.ai Artifact.
