# Launch Desk Integration

## Relationship

website-link is the remote bookmark source for Launch Desk.

The ownership split is:

```text
website-link owns bookmark metadata.
Launch Desk owns launcher state.
```

## Remote-Owned Fields

website-link owns:

- Title
- URL
- Tags
- Notes
- Importance
- Favicon
- Date added
- Updated date
- Future `version` and deletion metadata

## Launch Desk-Owned Fields

Launch Desk owns:

- Whether a bookmark is pinned to Home.
- Home coordinates.
- Zone membership.
- Folder group placement.
- Local URL item identity.
- Local usage tracking.
- Local cache state.
- Local display or icon overrides if added later.

## Current Launch Desk Behavior

Launch Desk currently:

- Reads the bookmark API URL from settings.
- Optionally sends a bearer token from settings.
- Loads cached bookmarks from local SQLite first.
- Fetches all remote bookmarks from `GET /api/bookmarks`.
- Saves fetched bookmarks to a local SQLite cache.
- Shows bookmarks on the URLs page.
- Searches bookmark title, URL, notes, and tags.
- Opens bookmarks directly in the default browser.
- Pins remote bookmarks as local URL items.
- Adds, edits, and deletes remote bookmarks through website-link API endpoints.

## Pinning Model

When Launch Desk pins a remote bookmark, it creates a local item similar to:

```ts
{
  id: "item-...",
  type: "url",
  title: bookmark.title,
  target: bookmark.url,
  icon: bookmark.favicon,
  remoteBookmarkId: bookmark.id,
  createdAt: "...",
  updatedAt: "...",
  lastOpenedAt: null,
  openCount: 0
}
```

The local item is then placed on the Launch Desk Home grid.

## Duplicate Detection

Launch Desk treats a bookmark as already pinned if either of these matches:

- Local URL item `remoteBookmarkId` equals the remote bookmark ID.
- Local URL item target equals the remote bookmark URL after lowercasing.

## Remote Deletion Behavior

When Launch Desk deletes a remote bookmark through website-link:

- The remote bookmark is removed from website-link.
- The Launch Desk bookmark cache is refreshed.
- Existing pinned local URL items are not automatically deleted.

This is intentional for the current MVP and should be handled carefully in future cleanup flows.

## Compatibility Surface

The most important API endpoint for Launch Desk is:

```text
GET /api/bookmarks
```

Launch Desk also currently uses:

```text
POST /api/bookmarks
POST /api/bookmarks/update
POST /api/bookmarks/delete
```

Breaking changes to these endpoints should be coordinated with Launch Desk.

## Recommended Backend Enhancements For Launch Desk

Recommended improvements:

- Simple bearer token authentication.
- Clear HTTP error status codes.
- Strict request validation.
- Incremental sync endpoint.
- Soft delete or tombstone field.
- Version field for conflict detection.

Recommended authentication header:

```http
Authorization: Bearer <token>
```

Recommended environment variable:

```text
BOOKMARK_API_TOKEN
```

## Future Sync Endpoint

Recommended future endpoint:

```text
GET /api/bookmarks/sync?since=<timestamp>
```

This should return changed bookmarks and deleted tombstones since the provided timestamp.

Do not add this until the data model includes `updatedAt` and deletion metadata.
