# Anumat shadcn Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Material UI with shadcn/ui across Anumat, apply palette C, rebuild Home (layout B) and the landing page from the poster, without breaking any workflow.

**Architecture:** shadcn's CSS variables become the colour source of truth and the old `--a-color-*` names alias them, so existing Tailwind classes keep working. Every `@app/ui` component keeps its exported name and props but is rebuilt on Radix primitives + Tailwind + cva (the shadcn recipe). Pages change only where the redesign asks for it (shell, Home, landing, public pages).

**Tech Stack:** React 19, Vite 7, Tailwind v4, `radix-ui`, `class-variance-authority`, `tailwind-merge`, `lucide-react`, `sonner` (toasts), `recharts` (shadcn Chart), Playwright.

**Spec:** `docs/superpowers/specs/2026-10-02-shadcn-redesign-design.md`

## Global Constraints

- Every export of `src/ui/index.ts` keeps its name and prop types; pages compile without edits after Stage 1.
- No `@mui/*` or `@emotion/*` import remains after Task 5; both are removed from `package.json`.
- Colours only through tokens (no literal hex in components). Body text ≥ 4.5:1 contrast in light and dark.
- Mint `#0c8c5e` is for fills, icons and charts only; success text uses `#0a6b47` (light) / `#6ee7b7` (dark).
- Khmer: every new user-facing string goes through `tr()` and gets a `km` entry; `bun run check:i18n` stays clean.
- Theme default is light; `localStorage['anumat-theme']` still wins.
- Keyboard and screen-reader contracts of each component stay equal or better (labels, `aria-*`, focus return, Escape).
- One commit per task; run `bun run check-types` before each commit.

## Review Focus

1. Khmer text in compact controls (select triggers, badges, nav rows, tabs) must not clip combining marks — Task 3/7 screenshot checks in `km`.
2. Portaled surfaces (dialog, sheet, menu, popover, select list, toast) must follow dark mode — Task 4 checks each open in dark.
3. Escape closes every overlay and focus returns to its trigger — Task 4 e2e test `overlays restore focus`.
4. On a 390px phone the sidebar sheet closes after choosing a link and no page scrolls sideways — Task 7 e2e test and the overflow audit.
5. Home with an empty or reset store shows zeros and empty states, not errors — Task 9 e2e test `home survives reset demo data`.

---

## File structure

| File | Responsibility |
|---|---|
| `src/ui/styles/shadcn.css` (new) | Palette C tokens (light/dark), Tailwind `@theme inline` mapping for shadcn names, aliases for `--a-color-*` |
| `src/ui/components/*.tsx` | Same exports, rebuilt on Radix/Tailwind |
| `src/ui/components/sidebar.tsx` (new) | shadcn sidebar primitives used by AppShell (provider, collapse state, mobile sheet) |
| `src/ui/components/chart.tsx` (new) | shadcn Chart container/tooltip around recharts |
| `src/ui/theme.tsx` | `MaterialProvider` kept as an alias of a new `ThemeProvider` that only observes `data-theme` |
| `src/layout/Shell.tsx` | New nav groups, top bar, breadcrumb |
| `src/pages/Home.tsx` + `src/components/home/*` (new) | Layout B: `FlowStrip`, `WaitingList`, `DecisionTimeCard`, `RequestsChart` |
| `src/pages/Landing.tsx` + `src/components/landing/*` (new) | Eight poster sections, one file per section |
| `src/styles/theme.css` | Loses all `.Mui*` rules and the Remote-specific layout CSS that the new shell replaces |
| `tests/*.spec.ts` | Behavioural selectors instead of MUI classes; new tests from Review Focus |

---

### Task 1: Tokens, dependencies and theme default

**Files:**
- Create: `src/ui/styles/shadcn.css`
- Modify: `src/ui/styles/globals.css` (import order), `src/styles/theme.css:1-110` (remove the palette block, keep fonts), `index.html` (theme default), `package.json`, `playwright.config.ts`

**Interfaces:**
- Produces: Tailwind classes `bg-background text-foreground bg-card bg-primary text-primary-foreground bg-muted text-muted-foreground bg-accent border-border border-input ring-ring bg-sidebar text-sidebar-foreground bg-sidebar-accent bg-mint text-mint-foreground bg-mint-subtle text-success-subtle-fg fill-chart-1…5`; CSS vars `--radius`, `--chart-1…5`; every existing `--a-color-*` still resolves.

- [ ] **Step 1: Install dependencies**

Run: `bun add radix-ui sonner recharts && npx playwright install chromium`
Expected: three packages added; Playwright chromium downloaded.

- [ ] **Step 2: Write `src/ui/styles/shadcn.css`**

```css
/* Palette C: logo navy primary, Mintlify mint accent. shadcn variable names are the source of truth. */
:root, [data-theme='light'] {
  color-scheme: light;
  --radius: 0.625rem;
  --background: #f8fafc; --foreground: #0b1b33;
  --card: #ffffff; --card-foreground: #0b1b33;
  --popover: #ffffff; --popover-foreground: #0b1b33;
  --primary: #003d96; --primary-foreground: #ffffff;
  --primary-hover: #00347f; --primary-active: #002b69;
  --secondary: #f1f5f9; --secondary-foreground: #0b1b33;
  --muted: #f1f5f9; --muted-foreground: #526077;
  --accent: #eef3fb; --accent-foreground: #003d96;
  --destructive: #b91c1c; --destructive-foreground: #ffffff;
  --border: #e2e8f0; --input: #cbd5e1; --ring: #003d96;
  --mint: #0c8c5e; --mint-foreground: #ffffff; --mint-subtle: #d9f7eb; --mint-subtle-foreground: #0a6b47;
  --chart-1: #003d96; --chart-2: #0c8c5e; --chart-3: #5b8def; --chart-4: #18e299; --chart-5: #f59e0b;
  --sidebar: #ffffff; --sidebar-foreground: #334155; --sidebar-accent: #e8eefb;
  --sidebar-accent-foreground: #003d96; --sidebar-border: #e7ebf0;
}
[data-theme='dark'] {
  color-scheme: dark;
  --background: #0a0f1a; --foreground: #e8edf5;
  --card: #0f1626; --card-foreground: #e8edf5;
  --popover: #111a2c; --popover-foreground: #e8edf5;
  --primary: #8fb4ff; --primary-foreground: #0a1a3a;
  --primary-hover: #a9c5ff; --primary-active: #c2d6ff;
  --secondary: #1a2335; --secondary-foreground: #e8edf5;
  --muted: #1a2335; --muted-foreground: #a3b0c4;
  --accent: #15264a; --accent-foreground: #c2d6ff;
  --destructive: #f87171; --destructive-foreground: #1f0a0a;
  --border: #1e2738; --input: #334155; --ring: #8fb4ff;
  --mint: #18e299; --mint-foreground: #062b1c; --mint-subtle: #123528; --mint-subtle-foreground: #6ee7b7;
  --chart-1: #8fb4ff; --chart-2: #18e299; --chart-3: #4d86ff; --chart-4: #0c8c5e; --chart-5: #fbbf24;
  --sidebar: #0d1320; --sidebar-foreground: #c3cdda; --sidebar-accent: #15264a;
  --sidebar-accent-foreground: #c2d6ff; --sidebar-border: #1e2738;
}
/* The existing app vocabulary now points at the shadcn tokens. */
:root, [data-theme='light'], [data-theme='dark'] {
  --a-color-bg: var(--background); --a-color-fg: var(--foreground);
  --a-color-surface: var(--card); --a-color-surface-muted: var(--muted);
  --a-color-surface-sunken: color-mix(in oklab, var(--muted) 80%, var(--foreground) 4%);
  --a-color-surface-hover: var(--muted); --a-color-surface-active: var(--accent);
  --a-color-surface-selected: var(--accent);
  --a-color-border: var(--border); --a-color-border-subtle: var(--border);
  --a-color-border-strong: var(--input); --a-color-border-input: var(--input);
  --a-color-ring: var(--ring);
  --a-color-fg-muted: var(--muted-foreground); --a-color-fg-subtle: var(--muted-foreground);
  --a-color-fg-link: var(--primary);
  --a-color-primary: var(--primary); --a-color-primary-hover: var(--primary-hover);
  --a-color-primary-active: var(--primary-active); --a-color-primary-fg: var(--primary-foreground);
  --a-color-primary-subtle: var(--accent); --a-color-primary-subtle-fg: var(--accent-foreground);
  --a-color-primary-border: var(--ring);
  --a-color-success: var(--mint); --a-color-success-fg: var(--mint-foreground);
  --a-color-success-subtle: var(--mint-subtle); --a-color-success-subtle-fg: var(--mint-subtle-foreground);
  --a-color-critical: var(--destructive); --a-color-critical-fg: var(--destructive-foreground);
}
@theme inline {
  --color-background: var(--background); --color-foreground: var(--foreground);
  --color-card: var(--card); --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover); --color-popover-foreground: var(--popover-foreground);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary); --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted); --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent); --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive); --color-destructive-foreground: var(--destructive-foreground);
  --color-input: var(--input);
  --color-mint: var(--mint); --color-mint-foreground: var(--mint-foreground);
  --color-mint-subtle: var(--mint-subtle); --color-mint-subtle-foreground: var(--mint-subtle-foreground);
  --color-chart-1: var(--chart-1); --color-chart-2: var(--chart-2); --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4); --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar); --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-accent: var(--sidebar-accent); --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
}
```

Import it in `globals.css` after `theme.generated.css`, and delete the light/dark palette blocks from `src/styles/theme.css` (keep `@font-face`, `--an-font-khmer`, Khmer line heights). Set `--a-font-sans` to Inter + Khmer stack and remove `--an-font-display` users (replace with `--a-font-sans`).

- [ ] **Step 3: Light by default** — in `index.html`'s pre-paint script, use the saved theme or `light`; stop reading `prefers-color-scheme`.

- [ ] **Step 4: Verify** — `bun run check-types` passes; run the audit script on `/home`, `/requests` in light and dark; contrast violations: 0.

- [ ] **Step 5: Commit** — `git commit -m "Add palette C shadcn tokens and alias existing colour names"`

### Task 2: Display primitives

**Files:** Modify `src/ui/components/{button,text,card,badge,avatar,divider,link,tag,banner,progress-bar,spinner}.tsx`

**Interfaces:** Same exports and props as today (see each file). `buttonVariants({variant,size})` stays exported and now returns the shadcn class string used by `Button`.

- [ ] **Step 1: Button** — cva with variants `primary` (bg-primary text-primary-foreground hover:bg-primary-hover), `secondary` (border border-input bg-card hover:bg-muted), `tertiary` (hover:bg-muted text-foreground), `critical` (bg-destructive text-destructive-foreground), `plain` (text-primary underline-offset-4 hover:underline, no padding); sizes sm h-8 px-3 text-sm, md h-9 px-4, lg h-10 px-6; `rounded-md font-medium gap-2 focus-visible:ring-2 ring-ring ring-offset-2 disabled:opacity-50`. `asChild` uses Radix `Slot`. `loading` shows `Spinner` and sets `aria-busy`. `fullWidth` → `w-full`. IconButton: square `size-9` (sm `size-8`), `aria-label` + `title` from `label`.
- [ ] **Step 2: Text** — render `as ?? DEFAULT_ELEMENT[variant]` directly (no Typography). Card → `rounded-xl border bg-card text-card-foreground` with `p-5 sm:p-6` unless `flush`; muted tone → `bg-muted`. CardHeader title `text-base font-semibold`, description `text-sm text-muted-foreground`.
- [ ] **Step 3: Badge/Tag/Avatar/Divider/Link/Banner/ProgressBar** — shadcn Badge shapes (`rounded-md border px-2 text-xs font-medium`, sm h-5, md h-6) with tones mapped: success→mint-subtle, warning→amber, critical→destructive tint, info/primary→accent, neutral→muted; dot uses `bg-current`. Avatar: Radix Avatar with initials fallback, sizes 24/32/40/48/64. Divider: Radix Separator (label variant keeps text between rules). Link: `text-primary underline-offset-4`, tones; Banner: shadcn Alert (role="status", critical role="alert") with icon, title, actions, dismiss IconButton. ProgressBar: Radix Progress with `aria-labelledby`, indeterminate when value is null.
- [ ] **Step 4: Verify** — `bun run check-types`; screenshot `/home` and `/requests/PR-1042` light/dark.
- [ ] **Step 5: Commit** — `git commit -m "Rebuild display primitives on shadcn"`

### Task 3: Form controls

**Files:** Modify `src/ui/components/{input,textarea,select,checkbox,selection-checkbox,switch,radio-group,date-picker,search-field,password-input,code-input}.tsx`, `src/styles/theme.css` (floating-label rules rewritten without `.Mui*`)

**Interfaces:** Same props. `Select` keeps `options`, `<option>`/`<optgroup>` children, `placeholder`, `size`, `onChange(event)` where `event.target.value` is the chosen value (wrap Radix `onValueChange` in a synthetic `{ target: { value } }` object), `value`, `defaultValue`, `aria-label`, Field wiring and the floating-label mode.

- [ ] **Step 1: Input/Textarea** — native `<input>`/`<textarea>` with `h-9 rounded-md border border-input bg-card px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive`; wrapper `relative flex items-center` for prefix/suffix/clear button; floating mode renders the Field label inside (`an-floating-field` class kept, CSS rewritten for plain elements: label absolutely positioned, `peer-placeholder-shown` / `:focus-within` / `[data-filled]` move it up). Character count via `CharacterCount`. Textarea `autoGrow` uses `field-sizing: content` with `max-height` from `maxRows`.
- [ ] **Step 2: Select** — Radix Select: trigger matches Input styles (`[&>span]:line-clamp-1`, `min-h-9`, Khmer `py-1.5`), content `bg-popover text-popover-foreground rounded-md border shadow-md max-h-[min(420px,60vh)]`, groups via `SelectGroup` + `SelectLabel`, placeholder via `SelectValue placeholder`. Radix forbids `value=""` items: map an empty-string option to the sentinel `__empty__` and back.
- [ ] **Step 3: Checkbox/SelectionCheckbox/Switch/RadioGroup** — Radix Checkbox (`size-4 rounded-[4px] border-input data-[state=checked]:bg-primary`), indeterminate via `checked="indeterminate"`; label as `<label htmlFor>`; `onChange` callers receive a synthetic event `{ target: { checked } }`. SelectionCheckbox stops click/keydown/pointerdown propagation as today. Switch = Radix Switch with `role="switch"`. RadioGroup = Radix RadioGroup inside `<fieldset>` + `<legend>`; RadioGroupItem keeps `value`, `label`, `helpText`.
- [ ] **Step 4: DatePicker/SearchField/PasswordInput/CodeInput** — DatePicker = labelled native `type="date"` Input; SearchField spinner uses `Spinner`; the other two only consume Input.
- [ ] **Step 5: Verify** — check-types; `/requests/new`, `/processes/proc-purchase`, `/settings/people`, `/signin`, `/welcome` in `km` light/dark and 390px; open one select in each; no clipping, no double borders.
- [ ] **Step 6: Commit** — `git commit -m "Rebuild form controls on shadcn"`

### Task 4: Overlays, menus, tabs, accordion, toast

**Files:** Modify `src/ui/components/{modal,drawer,popover,action-menu,tooltip,toast,tabs,accordion}.tsx`; create `tests/overlays.spec.ts`

**Interfaces:** Same props. `useToast().toast({title, description, tone, action, duration})` returns an id; `dismiss(id?)`. Popover keeps `Popover/PopoverTrigger(asChild)/PopoverContent(align, side, sideOffset, flush)`. Tabs keep `Tabs/TabsList(fitted)/TabsTrigger(value,badge,badgeLabel)/TabsContent(value, forceMount)` and the rule that `aria-controls` is set only when a panel is rendered.

- [ ] **Step 1: Write the failing test** `tests/overlays.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('overlays restore focus', async ({ page }) => {
  await page.goto('/requests/PR-1042');
  const decline = page.getByRole('button', { name: 'Decline', exact: true }).first();
  await decline.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(decline).toBeFocused();

  await page.goto('/requests');
  const status = page.getByRole('group', { name: 'Filters' }).getByRole('button', { name: 'Status' });
  await status.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(status).toBeFocused();
});
```

Run: `bun run test:e2e -- tests/overlays.spec.ts --project desktop` — record whether it passes on MUI (baseline); it must pass after the rebuild.

- [ ] **Step 2: Modal/Drawer** — Radix Dialog; Drawer = shadcn Sheet (side left/right, widths sm 320 / md 480 / lg 640, full width on phones). Title `DialogTitle` (sr-only when `hideTitle`), description, close IconButton labelled `tr('Close')`, footer via `ModalFooterActions`. `trigger` uses `DialogTrigger asChild`.
- [ ] **Step 3: Popover/ActionMenu/Tooltip** — Radix Popover (`aria-haspopup="dialog"` on trigger, content role dialog), Radix DropdownMenu for ActionMenu (sections → `DropdownMenuGroup` + `DropdownMenuLabel` + `DropdownMenuSeparator`, `href` items render `<a>` via `asChild`, destructive items `text-destructive`, helpText under the label), Radix Tooltip with the provider's delay.
- [ ] **Step 4: Toast/Tabs/Accordion** — ToastProvider renders sonner `<Toaster position="bottom-center" />` themed by `data-theme`; `toast()` maps tone to `toast.success/error/message`, `action` to sonner action. Tabs = Radix Tabs styled as shadcn underline tabs (scrollable list on phones). Accordion = Radix Accordion keeping `type`, `collapsible`, controlled value.
- [ ] **Step 5: Verify** — overlays test passes; open each overlay in dark mode and check surfaces use `bg-popover`.
- [ ] **Step 6: Commit** — `git commit -m "Rebuild overlays, menus, tabs and toasts on Radix"`

### Task 5: Tables, navigation, shell primitives; remove MUI

**Files:** Modify `src/ui/components/{data-table,navigation,app-shell}.tsx`, `src/ui/theme.tsx`, `src/main.tsx`, the ten files importing `ButtonBase`, `src/styles/theme.css`, `tests/material-ui.spec.ts`, `package.json`, `index.html` (`@layer` order without `mui`)

- [ ] **Step 1: DataTable** — swap MUI Table parts for `<table><thead><tbody><tfoot><tr><th><td>` with the same classes (`TableCell component={th}` becomes `<th scope=…>`). Keep all logic.
- [ ] **Step 2: Navigation** — `<nav><ul>` sections; items render `renderLink` output with classes `flex h-9 items-center gap-3 rounded-md px-3 text-sm hover:bg-sidebar-accent aria-[current=page]:bg-sidebar-accent aria-[current=page]:text-sidebar-accent-foreground aria-[current=page]:font-semibold`, badge as Badge, section title `px-3 text-xs font-medium text-muted-foreground` (sentence case).
- [ ] **Step 3: ButtonBase** — replace each `<ButtonBase …>` with `<button type="button" …>` keeping props; add `focus-visible:outline-2 focus-visible:outline-ring` where the old element relied on ButtonBase focus styling.
- [ ] **Step 4: ThemeProvider** — `theme.tsx` exports `ThemeProvider` (observes `data-theme`, provides `useThemeMode()`), and `MaterialProvider = ThemeProvider` for compatibility; update `main.tsx` to `ThemeProvider`.
- [ ] **Step 5: Remove MUI** — `bun remove @mui/material @emotion/react @emotion/styled`; delete every `.Mui*` rule from `src/styles/theme.css`; replace `.MuiDrawer-paper` selectors in tests with `getByRole('dialog', { name: 'Navigation' })`; replace the `rgb(40, 95, 240)` assertion with `rgb(0, 61, 150)`.
- [ ] **Step 6: Verify** — `grep -r "@mui\|@emotion\|Mui" src tests` returns nothing; check-types; `bun run build`; full e2e suite; full audit (12 routes × 5 variants) with 0 axe violations and 0 overflow.
- [ ] **Step 7: Commit** — `git commit -m "Finish shadcn migration and remove Material UI"` (Stage 1 complete)

### Task 6: Status vocabulary

**Files:** Modify `src/components/StatusBadge.tsx`, `src/i18n/messages.ts` (labels), `src/pages/Requests.tsx` (filter labels)

- [ ] **Step 1:** Map stored statuses to poster labels: `draft → To do`, `pending → In review`, `changes → Changes requested`, `approved → Approved`, `declined → Rejected`; tones neutral / warning / attention / success / critical. Add Khmer: `To do: 'ត្រូវធ្វើ'`, `In review: 'កំពុងពិនិត្យ'`, `Rejected: 'បានបដិសេធ'` (keep existing km entries for the rest).
- [ ] **Step 2:** Update e2e expectations that read old labels (`Pending`, `Declined`, `Draft`).
- [ ] **Step 3:** check-types, check:i18n, e2e. Commit `git commit -m "Use poster status vocabulary"`

### Task 7: Sidebar shell and top bar

**Files:** Create `src/ui/components/sidebar.tsx`; modify `src/ui/components/app-shell.tsx`, `src/layout/Shell.tsx`, `src/styles/theme.css` (remove `.an-sidebar*`, `.an-utilities`, `.an-main` Remote layout rules); create `tests/shell.spec.ts`

**Interfaces:**
- Produces: `SidebarProvider({defaultCollapsed})`, `useSidebar(): { collapsed: boolean; setCollapsed(v): void; mobileOpen: boolean; setMobileOpen(v): void }`, `SidebarTrigger` (IconButton labelled "Toggle sidebar"). AppShell gains `breadcrumb?: ReactNode`; existing props unchanged. Collapsed state persists in `localStorage['anumat-sidebar']`.

- [ ] **Step 1: Failing test** `tests/shell.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('sidebar groups and collapse', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/home');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  for (const name of ['Dashboard', 'Requests', 'Approvals', 'Tasks', 'Insights', 'Approval processes', 'Templates', 'People & roles'])
    await expect(nav.getByRole('link', { name: new RegExp(`^${name}`) })).toBeVisible();
  await page.getByRole('button', { name: 'Toggle sidebar' }).click();
  await expect(nav.getByRole('link', { name: /^Requests/ })).toHaveAttribute('data-collapsed', 'true');
});

test('mobile sheet closes after navigating', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile');
  await page.goto('/home');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  const sheet = page.getByRole('dialog', { name: 'Navigation' });
  await sheet.getByRole('link', { name: /^Requests/ }).click();
  await expect(page).toHaveURL(/\/requests$/);
  await expect(sheet).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});
```

Run and confirm FAIL (no Tasks/Insights/Templates links, no toggle).

- [ ] **Step 2: Implement** — sidebar 16rem / 3.5rem collapsed (icons with Tooltip labels, `data-collapsed`), sheet on `<md`. Header: workspace switcher. Footer: account menu. Top bar (sticky, `h-14 border-b bg-background/80 backdrop-blur`): SidebarTrigger, breadcrumb (`Workspace / {page title}` from route map), right side SearchField-style ⌘K button opening `CommandPalette`, LanguageSwitch, theme toggle IconButton, help, Notifications. Nav: Workspace — Dashboard `/home`, Requests, Approvals (badge = waiting count), Tasks `/tasks`, Insights `/insights`; Administration — Approval processes `/processes`, Templates `/processes#templates`, People & roles `/settings/people`. Add `id="templates"` to the ProcessMarketplace section.
- [ ] **Step 3: Verify** — shell tests pass; full e2e; audit routes at 390/900/1440.
- [ ] **Step 4: Commit** — `git commit -m "Add shadcn sidebar shell and top bar"`

### Task 8: Home — layout B

**Files:** Create `src/components/home/{FlowStrip,WaitingList,DecisionTimeCard,RequestsChart}.tsx`, `src/ui/components/chart.tsx`; modify `src/pages/Home.tsx`, `src/ui/index.ts` (export chart); create `tests/home.spec.ts`

**Interfaces:**
- Consumes: `useStore()` state (`requests`, `tasks`, current user), `waitingOnMe(state)` from `src/data/store`.
- Produces: `homeCounts(state, userId): { ask: number; approve: number; execute: number; track: number }` in `src/components/home/counts.ts` — ask = user's drafts, approve = `waitingOnMe(state).length`, execute = open tasks assigned to the user, track = requests approved in the last 30 days. `requestsByDay(state, days = 30): Array<{ date: string; submitted: number; approved: number }>`. `averageDecisionDays(state): number | null`.

- [ ] **Step 1: Failing test** `tests/home.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('home shows the flow strip with live counts', async ({ page }) => {
  await page.goto('/home');
  const flow = page.getByRole('list', { name: 'Ask, approve, execute, track' });
  await expect(flow.getByRole('listitem')).toHaveCount(4);
  await expect(flow.getByRole('link', { name: /Approve.*4/ })).toHaveAttribute('href', '/approvals');
  await expect(page.getByRole('heading', { name: 'Waiting on you' })).toBeVisible();
  await expect(page.getByRole('figure', { name: /Requests over time/ })).toBeVisible();
});

test('home survives reset demo data', async ({ page }) => {
  await page.goto('/home');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('text=NaN')).toHaveCount(0);
});
```

Run: FAIL (no flow strip).

- [ ] **Step 2: Implement** — header row: greeting h1 + subtitle + New request button. FlowStrip: `<ol aria-label="Ask, approve, execute, track">` of four linked cards (Ask → `/requests?mine=1`, Approve → `/approvals`, Execute → `/tasks`, Track → `/insights`) with count, label, caption, chevrons between (aria-hidden); the Approve card is emphasised with `ring-1 ring-primary`. Grid `lg:grid-cols-3`: WaitingList (`lg:col-span-2`, reuses existing task-row data and StatusBadge) + right column DecisionTimeCard (value, ProgressBar against 2-day goal, mint when under goal) and "Your requests" counts. Second grid: RequestsChart (`figure` + `figcaption`, shadcn Chart AreaChart, submitted = chart-1 area, approved = chart-2 line, 7/30/90-day Tabs, hidden data table for screen readers) + Recent activity. Empty states for no waiting items ("You're all caught up").
- [ ] **Step 3: Verify** — home tests pass; screenshots light/dark/km/390; audit `/home`.
- [ ] **Step 4: Commit** — `git commit -m "Rebuild Home as action-first dashboard"`

### Task 9: Workspace pages polish

**Files:** Modify `src/pages/{Requests,Approvals,Processes,RequestDetail,Insights,Tasks}.tsx`, `src/components/ProcessMarketplace.tsx` (remove legacy select className, add `id="templates"`)

- [ ] **Step 1:** PageHeader title `text-2xl font-semibold tracking-tight`, subtitle muted; tables in `Card flush`; KPI-like summaries on Insights use the same card style as Home; RequestDetail decision banner uses Banner warning tone.
- [ ] **Step 2:** Remove leftover Remote-specific classes (`an-task-row` hover tones, `an-page` paddings) in favour of Tailwind utilities.
- [ ] **Step 3:** full e2e + audit of all workspace routes. Commit `git commit -m "Restyle workspace pages"` (Stage 2 complete)

### Task 10: Landing page from the poster

**Files:** Create `src/components/landing/{Hero,ProblemSolution,HowItWorks,Features,Audience,PilotPricing,TeamVision,Closing}.tsx`; modify `src/pages/Landing.tsx`, `src/components/PublicHeader.tsx`, `src/i18n/messages.extra.ts`; create `tests/landing.spec.ts`

- [ ] **Step 1: Failing test** `tests/landing.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

const sections = ['Ask → Approve → Move forward.', 'Requests come from everywhere, and get lost', 'How it works', 'Everything an approval needs', 'Made for teams that decide every day', 'Pilot plan and pricing', 'The team', 'Turn requests into real progress.'];

test('landing follows the poster order', async ({ page }) => {
  await page.goto('/');
  const headings = await page.getByRole('heading', { level: 2 }).allTextContents();
  const h1 = await page.getByRole('heading', { level: 1 }).textContent();
  expect([h1, ...headings].map((t) => t?.trim())).toEqual(sections);
  await page.getByRole('link', { name: 'Open the demo' }).first().click();
  await expect(page).toHaveURL(/\/home$/);
});

test('landing is translated', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('anumat-locale', 'km'));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).not.toHaveText(/Approve/);
});
```

Run: FAIL.

- [ ] **Step 2: Implement** each section with the copy from the spec/mockup (`.superpowers/brainstorm/*/content/landing.html`), shadcn Card/Badge/Button, the existing `dashboard-preview.webp` replaced by a fresh capture of the new Home (`scripts/capture-preview.mjs` via Playwright, 1440×900, light). Features: 8 cards, each `{icon, title, description}` where descriptions come from poster §8. Pilot & pricing: three plan cards (Free/Pro/Enterprise, "Free during the pilot" badge) + four-phase timeline (`<ol>` — it is a real sequence) + link to `/pricing`. Team: three people cards (Mengty, Panharith, Chamrong — Software Engineer) + vision text. Add all strings with Khmer translations.
- [ ] **Step 3:** landing tests pass; audit `/` at three widths, light/dark, km.
- [ ] **Step 4: Commit** — `git commit -m "Rebuild landing page from the Anumat poster"`

### Task 11: Public pages and docs

**Files:** Modify `src/pages/{Pricing,SignIn,Welcome,NotFound}.tsx`, `src/styles/theme.css` (auth geometry recoloured navy/mint), `DESIGN.md`, `PRODUCT.md`, `README.md` (screens section)

- [ ] **Step 1:** Restyle Pricing/SignIn/Welcome with shadcn Card, Input, Button; auth art panel uses `--primary` and `--mint`.
- [ ] **Step 2:** Rewrite DESIGN.md frontmatter tokens to palette C and the prose to the shadcn system; PRODUCT.md visual-direction paragraph now names shadcn + poster; remove Remote references.
- [ ] **Step 3: Final verification** — check-types, check:i18n, build, full e2e (desktop + mobile), full audit (12 routes × 5 variants): 0 axe violations, 0 overflow, 0 console errors.
- [ ] **Step 4: Commit** — `git commit -m "Restyle public pages and document the shadcn system"` (Stage 3 complete)
