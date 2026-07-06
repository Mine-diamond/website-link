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

Authentication is optional and controlled by the Cloudflare Pages environment variable `BOOKMARK_API_TOKEN`.

If `BOOKMARK_API_TOKEN` is not configured, the API remains open for compatibility with existing personal deployments.

If `BOOKMARK_API_TOKEN` is configured, every non-`OPTIONS` request must send:

```http
Authorization: Bearer <token>
```

Launch Desk and the browser extension both support sending this token.

## CORS

The API currently sends:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

`OPTIONS` requests are always allowed for preflight.

## Error Responses

Errors return JSON:

```json
{
  "error": "message"
}
```

Common status codes:

- `400`: invalid JSON, missing fields, invalid URL, or invalid importance.
- `401`: bearer token is required.
- `403`: bearer token is invalid.
- `404`: route or bookmark ID was not found.
- `405`: method is not allowed for the route.
- `502`: AI provider request failed.
- `503`: AI is not configured.

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
- `id` is generated with `crypto.randomUUID()` for new bookmarks. Existing timestamp IDs remain valid.
- `favicon` is generated from the URL hostname unless provided.
- `importance` defaults to `1` if not provided.
- `dateAdded` and `updatedAt` are both set when the bookmark is created.
- Invalid input returns `400`.

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
  "dateAdded": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-02T00:00:00.000Z"
}
```

Current behavior:

- `id` is required.
- The backend updates only allowed bookmark fields.
- `updatedAt` is written on every successful update.
- Updating `url` regenerates `favicon` unless the request explicitly provides `favicon`.
- Missing IDs return `400`; unknown IDs return `404`.

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

- Missing IDs return `400`; unknown IDs return `404`.
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
- Sends compact bookmark fields in the prompt.
- Attempts to parse raw JSON first, then JSON inside a Markdown code block.
- AI provider errors return `502`; missing AI configuration returns `503`.

## Error Behavior

Current error handling uses explicit HTTP status codes. Future version-aware sync can add `409` for conflicts after `version` metadata exists.
