# UI Style

## Current Style

The current web UI uses a conventional responsive bookmark-card layout.

Current characteristics:

- Light and dark themes.
- Blue/purple gradient primary buttons.
- Card grid with rounded bookmark cards.
- Favicon or first-letter fallback icon.
- Tag pills.
- Star-based importance display.
- Modal form for add/edit.
- Toast notifications created from JavaScript.
- AI suggestion cards below the bookmark grid.

The current style is functional, but it does not yet match Launch Desk.

## Current Theme Mechanism

Theme selection is controlled by `js/theme.js`.

The selected theme is stored in `localStorage` under:

```text
user-theme
```

The active theme is applied as:

```html
<html data-theme="dark">
```

or:

```html
<html data-theme="light">
```

## Current CSS Variables

Current variables include:

```css
--bg-color
--text-color
--header-bg
--card-bg
--group-bg
--input-bg
--input-border-color
--input-focus-border-color
--btn-primary-bg
--btn-secondary-bg
--bookmark-card-bg
--bookmark-favicon-fallback-bg
--star-filled-color
--star-empty-color
--tag-bg
--tag-color
```

These variables are useful, but their names and values do not match Launch Desk's current token system.

## Target Direction

Future redesign direction:

```text
Windows 11 Fluent + Mica Glass Bookmark Workspace
```

The redesigned website-link should visually align with Launch Desk while still behaving like a responsive website.

## Target Visual Keywords

- Fluent
- Mica
- Acrylic-like translucency
- Rounded corners
- Soft shadows
- Calm spacing
- Icon-first cards
- Subtle borders
- Light motion
- Personal workspace

## Target Font

Use the same font family as Launch Desk:

```css
font-family: "Segoe UI Variable", "Segoe UI", system-ui, sans-serif;
```

## Target Tokens

The redesign should converge toward Launch Desk token names:

```css
--color-bg
--color-panel
--color-card
--color-card-hover
--color-text
--color-text-muted
--color-border
--color-accent
--color-accent-wash

--radius-window
--radius-panel
--radius-card
--radius-control
--radius-small

--space-xs
--space-sm
--space-md
--space-lg
--space-xl

--shadow-soft
```

Launch Desk light theme reference:

```css
--color-bg: #f5f5f5;
--color-panel: rgba(255, 255, 255, 0.64);
--color-card: rgba(255, 255, 255, 0.48);
--color-card-hover: rgba(255, 255, 255, 0.76);
--color-text: #1f1f1f;
--color-text-muted: #666666;
--color-border: rgba(0, 0, 0, 0.08);
--color-accent: #0067c0;
--color-accent-wash: rgba(0, 103, 192, 0.14);
```

Launch Desk dark theme reference:

```css
--color-bg: #202020;
--color-panel: rgba(40, 40, 40, 0.68);
--color-card: rgba(255, 255, 255, 0.07);
--color-card-hover: rgba(255, 255, 255, 0.12);
--color-text: #f5f5f5;
--color-text-muted: #a8a8a8;
--color-border: rgba(255, 255, 255, 0.1);
--color-accent: #4cc2ff;
--color-accent-wash: rgba(76, 194, 255, 0.12);
```

## Target Layout Direction

website-link should not copy the Launch Desk desktop shell exactly. It should adapt the same visual language for a web bookmark page.

Recommended web layout:

- A centered page shell with a soft radial accent background.
- A compact top header with brand, theme toggle, and future settings/auth controls.
- A prominent search and filter toolbar.
- Bookmark cards using translucent card surfaces.
- Modals using glass-like panels with subtle borders.
- Toasts using the same panel/card language.
- Mobile layout that keeps search and add actions easy to reach.

## Bookmark Card Direction

Bookmark cards should become calmer and more Launch Desk-like:

- Less saturated gradients.
- More transparent card surfaces.
- Subtle border instead of heavy elevation.
- Icon-first header.
- Title and domain visible before notes.
- Tags and importance shown as metadata, not dominant visual elements.
- Hover should use `--color-card-hover` and a slight border/shadow change.

## Modal Direction

Add/edit modals should use:

- `--color-panel` background.
- `backdrop-filter: blur(...) saturate(...)`.
- `--radius-panel`.
- `--color-border`.
- Consistent control radius and spacing.

## Migration Rules

The style migration should be incremental:

1. Add Launch Desk compatible tokens while preserving existing behavior.
2. Migrate page background, header, and toolbar.
3. Migrate bookmark cards.
4. Migrate modal, form controls, toast, loading, and empty states.
5. Migrate AI suggestion cards.
6. Remove obsolete legacy variables only after all references are replaced.

Do not change API behavior during style migration unless a UI change requires it.

Do not break mobile layout during the redesign.
