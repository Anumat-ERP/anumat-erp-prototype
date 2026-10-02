---
name: Anumat ERP
description: Visual system for Anumat's browser-based ERP prototype, with a Vendure-inspired admin workspace.
colors:
  workspace-canvas: "#f2f6f8"
  workspace-ink: "oklch(.13 .007 231)"
  workspace-card: "#fff"
  workspace-primary: "#16c1fe"
  workspace-primary-foreground: "#08212b"
  workspace-muted: "oklch(.945 .004 231)"
  workspace-muted-foreground: "oklch(.45 .005 231)"
  workspace-accent: "#d5f4ff"
  workspace-border: "oklch(.86 .004 231)"
  workspace-ring: "#087ba7"
  workspace-mint: "oklch(.48 .15 145)"
  workspace-dark-canvas: "oklch(.13 .007 231)"
  workspace-dark-card: "oklch(.18 .007 231)"
  workspace-dark-ink: "oklch(.92 .004 231)"
  workspace-dark-border: "oklch(.32 .007 231)"
  public-primary: "#285ff0"
  public-canvas: "#f3f5f9"
  public-surface: "#ffffff"
  public-ink: "#20252c"
  auth-navy: "#0e2549"
  auth-card-border: "#d8e0e4"
  auth-dark-canvas: "#101a20"
  auth-dark-card-border: "#42545e"
typography:
  workspace-caption:
    fontSize: "0.75rem"
  auth-note:
    fontSize: "0.75rem"
  workspace-heading:
    fontFamily: "'Public Sans Variable', 'Public Sans', 'Kantumruy Pro', system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  workspace-body:
    fontFamily: "'Inter Variable', Inter, 'Kantumruy Pro', system-ui, sans-serif"
    fontSize: "0.875rem"
  public-display:
    fontFamily: "'Plus Jakarta Sans', 'Inter Variable', 'Kantumruy Pro', system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 4.2vw, 4rem)"
    fontWeight: 600
    lineHeight: 1.14
    letterSpacing: "-0.04em"
rounded:
  workspace-base: "0.25rem"
  workspace-card: "0.5rem"
  workspace-control: "0.375rem"
  public-panel: "20px"
  public-pill: "999px"
spacing:
  workspace-sidebar: "16rem"
  workspace-sidebar-collapsed: "3.75rem"
  workspace-toolbar-height: "4rem"
  workspace-page-gap: "1.5rem"
  workspace-card-mobile: "1.25rem"
  workspace-card-desktop: "1.5rem"
components:
  workspace-card:
    backgroundColor: "{colors.workspace-card}"
    textColor: "{colors.workspace-ink}"
    rounded: "{rounded.workspace-card}"
    padding: "1.25rem"
  workspace-navigation-selected:
    backgroundColor: "{colors.workspace-accent}"
    textColor: "{colors.workspace-primary}"
    rounded: "{rounded.workspace-control}"
  public-button-primary:
    backgroundColor: "{colors.public-primary}"
    textColor: "{colors.public-surface}"
    rounded: "{rounded.public-pill}"
---

# Design System: Anumat ERP

## Overview

Anumat has three current visual contexts. The signed-in admin workspace is a compact, Vendure-inspired operating surface for requests, approvals, processes, and related work. Its hierarchy comes from a narrow sidebar, a shallow toolbar, pale blue-gray canvas, fine borders, and bright cyan actions. The application keeps Anumat's logo, names, copy, data, and workflows. This is an interpretation of Vendure's dashboard visual language, not a claim of identical UI or Vendure functionality.

Authentication uses a Vendure-inspired centered white card on a pale canvas, with the Anumat logo above it and a cyan submit button. Public marketing and workspace setup retain the earlier Remote-inspired visual system: cool gray canvas, spacious white panels, Plus Jakarta Sans display type, cobalt pill actions, and established imagery. The admin skin is scoped to `html.an-workspace-theme`, which `Shell.tsx` adds while the signed-in shell is mounted and removes when it unmounts. The auth skin is scoped to `.an-auth`. `src/styles/vendure-dashboard.css` supplies both sets of overrides. `PRODUCT.md` remains the source for product behavior and demo limitations.

**Key characteristics:**

- Dense, task-oriented admin layout with an expandable 256px sidebar and 64px toolbar.
- Bordered white workspace cards, dense tables, inline filters, and cyan primary actions.
- Public Sans workspace headings, Inter body text, and Khmer font fallback.
- Light/dark themes, English/Khmer copy, and mobile sheet navigation.
- Anumat identity and the Ask → Approve → Execute → Track flow on Home.

## Colors

The workspace uses a light `#f2f6f8` canvas, white cards and popovers, near-black foreground, and restrained borders. Primary actions use cyan `#16c1fe` with dark text. The active navigation item uses pale cyan `#d5f4ff`; keyboard focus uses the deeper `#087ba7` ring for contrast.

In dark mode, canvas is `oklch(.13 .007 231)`, card is `oklch(.18 .007 231)`, foreground is `oklch(.92 .004 231)`, and border is `oklch(.32 .007 231)`. The primary action remains cyan against dark text. The semantic tokens also define mint, destructive, warning, and five chart colors where status or data needs them. Status must still have a text label.

Public and setup continue to use cobalt `#285ff0`, cool gray `#f3f5f9`, white surfaces, and near-black `#20252c`. Authentication uses the admin cyan accent and a pale `#f5f9fb` canvas.

## Typography

The workspace uses self-hosted Public Sans for headings and figures, and Inter for body, navigation, and controls. Its page title is `1.5rem`, weight 600, line height 1.2, with `-.025em` tracking. Section labels are compact; sidebar group labels use `0.75rem`, semibold uppercase text with `0.05em` tracking. The app's Khmer font fallback remains in the stacks, and translated copy must be able to wrap.

Public and setup display headings retain Plus Jakarta Sans with Inter body text. Authentication headings use Public Sans. Code and tabular numbers may use the existing mono/tabular treatments where appropriate.

## Layout

On desktop the signed-in shell has a sticky, full-height 16rem (256px) sidebar with a border on its content edge. It can collapse to a 3.75rem (60px) icon rail. The sidebar places the workspace switcher at top, grouped navigation in the scrollable center, and the account control at bottom. The top toolbar is sticky and 4rem (64px) high, with sidebar toggle, breadcrumb, and utility actions. The main region uses 1.5rem vertical padding, a page gap of 1.5rem, and a capped content width. The shell's responsive horizontal gutters come from `AppShell` utilities.

Below the `md` breakpoint, the desktop sidebar gives way to a left sheet with an explicit open and close control; the mobile toolbar retains the account trigger and utilities. Main padding becomes 1rem. Navigation targets in the sheet have a larger minimum height of 2.75rem. Home's four-step flow uses two columns on smaller widths and a single linked sequence with chevrons at `lg` widths.

The public site and setup flow keep their existing responsive compositions. Authentication centers a 450px card and scales it to the viewport on phones. Density preference still scales rem-based values through the root font size.

## Elevation & Depth

Workspace depth comes primarily from surface contrast and borders. Shared cards have a 1px semantic border and no resting shadow; the workspace theme sets `--shadow-card: none`. The toolbar, sidebar, cards, and page canvas remain visually distinct without floating panels. Menus and dialogs may retain overlay elevation, and the workspace switcher's small logo tile has a subtle shadow. Public hero imagery retains its own visual depth.

## Shapes

The workspace's base radius is 0.25rem (4px). Controls use 0.375rem (6px); cards use 0.5rem (8px). Borders are thin and restrained. Sidebar selections follow the compact control radius. This flatter geometry is scoped to the signed-in shell. Public and setup panels retain their larger corners, while prominent public/auth actions retain pill shapes.

## Components

### Module catalog

The first visit to each workspace shows a compact catalog of four work areas. Three linked cards open existing workflows; Resources is explicitly marked Coming soon and has no action. A secondary dashboard link lets experienced users proceed immediately. The catalog reuses workspace canvas, card, border, focus, link, mint, warning, and chart tokens, with a two-column desktop grid and single-column mobile stack. The sidebar keeps Explore modules available after first visit.

### Workspace shell and navigation

`AppShell` provides sidebar, toolbar, main region, mobile sheet, and skip link. Navigation rows are compact with icons and labels; the active destination uses a neutral accent fill, semibold text, and `aria-current="page"`. Collapsed rail items keep accessible names and tooltips. The top sidebar control is `WorkspaceSwitcher`: it displays the Anumat mark, current organization, and access role, then opens a menu of demo workspaces and a create-workspace route. The account menu sits at the bottom of the sidebar and appears as an avatar control in the mobile toolbar.

The workspace theme hides the floating support control so help remains within the admin navigation and toolbar.

### Cards and data

The shared `Card` is a bordered, shadowless section with a white or muted surface, 0.5rem radius, and `1.25rem` padding that grows to `1.5rem` at `sm`. Its flush variant leaves spacing to headers and rows. `CardHeader` pairs a semibold title with smaller muted description and optional actions. Home's `FlowStrip` is a distinct four-card summary for Ask, Approve, Execute, and Track. Each step links to an Anumat route, shows a count and caption, and gives Approve stronger emphasis when items are waiting. Other data areas should keep borders, labels, and textual statuses legible in both themes.

### Controls and feedback

Workspace buttons, inputs, textareas, and selects use the compact control radius and semantic foreground, surface, border, and ring tokens. Keyboard focus remains visible. The existing app-owned UI components handle menus, cards, buttons, fields, chips, and dialogs. Workspace tables use a flush white header and 4rem body rows; filters align search, options, and actions on one line where space permits. Public/setup forms retain their larger inset-label fields and cobalt actions. Authentication retains password visibility and six-digit verification controls inside the new centered card. Those routes are browser-only demonstrations as described in `PRODUCT.md`.

### Imagery

Marketing and setup may use the original textured folder art and the static Anumat dashboard preview. The compact admin and auth layouts use no decorative art.

## Do's and Don'ts

### Do:

- **Do** scope admin tokens and compact component geometry to `html.an-workspace-theme`, and the centered login treatment to `.an-auth`.
- **Do** use semantic tokens so cards, text, focus, status, and controls remain legible in light and dark themes.
- **Do** preserve Anumat's logo, route names, approval workflow, locale support, and mobile navigation.
- **Do** keep status meaning in words as well as color, and maintain accessible focus and navigation labels.

### Don't:

- **Don't** describe the workspace as a pixel-identical Vendure dashboard or imply Vendure backend integration.
- **Don't** replace the public or setup presentation with workspace tokens unless those surfaces are deliberately redesigned.
- **Don't** add floating shadows or large pill corners to routine workspace cards and controls.
- **Don't** imply real authentication, sent invitations, or server provisioning in visual copy.
