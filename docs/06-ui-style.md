# UI Style

## Current Style

The current web UI uses a Windows 11 Fluent/Mica inspired responsive bookmark workspace.

Current characteristics:

- Light and dark themes.
- Mica-like radial background accents.
- Glass panels with translucent surfaces, subtle borders, and backdrop blur.
- A large workspace header with title, subtitle, and theme control.
- A command-bar style search, filter, add, and AI toolbar.
- Responsive bookmark cards with translucent surfaces, favicon or first-letter fallback icons, tag pills, star importance, and low-noise action buttons.
- Glass modal form for add/edit.
- Glass toast notifications created from JavaScript.
- AI suggestion cards below the bookmark grid using the same panel/card language.

The current style is intended to align with Launch Desk's Fluent/Mica visual direction while remaining a responsive website.

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

Current primary variables include:

```css
--color-bg
--color-bg-elevated
--color-panel
--color-panel-strong
--color-card
--color-card-hover
--color-input
--color-text
--color-text-muted
--color-text-subtle
--color-border
--color-border-strong
--color-accent
--color-accent-hover
--color-accent-text
--color-accent-wash
--radius-window
--radius-panel
--radius-card
--radius-control
--radius-pill
--shadow-soft
--shadow-panel
--shadow-card
```

Legacy variables such as `--bg-color`, `--text-color`, `--input-bg`, and `--bookmark-card-bg` are still mapped to the new tokens for compatibility with existing selectors.

## Target Direction

The active redesign direction is:

```text
Windows 11 Fluent + Mica Glass Bookmark Workspace
```

The redesigned website-link should visually align with Launch Desk while still behaving like a responsive website.

## Visual Keywords

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

## Font

Use the same font family as Launch Desk:

```css
font-family: "Segoe UI Variable", "Segoe UI", system-ui, sans-serif;
```

## Token Direction

The current UI now uses Launch Desk compatible token names:

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

## Layout Direction

website-link should not copy the Launch Desk desktop shell exactly. It should adapt the same visual language for a web bookmark page.

Current web layout:

- A centered page shell with a soft radial accent background.
- A compact top header with brand, theme toggle, and future settings/auth controls.
- A prominent search and filter toolbar.
- Bookmark cards using translucent card surfaces.
- Modals using glass-like panels with subtle borders.
- Toasts using the same panel/card language.
- Mobile layout that keeps search and add actions easy to reach.

## Bookmark Card Direction

Bookmark cards are designed to be calm and Launch Desk-like:

- Less saturated gradients.
- More transparent card surfaces.
- Subtle border instead of heavy elevation.
- Icon-first header.
- Title and domain visible before notes.
- Tags and importance shown as metadata, not dominant visual elements.
- Hover should use `--color-card-hover` and a slight border/shadow change.

## Modal Direction

Add/edit modals use:

- `--color-panel` background.
- `backdrop-filter: blur(...) saturate(...)`.
- `--radius-panel`.
- `--color-border`.
- Consistent control radius and spacing.

## Maintenance Rules

Do not change API behavior during style work unless a UI change requires it.

Do not break mobile layout during future visual changes.

Keep legacy CSS variable aliases until all old selectors are removed or renamed deliberately.
