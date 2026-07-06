# Launch Desk Integration

## Relationship

website-link is the remote bookmark source for Launch Desk.

The ownership split is:

```text
website-link owns remote bookmark metadata.
Launch Desk owns launcher state and local-only URL metadata.
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

## Launch Desk-Owned Fields

Launch Desk owns:

- Whether a remote bookmark has a local proxy item.
- Home coordinates.
- Zone membership.
- Folder group placement.
- Local URL item identity.
- Local usage tracking.
- Local cache state.
- Title, URL, tags, notes, importance, and icon for local-only URL items.

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
- Pins remote bookmarks as local remote URL proxy items.
- Adds, edits, and deletes remote bookmarks through website-link API endpoints.
- Edits and deletes remote URL proxy items from Home and All.
- Promotes local URL items into website-link bookmarks.
- Converts remote URL proxy items back to local URL items by deleting the backing website-link bookmark.
- Automatically converts a remote URL proxy item to a local URL item after a successful full refresh confirms that the backing bookmark no longer exists.

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
  tags: bookmark.tags,
  notes: bookmark.notes,
  importance: bookmark.importance,
  createdAt: "...",
  updatedAt: "...",
  lastOpenedAt: null,
  openCount: 0
}
```

The local item is then placed on the Launch Desk Home grid. Home placement, folder group placement, zone membership, and usage tracking remain local to Launch Desk.

## Duplicate Detection

Launch Desk treats a remote bookmark as already pinned when a local URL item has the same `remoteBookmarkId` as the remote bookmark ID.

URL equality is not used for duplicate detection. A local URL item and a remote URL proxy item may point to the same URL while keeping ownership clear.

## Remote Deletion And Conversion Behavior

When Launch Desk deletes a remote bookmark through website-link from the URLs page, the remote bookmark is removed from website-link and the bookmark cache is refreshed.

When Launch Desk deletes a remote URL proxy item from Home or All:

- The backing website-link bookmark is deleted.
- The local proxy item is removed from Launch Desk.

When Launch Desk converts a remote URL proxy item to a local URL item:

- The backing website-link bookmark is deleted.
- `remoteBookmarkId` is cleared locally.
- Title, URL, favicon, tags, notes, importance, placements, zones, folder group placement, and usage tracking are preserved locally.

When Launch Desk promotes a local URL item to a remote URL item:

- A website-link bookmark is created with the local URL metadata.
- The returned bookmark ID is stored as `remoteBookmarkId`.
- The local item becomes a remote URL proxy item.

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

Do not add this until the data model includes `updatedAt`, version metadata, and deletion metadata.
