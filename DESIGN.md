---
name: Anumat ERP
description: Remote-reference visual system for Anumat's browser-based ERP prototype.
colors:
  primary: "#285ff0"
  primary-hover: "#1c4ed1"
  primary-active: "#1945b8"
  primary-soft: "#edf5ff"
  primary-border: "#a7c2ec"
  canvas: "#f3f5f9"
  surface: "#ffffff"
  surface-muted: "#f8fafc"
  surface-sunken: "#edf1f6"
  surface-hover: "#f0f2f5"
  surface-active: "#e5eaf1"
  ink: "#20252c"
  text-muted: "#5a6370"
  text-subtle: "#606874"
  border: "#e8ebf0"
  border-subtle: "#edf0f4"
  border-strong: "#bdc4ce"
  border-input: "#858f9f"
  focus-ring: "#1459c4"
  supporting-gold: "#93651b"
  supporting-gold-soft: "#f7ecd5"
  error: "#b42318"
  success: "#167044"
  error-surface: "#fff9f8"
  auth-navy: "#0e2549"
  auth-blue: "#285ff0"
  dark-canvas: "#101722"
  dark-surface: "#182230"
  dark-surface-muted: "#1c2736"
  dark-surface-sunken: "#0c131e"
  dark-surface-hover: "#243246"
  dark-surface-active: "#2c3c52"
  dark-primary-soft: "#243b5a"
  dark-primary: "#91b9ff"
  dark-primary-hover: "#b0cdff"
  dark-primary-active: "#c4dbfe"
  dark-primary-border: "#5379a9"
  dark-link: "#a9c9ff"
  dark-ink: "#edf1f6"
  dark-text-muted: "#b6c2d2"
  dark-text-subtle: "#a3b1c4"
  dark-border: "#334256"
  dark-border-subtle: "#293749"
  dark-border-strong: "#53647a"
  dark-border-input: "#74859c"
  dark-gold: "#dfb76d"
  dark-gold-soft: "#382e20"
  dark-error: "#ffb4ab"
  dark-success: "#86d7a8"
  dark-error-surface: "#30242b"
typography:
  display:
    fontFamily: "'Plus Jakarta Sans', 'Inter Variable', 'Noto Sans Khmer', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 4.2vw, 4rem)"
    fontWeight: 600
    lineHeight: 1.14
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "'Plus Jakarta Sans', 'Inter Variable', 'Noto Sans Khmer', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 3.3vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  auth-heading:
    fontFamily: "'Plus Jakarta Sans', 'Inter Variable', 'Noto Sans Khmer', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 2.2vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  workspace-heading:
    fontFamily: "'Plus Jakarta Sans', 'Inter Variable', 'Noto Sans Khmer', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  title:
    fontFamily: "'Plus Jakarta Sans', 'Noto Sans Khmer', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "'Inter Variable', Inter, 'Noto Sans Khmer', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    lineHeight: "1.6rem"
  body-small:
    fontFamily: "'Inter Variable', Inter, 'Noto Sans Khmer', ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    lineHeight: "1.4rem"
  button:
    fontFamily: "'Inter Variable', Inter, 'Noto Sans Khmer', system-ui, sans-serif"
    fontWeight: 600
    lineHeight: 1.75
  mono:
    fontFamily: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
    fontSize: "0.875rem"
rounded:
  sm: "0.25rem"
  md: "0.375rem"
  lg: "0.5rem"
  xl: "0.75rem"
  input: "14px"
  checkbox: "5px"
  nav: "15px"
  dialog: "16px"
  panel: "20px"
  closing-panel: "24px"
  pill: "999px"
spacing:
  icon-gap: "8px"
  compact-gap: "12px"
  mobile-gutter: "16px"
  mobile-card: "20px"
  grid-gap: "24px"
  card: "28px"
  page-gap: "32px"
  desktop-gutter: "36px"
  public-gutter: "48px"
  public-section: "88px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "6px 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "5px 20px"
  button-tertiary:
    textColor: "{colors.primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "6px 20px"
  button-public-header:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "28px"
  setup-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "26px 18px 10px"
    height: "64px"
  auth-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "32px 18px 16px"
    height: "76px"
  button-auth:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "12px 32px"
    height: "58px"
  code-digit:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.input}"
    padding: "16px 0"
    height: "76px"
  checkbox:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.checkbox}"
    size: "22px"
  navigation-selected:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
    rounded: "{rounded.nav}"
    padding: "8px 16px"
  process-choice:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "28px"
---

# Design System: Anumat ERP

## Overview

The user selected Remote marketing, onboarding, login, verification and workspace references as the visual authority. Anumat's built system applies their cool gray canvas, spacious white panels, rounded near-black headings and cobalt pill actions while retaining the Anumat logo and its existing browser-only workflows.

Marketing uses large editorial headings, the actual Anumat Home preview and original textured mint-and-blue folder art. Setup pairs generous outlined fields with inset floating labels, a centered header and blue progress line. Login, recovery and verification use a white form area beside a navy-and-cobalt geometric panel. The workspace gives tasks the broad main canvas, keeps navigation on a white sidebar and quiets utilities in gray. This is the documented implementation, not a claim of full parity with Remote.

**Key Characteristics:**

- Cool gray canvas and generous white rounded panels.
- Rounded display headings with readable Inter product text.
- Cobalt actions and pale-blue selected navigation.
- Original textured folder art beside actual Anumat UI imagery.
- Responsive layouts with light/dark and English/Khmer preferences.

The normative frontmatter records reusable built values. `src/styles/theme.css` overrides the earlier `anumat.css` palette through `app.css` import order; do not recover superseded colors from that older file. Runtime components use MUI and Emotion through `src/ui/components/` and `src/ui/theme.tsx`. Utility classes remain for composition. `PRODUCT.md` owns product truth; this document owns visual application.

## Colors

### Primary

Cobalt blue marks primary actions, links, progress and selected controls. Pale blue carries selected navigation without competing with its label. MUI contained primary buttons explicitly bind hover and active states to the CSS primary-hover and primary-active tokens. The MUI palette reads the computed semantic CSS values on theme creation instead of maintaining a second literal palette.

### Secondary

Supporting gold remains in secondary, warning and chart roles. It is a detail, not the main action color. Request-type icons use contextual blue, peach, lilac and green tints; status meaning must also be present in text.

The authentication art pairs the auth-navy and auth-blue tokens in a repeating CSS geometry; this fixed brand pairing is retained in both themes. Error and success values are shared CSS tokens consumed by MUI. Invalid inset-label fields and code slots add the error-surface tint, with its own dark variant.

### Neutral

Cool gray is the page canvas; white is the main panel and sidebar surface. Muted and sunken surfaces separate secondary groups and the bottom account area. Near-black carries headings and primary content; muted gray carries descriptions and utilities. Stronger input borders make editable fields more apparent than panel boundaries.

Dark mode swaps semantic surface, text, border and action tokens. Its primary actions use light blue with dark ink. The MUI provider observes `data-theme`, including portaled dialogs and menus. The static dashboard hero preview and editorial bitmap retain their baked-in colors; do not describe them as fully theme-adaptive.

## Typography

Self-hosted Plus Jakarta Sans supplies rounded display headings; Inter Variable supplies product copy and controls. Noto Sans Khmer covers Khmer characters. JetBrains Mono appears in codes and technical identifiers. Tables and numerical summaries use tabular figures.

Display and headline roles apply to public surfaces. The setup headline uses its own observed clamp (`clamp(2rem, 3.25vw, 3rem)`, line-height 1.25). Workspace headings use the smaller workspace role. The general `Text` body scale differs from direct MUI Typography: MUI body1/body2 use line-height 1.75, while utility body/body-small use the frontmatter's rem line heights. Do not flatten this into a single universal line-height.

Auth headings use bold weight (700), balanced wrapping and the auth-heading clamp, reaching (40px) on large screens and (32px) at smaller widths; auth supporting copy uses (1.125rem) with line-height (1.6).

Public headings use semibold weight, negative tracking and generous surrounding space. On phones the hero title is (2.375rem), setup title (2rem), and workspace title (1.5rem). Khmer overrides compact utility line heights to give combining marks more room. Preserve the existing language-aware behavior when adding controls.

## Layout

The desktop workspace has a sticky full-height sidebar (272px), expanding to (304px) from (1600px) and narrowing to (240px) between (768px) and (1100px). The main content uses (36px) padding and a centered maximum width (1500px). Wide screens use (40px 48px) padding. The account block sits at the sidebar bottom; utilities occupy the upper-right main area.

At (767px) and below, the sidebar becomes drawer navigation, utilities become a sticky surface bar, and main padding becomes (24px 16px). At intermediate widths utilities join document flow so they do not overlap the page header. Card padding shifts from (28px) to (20px) below MUI's (640px) breakpoint. Comfortable density is the default; compact preference changes the root font size to (93.75%) and therefore scales rem values rather than every fixed pixel dimension.

Public headers use an (88px) minimum height and centered (1560px) inner container. The hero is a two-column panel with (56px 64px) padding, (20px) corners and (1680px) maximum width. Public content sections use a (1440px) maximum width, (88px 48px) padding, and three-column module cards. On phones the public navigation hides, content columns stack and section padding becomes (56px 24px).

Setup uses a centered (1560px) two-column layout with (80px 64px) padding and (80px) gap. The process step switches to a centered (1160px) wide form. Setup art hides on phones; fields and actions remain in document flow. Process choices become two columns from (640px). Respect the separate CSS and MUI breakpoints recorded in the sidecar.

Authentication uses a full-height (2:1) desktop grid: a white semantic surface for the form and a sticky navy/cobalt geometric aside. The form width caps at (580px), with (64px 48px) main padding, changing to (48px 32px) below (1100px). At (767px) and below the art hides, the grid becomes one column, and the form uses (48px 24px) padding. Login and recovery share quarter-circle motifs; verification switches to tall curved motifs. No folder illustration appears on these auth surfaces.

## Elevation & Depth

Most workspace cards have no border or shadow; white surfaces against the cool canvas and row dividers establish depth. Inputs retain visible outlines. Hero imagery carries a diffuse blue-gray shadow (`0 18px 44px rgb(30 63 128 / 12%)`); its decision callout uses a lighter shadow (`0 8px 26px rgb(30 63 128 / 8%)`). Dialogs and menus retain MUI overlay elevation. The hero backdrop blends the surface into cool blue and mint; its dark variant has an explicit darker blend.

Motion is brief and explanatory: (100ms) interaction fades, (150ms) tab fades, (250ms) section arrival, and (400ms) reveal/chart transitions. Page sections rise by (4px); no recurring decorative motion is prescribed. Reduced motion disables application arrival/reveal animations and clamps MUI transitions.

## Shapes

Pill buttons and icon buttons soften the actions; large panels and process cards have generous (20px) corners. Dialogs use (16px), input bases (14px), checkbox corners (5px), and MUI navigation/chip overrides (15px). Utility rounding remains its separate rem-based scale; a numeric MUI radius multiplies the (10px) theme shape, so `1.5` does not mean the utility radius step.

Process cards indicate selection with a blue border while retaining the white surface. Request icons use rounded tinted tiles. Setup progress is a straight, thin line across the header. Circular step indicators and checks provide compact state markers.

## Components

### Buttons

Primary actions are cobalt pills with white text, semibold sentence-case labels and a (44px) minimum height. Standard horizontal padding is (20px); auth submit/message actions use a (58px) minimum height, (12px 32px) padding and medium weight (500); setup actions use (50px) minimum height and (28px) horizontal padding, and large marketing actions use (54px) and (26px). Secondary buttons are outlined with ink labels; tertiary and plain variants use text treatments. The public header's workspace action is near-black. Critical actions use the MUI error palette. Keyboard focus uses a visible (2px) ring with an offset.

### Cards / Containers

Default cards are white, borderless and shadowless, with responsive (20px/28px) padding; flush cards delegate spacing to their header and rows. Muted cards use the secondary surface. Task rows use (24px 28px) padding and a (100px) minimum height on desktop, reducing to (20px) padding on phones; hover adds a tonal background.

### Inputs / Fields

Fields use MUI outlined inputs with semantic backgrounds, input borders and the shared field radius. Ordinary non-floating input padding remains (11px 14px). Floating Input and Select adapters add the inset-label treatment: shared minimum height (64px), input padding (26px 18px 10px), text (1.125rem), and label resting at (18px, 19px). Filled or focused labels move inside the top edge to (18px, 7px) at scale (0.75); the outline legend is hidden, so the border has no label notch. Select uses a styled MUI menu with token-based selected, hover and focus states, grouped options, and a scroll limit. Small selects use compact text and arrow spacing for the header and narrow filters; outlined fields keep their (14px) radius.

Auth enlarges floating fields to (76px), text (1.25rem), and padding (32px 18px 16px). Their labels rest at (20px, 23px) and shrink to (20px, 10px) at scale (0.7). Mobile auth uses the shared (64px) height and inset-label scale. Focus keeps MUI's primary border/label treatment; errors keep the inset label, switch to semantic error borders/labels, and add the error-surface tint. Empty fields retain a readable label in the input area; entered text sits below the shrunk label. Keep required, disabled, invalid and described-by semantics in the adapters.

### Password and verification fields

PasswordInput reuses the outlined inset field and adds a trailing eye control. Visibility stays local; the button changes its accessible label between Show password and Hide password and exposes `aria-pressed`. It switches the input type without storing or submitting the value itself.

CodeInput provides six equal numeric slots with a (10px) desktop gap and (76px) height, changing to (8px) gap and (58px) height on mobile. Digits use centered semibold tabular figures. The fieldset has a legend, each input has its own digit label and described-by association, and the first input supports one-time-code autofill. Paste strips non-digits, fills consecutive slots and advances focus; typing advances focus, arrows move between slots, and Backspace in an empty slot clears and focuses the preceding slot. Error slots share the field error tint.

Login, SSO, verification and recovery/reset are browser-only demonstrations. Verification accepts demo code `123456`; Remember me persists only the email. Passwords and codes are never stored or sent. Changes of auth screen focus its heading, and validation stays associated with the affected fields.

### Checkboxes

The shared checkbox has a (22px) icon with a (2px) semantic input border and the checkbox radius. Checked and mixed states use the primary fill, contrast text and a white/dark check or minus according to theme; disabled icons reduce opacity to (0.45). Keep the native MUI checkbox semantics and associated visible label. The same primitive is used for remembering an email and choosing setup processes.

### Navigation

White sidebar navigation uses icon-and-label rows with (52px) minimum height, (16px) horizontal padding and rounded corners. Active rows carry pale blue, cobalt text, semibold weight and `aria-current`. Gray utilities stay quieter than the task content. Mobile uses the existing drawer and avatar-only account trigger. Administration headings remain small uppercase labels; removing public page eyebrows does not prohibit navigation group labels.

### Chips / Status

Badges are compact outlined MUI chips, with (0.75rem) text, (22px/26px) heights and optional state dots. Tone maps to the MUI semantic palette. Status labels continue to communicate meaning without relying on the dot alone.

### Setup progress and process choices

The white setup header centers its title between back and account/language controls; a (4px) blue progress bar carries progress semantics. Process choice cards put a tinted request icon and checkbox in the top row, followed by a title and approval-route description. Cards have a (230px) minimum height, blue selected border, hover tone and (2px) focus-within outline. Use real checkboxes and labels, not decorative clickable boxes.

### Imagery

`src/assets/illustrations/workspace-folder.webp` is the original textured mint folder with blue approval documents and lilac detail. `dashboard-preview.webp` is a static capture of this application's seeded Home screen. The folder art remains on marketing and workspace setup; authentication now uses CSS geometry. Both bitmaps are visual assets, not extra functional interfaces. The provenance and prompts live in `.impeccable/image-assets.md` and asset JSON sidecars. Review screenshots under `.impeccable/review/` record the built surfaces. The original finish verdict covers its two resolved fixes; `.impeccable/review/auth/` contains desktop, mobile and reference-view captures of the later auth/shared-control work. Those reviews retain their own scope.

## Do's and Don'ts

### Do:

- **Do** preserve the Anumat logo and the user-selected Remote visual direction.
- **Do** build new controls through the app-owned MUI adapters and semantic CSS variables.
- **Do** retain visible focus, labels and textual status alongside color.
- **Do** let long translated copy wrap and keep mobile utilities inside the viewport.
- **Do** reuse the original folder art and actual Anumat UI preview with their recorded provenance.

### Don't:

- **Don't** reintroduce the removed public heading eyebrows.
- **Don't** imply working authentication, sent invitations or server provisioning through presentation.
- **Don't** copy Remote logos, product screenshots or unsupported trust claims.
- **Don't** turn every white panel into a floating shadow card.
- **Don't** use literal light-theme colors for new shared controls.
