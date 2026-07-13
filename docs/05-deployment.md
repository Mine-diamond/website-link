# Deployment

## Target Platform

website-link is intended to run on Cloudflare Pages.

The project currently has no build step. The repository root is the static site root.

## Cloudflare Pages Settings

Recommended settings:

```text
Build command: none
Build output directory: /
Root directory: repository root
```

The exact Pages UI may require leaving the build command empty and using the project root as the output directory.

## Functions

The API is implemented with Cloudflare Pages Functions:

```text
functions/api/[[path]].js
```

This catch-all function handles all `/api/*` requests.

## KV Binding

Required KV binding:

```text
BOOKMARKS_KV
```

The API reads and writes the key:

```text
bookmarks
```

The value is a JSON array of bookmark records.

## AI Environment Variables

AI search requires:

```text
AI_API_KEY
```

Optional variables:

```text
AI_API_BASE_URL
AI_MODEL
```

Current defaults:

```text
AI_API_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-chat
```

If `AI_API_KEY` is not configured, `POST /api/bookmarks/ai-query` returns an error object.

## Optional API Authentication

For simple bearer-token authentication, add:

```text
BOOKMARK_API_TOKEN
```

When configured, the API checks:

```http
Authorization: Bearer <token>
```

Vortex and the browser extension both support this token. Vortex stores it in Windows Credential Manager under `tech.minediamond.vortex/bookmark-api-token`; the token is used only by its Rust backend and is not returned to the WebView. If this variable is not configured, the API remains open for compatibility.

## Redirects

The `_redirects` file contains:

```text
/search /index.html 200
```

This allows routes such as:

```text
/search?q=cloudflare
```

The frontend reads the `q` query parameter and runs a search after bookmarks load.

## Browser Extension Deployment

The extension is not deployed through Cloudflare Pages.

For local installation:

1. Open the browser extensions page.
2. Enable developer mode.
3. Load the `extension/` directory as an unpacked extension.
4. Configure the API URL in the popup if needed.

## Local Development Notes

Because there is no local dev server configuration in this project, opening `index.html` directly will not provide the Cloudflare Functions API.

For realistic local API testing, use a Cloudflare Pages compatible local dev flow such as Wrangler Pages dev.

The repository currently does not include a `wrangler.toml` file.
