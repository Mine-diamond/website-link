# website-link

website-link is a personal web bookmark manager. It provides a static web UI, a Cloudflare Pages Functions API, Cloudflare KV storage, and a browser extension for saving the current page.

The deployed service is currently used as the remote bookmark source for Launch Desk.

## Current Role

website-link owns website bookmark metadata:

- Title
- URL
- Tags
- Notes
- Importance
- Favicon
- Date added

Launch Desk owns local launcher state such as Home placement, zones, folder groups, usage tracking, and pinned URL items.

## Main Capabilities

- View bookmarks in a responsive card grid.
- Add, edit, and delete bookmarks.
- Search bookmarks by title, URL, notes, and tags.
- Filter bookmarks by importance.
- Switch between light and dark themes.
- Run AI-assisted bookmark search and website suggestions.
- Add AI-suggested websites as bookmarks.
- Save the current browser tab through the browser extension.
- Expose bookmark data to Launch Desk through the HTTP API.

## Project Structure

```text
website-link
├─ index.html
├─ css/
│  └─ styles.css
├─ js/
│  ├─ bookmarkAPI.js
│  ├─ bookmarks.js
│  ├─ theme.js
│  └─ utils.js
├─ functions/
│  └─ api/
│     └─ [[path]].js
├─ extension/
│  ├─ manifest.json
│  ├─ popup.html
│  ├─ popup.js
│  └─ icons/
├─ _redirects
└─ docs/
```

## Technology

- Static HTML, CSS, and browser JavaScript.
- Cloudflare Pages Functions for the API.
- Cloudflare KV for bookmark storage.
- Browser extension Manifest V3.
- Optional OpenAI-compatible chat completion API for AI search.

There is currently no build step, package manager setup, test runner, or framework.

## Documentation

- `docs/00-overview.md`: product role, goals, and current boundaries.
- `docs/01-features.md`: user-facing feature summary.
- `docs/02-architecture.md`: frontend, API, storage, and extension architecture.
- `docs/03-api.md`: current API surface and request/response shapes.
- `docs/04-data-model.md`: bookmark data model and future sync model.
- `docs/05-deployment.md`: Cloudflare Pages, KV, and environment variable setup.
- `docs/06-ui-style.md`: current UI style and future Launch Desk aligned direction.
- `docs/07-launch-desk-integration.md`: relationship with Launch Desk.
- `docs/08-development-notes.md`: known limitations and recommended improvement order.

## Deployment Summary

The project is intended to be deployed as a Cloudflare Pages project with the repository root as the static output.

Required binding:

```text
BOOKMARKS_KV
```

Optional AI environment variables:

```text
AI_API_KEY
AI_API_BASE_URL
AI_MODEL
```

See `docs/05-deployment.md` for details.

## API Summary

```text
GET  /api/bookmarks
POST /api/bookmarks
POST /api/bookmarks/update
POST /api/bookmarks/delete
GET  /api/bookmarks/search
POST /api/bookmarks/ai-query
```

See `docs/03-api.md` for details.

## Relationship With Launch Desk

Launch Desk fetches bookmarks from website-link and can add, edit, and delete remote bookmarks through the existing API. When a remote bookmark is pinned in Launch Desk, Launch Desk creates a local URL item and stores the remote bookmark ID as local metadata.

The ownership split is:

```text
website-link owns bookmark metadata.
Launch Desk owns launcher state.
```

See `docs/07-launch-desk-integration.md` for details.

## Current Improvement Priorities

Recommended next improvements:

1. Add simple token authentication to the API.
2. Return clear HTTP status codes for API errors.
3. Add stricter backend validation for bookmark input.
4. Add `updatedAt`, UUID IDs, and sync-friendly metadata.
5. Continue refining the Launch Desk Fluent/Mica visual language.
6. Consider incremental sync once the data model supports it.
