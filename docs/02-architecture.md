# Architecture

## High-Level Flow

```text
Browser UI
  ↓
js/bookmarkAPI.js
  ↓
/api/*
  ↓
functions/api/[[path]].js
  ↓
Cloudflare KV BOOKMARKS_KV, key "bookmarks"
```

The browser extension uses the same API directly.

Launch Desk also uses the same API directly.

## Frontend

The frontend is a static browser application.

Files:

- `index.html`: page structure, controls, bookmark grid, AI result area, modal form, script loading.
- `css/styles.css`: all web app styles, theme variables, bookmark cards, modal, loading state, empty state, AI results, responsive rules.
- `js/theme.js`: theme initialization and theme toggle behavior.
- `js/utils.js`: small utility object. It currently contains `slugify`, which is not central to the current bookmark flow.
- `js/bookmarkAPI.js`: wrapper around `fetch` calls to `/api`.
- `js/bookmarks.js`: main application state, rendering, form handling, search, AI search, and UI event wiring.

Scripts are loaded as traditional browser scripts, not ES modules.

## API Layer

The API is implemented in:

```text
functions/api/[[path]].js
```

It is a single Cloudflare Pages Functions catch-all route. It removes the `/api` prefix from the request pathname and dispatches by path.

Current paths:

- `/bookmarks`
- `/bookmarks/update`
- `/bookmarks/delete`
- `/bookmarks/search`
- `/bookmarks/ai-query`

## Storage

Bookmark storage uses Cloudflare KV.

Required binding:

```text
BOOKMARKS_KV
```

Current key:

```text
bookmarks
```

Current stored value:

```json
[
  {
    "id": "...",
    "title": "...",
    "url": "https://example.com",
    "tags": ["tool"],
    "notes": "...",
    "favicon": "https://...",
    "importance": 3,
    "dateAdded": "2026-01-01T00:00:00.000Z"
  }
]
```

The single-array KV model is acceptable for a modest personal bookmark set. It is not ideal for large data, concurrent updates, pagination, or incremental sync.

## Extension

The extension files live in:

```text
extension/
```

Files:

- `manifest.json`: Manifest V3 extension configuration.
- `popup.html`: popup UI and embedded CSS.
- `popup.js`: active tab lookup, form state, API URL setting, and save request.
- `icons/`: extension icons.

The extension submits directly to:

```text
<configured-api-url>/api/bookmarks
```

The default configured API URL is:

```text
https://bookmark.minediamond.tech
```

## Routing

The `_redirects` file contains:

```text
/search /index.html 200
```

This allows `/search?q=...` to load the same static app while preserving the URL. The frontend reads `q` from the query string and runs a search after the initial bookmark load.

## Launch Desk Dependency

Launch Desk depends on the API and bookmark data shape. Any breaking API or schema change should be coordinated with Launch Desk.

The most important compatibility surface is:

```text
GET /api/bookmarks
```

Launch Desk also currently uses add, update, and delete endpoints from the URLs page, Home/All remote URL edit/delete flows, and local/remote URL conversion flows.
