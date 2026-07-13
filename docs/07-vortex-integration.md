# Vortex Integration

## Relationship

website-link is the remote bookmark source for Vortex.

The ownership split is:

```text
website-link owns remote bookmark metadata.
Vortex owns launcher state and local-only URL metadata.
```

## Remote-Owned Fields

For remote bookmarks, website-link owns:

- Title
- URL
- Tags
- Notes
- Importance
- Favicon
- Date added
- Updated date
- Future `version` and deletion metadata

## Vortex-Owned Fields

Vortex owns:

- Whether a remote bookmark has a local proxy item.
- Home coordinates.
- Zone membership.
- Folder group placement.
- Local URL item identity.
- Local usage tracking.
- Local cache state.
- Title, URL, tags, notes, importance, and icon for local-only URL items.

## Current Vortex Behavior

Vortex currently:

- Reads the bookmark API URL from settings.
- Stores the optional bearer token in Windows Credential Manager under `tech.minediamond.vortex/bookmark-api-token`.
- Keeps the token behind the Rust/Tauri boundary; the WebView receives only configured/not-configured state.
- Loads the active-scope bookmark cache from local SQLite through a typed Tauri command.
- Fetches all remote bookmarks from `GET /api/bookmarks` through the native Rust HTTP client.
- Transactionally replaces the active-scope SQLite cache after a successful full fetch.
- Shows bookmarks under All > Remote URLs.
- Searches bookmark title, URL, notes, and tags.
- Opens bookmarks directly in the default browser.
- Pins remote bookmarks as local remote URL proxy items.
- Adds, edits, and deletes remote bookmarks through website-link API endpoints.
- Edits and deletes linked remote URL proxy items from Home.
- Reconciles linked local proxies after remote mutations under All > Remote URLs.
- Promotes local URL items into website-link bookmarks.
- Converts remote URL proxy items back to local URL items by deleting the backing website-link bookmark.
- Automatically converts a remote URL proxy item to a local URL item after a successful full refresh confirms that the backing bookmark no longer exists.

## Pinning Model

When Vortex pins a remote bookmark, it creates a local item similar to:

```ts
{
  id: "item-...",
  type: "url",
  title: bookmark.title,
  target: bookmark.url,
  icon: bookmark.favicon,
  remoteBookmarkId: bookmark.id,
  tags: bookmark.tags,
  notes: bookmark.notes,
  importance: bookmark.importance,
  createdAt: "...",
  updatedAt: "...",
  lastOpenedAt: null,
  openCount: 0
}
```

The local item is then placed on the Vortex Home grid. Home placement, folder group placement, zone membership, and usage tracking remain local to Vortex.

## Duplicate Detection

Vortex treats a remote bookmark as already pinned when a local URL item has the same `remoteBookmarkId` as the remote bookmark ID.

URL equality is not used for duplicate detection. A local URL item and a remote URL proxy item may point to the same URL while keeping ownership clear.

## Remote Deletion And Conversion Behavior

When Vortex deletes a remote bookmark from All > Remote URLs, the remote bookmark is removed from website-link and the bookmark cache is refreshed. A linked local proxy is reconciled by the successful full refresh; if the bookmark is absent, the proxy becomes a local URL item instead of being deleted.

When Vortex deletes a remote URL proxy item from Home:

- The backing website-link bookmark is deleted.
- The local proxy item is removed from Vortex.

When Vortex converts a remote URL proxy item to a local URL item:

- The backing website-link bookmark is deleted.
- `remoteBookmarkId` is cleared locally.
- Title, URL, favicon, tags, notes, importance, placements, zones, folder group placement, and usage tracking are preserved locally.

When Vortex promotes a local URL item to a remote URL item:

- A website-link bookmark is created with the local URL metadata.
- The returned bookmark ID is stored as `remoteBookmarkId`.
- The local item becomes a remote URL proxy item.

## Compatibility Surface

The most important API endpoint for Vortex is:

```text
GET /api/bookmarks
```

Vortex also currently uses:

```text
POST /api/bookmarks
POST /api/bookmarks/update
POST /api/bookmarks/delete
```

Breaking changes to these endpoints should be coordinated with Vortex.

## Authentication And Cache Contract

Current requirements:

- Clear HTTP error status codes.
- Strict request validation.
- Bearer token authentication when `BOOKMARK_API_TOKEN` is configured.
- No redirects for authenticated Vortex requests, preventing authorization from being forwarded to another origin.
- HTTPS for non-loopback API hosts. Vortex permits plain HTTP only for `localhost`, `127.0.0.1`, and `::1` development endpoints.
- Full-fetch responses suitable for transactional replacement of the active Vortex cache scope.

Recommended authentication header:

```http
Authorization: Bearer <token>
```

Recommended environment variable:

```text
BOOKMARK_API_TOKEN
```

Potential future improvements:

- Incremental sync endpoint.
- Soft delete or tombstone field.
- Version field for conflict detection.

## Future Sync Endpoint

Recommended future endpoint:

```text
GET /api/bookmarks/sync?since=<timestamp>
```

This should return changed bookmarks and deleted tombstones since the provided timestamp.

Do not add this until the data model includes `updatedAt`, version metadata, and deletion metadata.
