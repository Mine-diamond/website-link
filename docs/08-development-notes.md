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

Extension default API URL:

- `extension/popup.js` uses `bookmark.minediamond.tech` without `https://`.
- This should be changed to `https://bookmark.minediamond.tech`.

API authentication:

- No authentication is currently enforced.
- CORS allows all origins.
- Add token authentication before relying on the API for private data.

API status codes:

- Some application errors return HTTP 200 with `{ error }`.
- Use proper `400`, `401`, `404`, and `409` responses in future improvements.

Data validation:

- The backend should validate URL, tags, notes, and importance.
- The update endpoint should avoid allowing arbitrary fields to overwrite the record.

Data model:

- IDs should use `crypto.randomUUID()`.
- Add `updatedAt`.
- Consider `version` and `deletedAt` before incremental sync.

Storage:

- All bookmarks are stored as one KV array.
- This is simple but not ideal for concurrency, pagination, or large datasets.

AI query:

- The AI endpoint sends all bookmarks in the prompt.
- This can become expensive or exceed token limits as the bookmark set grows.

## Recommended Improvement Order

1. Keep this documentation baseline current.
2. Fix the extension default API URL.
3. Add backend input validation.
4. Add correct HTTP error status codes.
5. Add optional bearer-token authentication.
6. Add `updatedAt` and UUID IDs.
7. Update Launch Desk compatibility if the data model changes.
8. Start the Launch Desk aligned visual redesign.
9. Add incremental sync only after sync metadata exists.
10. Consider a D1 migration only if KV becomes a real limitation.

## Style Redesign Notes

The planned redesign should align with Launch Desk's Fluent/Mica visual language, but it should not copy the desktop shell exactly.

The web app should remain:

- Responsive.
- Fast to load.
- Usable on mobile.
- Simple enough for static hosting.

The redesign should begin with tokens, then migrate components incrementally.

## Documentation Maintenance

When API behavior changes, update:

- `docs/03-api.md`
- `docs/04-data-model.md`
- `docs/07-launch-desk-integration.md`

When visual direction changes, update:

- `docs/06-ui-style.md`

When deployment configuration changes, update:

- `docs/05-deployment.md`
