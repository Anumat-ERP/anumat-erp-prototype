# Anumat redesign on shadcn/ui

Date: 2026-10-02 · Branch: `redesign/shadcn` · Status: approved in conversation

## Goal

Move the whole Anumat prototype from Material UI to the default shadcn/ui design
system, restyle it with a navy-and-mint palette, rebuild the workspace Home as an
action-first dashboard, and rebuild the landing page from the team's Anumat poster.
No workflow may break: every route, form, demo flow, English/Khmer, light/dark and
mobile behaviour that works on `main` keeps working.

## Decisions made

| Topic | Decision |
|---|---|
| Scope | Whole app, in three stages, one commit per stage |
| Palette | C — logo navy primary, Mintlify mint accent |
| Home | B — action first: Ask → Approve → Execute → Track strip, then "Waiting on you", then charts |
| Landing | Eight sections built from the poster (order below) |
| Technical approach | Rebuild the app-owned `@app/ui` layer on shadcn (Radix + Tailwind + cva), keeping its exported names and props |
| Theme default | Light, unless the person has chosen dark |

## Palette C tokens

shadcn's standard CSS variables are the source of truth. The existing `--a-color-*`
variables become aliases, so every Tailwind class already used by pages
(`bg-surface`, `text-fg-muted`, `border-border`, …) keeps working.

| Role | Light | Dark |
|---|---|---|
| background | `#f8fafc` | `#0a0f1a` |
| card / popover | `#ffffff` | `#0f1626` |
| foreground | `#0b1b33` | `#e8edf5` |
| primary | `#003d96` (logo navy) | `#8fb4ff` |
| primary-foreground | `#ffffff` | `#0a1a3a` |
| secondary / muted / accent | `#f1f5f9` | `#1a2335` |
| muted-foreground | `#526077` | `#a3b0c4` |
| border / input | `#e2e8f0` / `#cbd5e1` | `#1e2738` / `#334155` |
| ring | `#003d96` | `#8fb4ff` |
| mint (success, progress, chart) | `#0c8c5e`, tint `#d9f7eb` | `#18e299`, tint `#123528` |
| destructive | `#b91c1c` | `#f87171` |
| chart-1…5 | navy, mint, `#5b8def`, `#18e299`, `#f59e0b` | lighter equivalents |

Every text/background pair must meet WCAG AA (4.5:1 for body text).
Type: Inter for Latin; Kantumruy Pro → Battambang → Noto Sans Khmer for Khmer.
Plus Jakarta Sans is retired. Radius follows shadcn's default `--radius: 0.625rem`.

Status labels follow the poster: To do (draft), In review (pending), Changes
requested, Approved, Rejected (declined). Only the labels change; stored states do not.

## Stage 1 — foundation

- Add shadcn's dependencies: `radix-ui`, `sonner`, `recharts`; keep `cva`, `clsx`, `tailwind-merge`, `lucide-react`.
- New `src/ui/styles/shadcn.css` defines the palette tokens and maps them into Tailwind
  (`bg-background`, `text-muted-foreground`, `bg-sidebar`, `chart-*`) beside the existing names.
- Rebuild every MUI-backed `@app/ui` component on Radix/Tailwind with the same exports and
  props. A component's accessibility contract (labels, `aria-*`, focus, keyboard) must stay
  equal or better.
- Replace direct `@mui/*` imports in the ten app files outside `src/ui`.
- Remove MUI and Emotion from `package.json`, `MaterialProvider` becomes a theme-observing
  provider with no MUI, and all `.Mui*` CSS overrides are deleted.

## Stage 2 — workspace

- shadcn sidebar shell: collapsible to icons on desktop, sheet on mobile; workspace switcher
  at the top, account at the bottom. Groups: **Workspace** (Dashboard, Requests, Approvals
  with count, Tasks, Insights) and **Administration** (Approval processes, Templates, People & roles).
- Top bar: sidebar toggle, breadcrumb, ⌘K search, language, theme toggle, help, notifications.
- Home (layout B): greeting + New request; flow strip with live counts (Ask = your drafts,
  Approve = waiting on you, Execute = open tasks, Track = approved this month); "Waiting on
  you" list beside a decision-time card and "Your requests"; a 30-day requests chart
  (submitted vs approved, shadcn Chart) beside recent activity. All counts come from the store.
- Requests, Approvals and Processes adopt shadcn table, card and badge styling.

## Stage 3 — public pages

Landing order: Hero (Ask → Approve → Move forward) · Problem → Solution (before/after) ·
How it works (four steps + feedback loop) · Features (poster §5 with §8 as descriptions) ·
Who it's for · Pilot & pricing (Free/Pro/Enterprise, Pilot → Learn → Improve → Scale, free
during the pilot) · Team & vision · Closing ("Turn requests into real progress").
Government and slogan boxes are left out. Pricing, sign-in and setup are restyled to match.
All new copy is added to the Khmer messages.

## Verification after every stage

- `bun run check-types`, `bun run check:i18n`
- The axe-core + overflow audit across light/dark, English/Khmer, desktop/tablet/phone
- Playwright e2e (`bun run test:e2e`), with MUI-specific selectors and colour assertions
  replaced by behavioural ones
- Screenshot review of every changed route

## Out of scope

New product features, backend or authentication, changes to stored data shapes, and the
historical meeting/document/survey routes beyond what the shared components restyle.
