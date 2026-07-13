# Development Notes

## Current Development Model

website-link is currently a no-build static project.

There is no:

- `package.json`
- bundler
- test runner
- linter
- formatter configuration
- local Cloudflare configuration file

The runtime depends on browser APIs and Cloudflare Pages Functions.

## Important Current Files

- `index.html`: page structure and script loading order.
- `css/styles.css`: all web app styling.
- `js/bookmarks.js`: primary UI and business logic.
- `js/bookmarkAPI.js`: frontend API wrapper.
- `functions/api/[[path]].js`: backend API.
- `extension/popup.js`: browser extension save flow.

## Known Technical Issues

API authentication:

- Optional bearer-token authentication is enforced when `BOOKMARK_API_TOKEN` is configured.
- CORS allows all origins.
- Personal deployments should configure `BOOKMARK_API_TOKEN` before storing private data.

API status codes:

- Application errors now use explicit HTTP status codes and `{ error }` bodies.
- Future version-aware sync can add `409` conflict responses.

Data validation:

- The backend validates URL, tags, notes, and importance.
- The update endpoint enforces an explicit field allowlist before writing records.

Data model:

- New IDs use `crypto.randomUUID()`.
- `updatedAt` is written on create and update.
- Consider `version` and `deletedAt` before incremental sync.

Storage:

- All bookmarks are stored as one KV array.
- This is simple but not ideal for concurrency, pagination, or large datasets.

AI query:

- The AI endpoint sends all bookmarks in the prompt.
- This can become expensive or exceed token limits as the bookmark set grows.

## Recommended Improvement Order

1. Keep this documentation baseline current.
2. Update Vortex compatibility if the data model changes.
3. Continue the Vortex aligned visual redesign.
4. Add incremental sync only after `version` and deletion metadata exist.
5. Consider a D1 migration only if KV becomes a real limitation.

## Style Maintenance Notes

The current UI is aligned with Vortex's Fluent/Mica visual language while remaining a responsive website.

The web app should remain:

- Responsive.
- Fast to load.
- Usable on mobile.
- Simple enough for static hosting.

Future UI changes should preserve the flat surface model, compact header, subtle borders, restrained shadows, and lightly blurred floating layers for modal and toast UI.

## Documentation Maintenance

When API behavior changes, update:

- `docs/03-api.md`
- `docs/04-data-model.md`
- `docs/07-vortex-integration.md`

When visual direction changes, update:

- `docs/06-ui-style.md`

When deployment configuration changes, update:

- `docs/05-deployment.md`
