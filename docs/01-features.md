# Features

## Web App

The web app is the primary bookmark management interface.

Current features:

- Load all bookmarks from the API.
- Display bookmarks as cards.
- Sort visible bookmarks by importance and date in the rendering flow.
- Add a bookmark through a modal form.
- Edit an existing bookmark through the same modal form.
- Delete a bookmark after confirmation.
- Search bookmarks by title, URL, notes, and tags.
- Filter bookmarks by minimum importance.
- Open bookmarks in a new tab.
- Right-click a bookmark card to edit it.
- Switch between light and dark themes.
- Persist the selected theme in `localStorage`.

## Bookmark Form

The bookmark form supports:

- Title
- URL
- Tags, entered as comma-separated text
- Notes
- Importance from 1 to 5 stars

The frontend validates that title and URL are present and that the URL can be parsed by the browser `URL` constructor.

## Search

Normal search uses:

```text
GET /api/bookmarks/search
```

Search can match:

- Title
- URL
- Notes
- Tags

Importance filtering is implemented as a minimum importance threshold.

## AI Search

AI mode is toggled with the robot button in the search controls.

In AI mode:

- The user enters a natural-language query.
- Pressing Enter calls `POST /api/bookmarks/ai-query`.
- The backend sends current bookmarks and the query to an OpenAI-compatible API.
- The response may include matched existing bookmarks.
- The response may include suggested external websites.

Suggested websites can be opened or added as bookmarks.

## Browser Extension

The browser extension provides a compact save flow.

Current features:

- Reads the active tab title and URL.
- Lets the user enter tags, notes, and importance.
- Saves the bookmark to the configured website-link API.
- Stores the API URL in `chrome.storage.sync`.
- Supports system light/dark appearance through CSS media queries.
- Uses a compact Fluent/Mica-aligned style with flat surfaces and inline SVG icons.
- Defaults the API URL to `https://bookmark.minediamond.tech`.

## Launch Desk Integration

Launch Desk uses website-link bookmarks as remote URL data.

Launch Desk currently supports:

- Fetching website-link bookmarks.
- Caching fetched bookmarks locally in SQLite.
- Searching remote bookmarks locally.
- Opening remote bookmarks.
- Pinning remote bookmarks as local URL items.
- Adding, editing, and deleting remote bookmarks through website-link API endpoints.

## Current Limitations

- No API authentication is enforced yet.
- API CORS currently allows all origins.
- API error responses are not consistently represented with HTTP error status codes.
- IDs are generated with `Date.now().toString()` instead of stable UUIDs.
- Bookmarks do not have `updatedAt`, `version`, or tombstone fields.
- Sync is full-fetch only.
- Storage is a single JSON array in one KV key.
- There is no automated test suite.
- There is no README history before this documentation baseline.
