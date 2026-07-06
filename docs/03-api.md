# API

## Base URL

When deployed, the current base URL is:

```text
https://bookmark.minediamond.tech
```

The frontend uses a relative API base:

```text
/api
```

## Authentication

No authentication is currently enforced.

Launch Desk already supports sending an optional bearer token in preparation for future API authentication:

```http
Authorization: Bearer <token>
```

A future backend enhancement should validate this header against an environment variable such as `BOOKMARK_API_TOKEN`.

## CORS

The API currently sends:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type
```

If bearer authentication is added, `Authorization` should also be included in `Access-Control-Allow-Headers`.

## GET /api/bookmarks

Returns all bookmarks.

Response:

```json
[
  {
    "id": "1720000000000",
    "title": "Example",
    "url": "https://example.com",
    "tags": ["tool"],
    "notes": "Example note",
    "favicon": "https://www.google.com/s2/favicons?domain=example.com&sz=32",
    "importance": 3,
    "dateAdded": "2026-01-01T00:00:00.000Z"
  }
]
```

Used by:

- website-link web app
- Launch Desk

## POST /api/bookmarks

Adds a bookmark.

Request:

```json
{
  "title": "Example",
  "url": "https://example.com",
  "tags": ["tool"],
  "notes": "Example note",
  "importance": 3
}
```

Response:

```json
{
  "id": "1720000000000",
  "title": "Example",
  "url": "https://example.com",
  "tags": ["tool"],
  "notes": "Example note",
  "favicon": "https://www.google.com/s2/favicons?domain=example.com&sz=32",
  "importance": 3,
  "dateAdded": "2026-01-01T00:00:00.000Z"
}
```

Current behavior:

- `title` and `url` are required.
- `id` is generated with `Date.now().toString()`.
- `favicon` is generated from the URL hostname unless provided.
- `importance` defaults to `1` if not provided.

## POST /api/bookmarks/update

Updates a bookmark by ID.

Request:

```json
{
  "id": "1720000000000",
  "title": "Updated Example",
  "url": "https://example.com",
  "tags": ["tool", "docs"],
  "notes": "Updated note",
  "importance": 4
}
```

Response:

```json
{
  "id": "1720000000000",
  "title": "Updated Example",
  "url": "https://example.com",
  "tags": ["tool", "docs"],
  "notes": "Updated note",
  "favicon": "https://www.google.com/s2/favicons?domain=example.com&sz=32",
  "importance": 4,
  "dateAdded": "2026-01-01T00:00:00.000Z"
}
```

Current behavior:

- `id` is required.
- The backend merges the request body into the existing bookmark.
- No strict field allowlist is currently enforced.
- No `updatedAt` is currently written.

## POST /api/bookmarks/delete

Deletes a bookmark by ID.

Request:

```json
{
  "id": "1720000000000"
}
```

Response:

```json
{
  "success": true
}
```

Current behavior:

- The response is success even if the ID did not exist.
- Deletion is hard deletion from the KV array.
- There is no tombstone or `deletedAt` field.

## GET /api/bookmarks/search

Searches bookmarks.

Query parameters:

- `q`: text query.
- `tags`: repeated tag filters.
- `importance`: minimum importance.

Example:

```text
/api/bookmarks/search?q=cloudflare&importance=3
```

Current matching:

- Title includes query.
- Notes includes query.
- URL includes query.
- Any tag includes query.
- All provided `tags` must be present.
- `importance` means `bookmark.importance >= importance`.

Response:

```json
[
  {
    "id": "1720000000000",
    "title": "Cloudflare",
    "url": "https://cloudflare.com",
    "tags": ["cloud"],
    "notes": "Deployment",
    "favicon": "https://www.google.com/s2/favicons?domain=cloudflare.com&sz=32",
    "importance": 4,
    "dateAdded": "2026-01-01T00:00:00.000Z"
  }
]
```

## POST /api/bookmarks/ai-query

Runs AI-assisted bookmark search and website suggestion.

Request:

```json
{
  "query": "cloudflare deploy docs"
}
```

Response:

```json
{
  "matched": [
    {
      "id": "1720000000000",
      "reason": "Matches the Cloudflare deployment note."
    }
  ],
  "suggestions": [
    {
      "title": "Cloudflare Docs",
      "url": "https://developers.cloudflare.com/",
      "description": "Official Cloudflare developer documentation.",
      "reason": "Useful for deployment references."
    }
  ]
}
```

Required environment variable:

```text
AI_API_KEY
```

Optional environment variables:

```text
AI_API_BASE_URL
AI_MODEL
```

Current behavior:

- Defaults to `https://api.deepseek.com`.
- Defaults to model `deepseek-chat`.
- Sends all bookmarks in the prompt.
- Attempts to parse raw JSON first, then JSON inside a Markdown code block.

## Error Behavior

Current error handling is basic.

Known issues:

- Some validation failures return `{ "error": "..." }` with HTTP 200.
- Not found responses may use `{ "error": "not found" }` with HTTP 200.
- Uncaught server errors return HTTP 500.

Recommended future behavior:

- `400` for invalid input.
- `401` for missing or invalid token after authentication is added.
- `404` for missing bookmark IDs.
- `409` for sync conflicts after versioning is added.
- `500` only for unexpected server failures.
