# Overview

## Product Definition

website-link is a personal web bookmark manager. It is designed to keep website bookmarks available through a web UI, a browser extension, and a small HTTP API.

The project is also the remote bookmark source for Launch Desk.

## Current Purpose

website-link currently provides:

- A web page for browsing and managing bookmarks.
- A Cloudflare Pages Functions API for bookmark CRUD and search.
- Cloudflare KV storage for bookmark records.
- A browser extension for saving the active tab.
- An API consumed by Launch Desk.
- Optional AI-assisted search and website suggestions.

## Ownership Boundary

website-link owns remote bookmark metadata.

Launch Desk owns local launcher state and metadata for local-only URL items.

This means website-link is responsible for website-specific data such as URL, title, tags, notes, importance, favicon, and added date for remote bookmarks. Launch Desk is responsible for whether a bookmark is pinned, where it appears in the local Home workspace, folder group membership, zones, local usage tracking, and full metadata for local-only URL items.

## Goals

- Keep a small, personal, remote bookmark library.
- Provide a fast web UI for bookmark management.
- Provide a browser extension save flow.
- Provide a stable API for Launch Desk.
- Keep the backend simple enough for Cloudflare Pages and KV.
- Leave room for better synchronization, authentication, and AI features later.

## Non-Goals

- Do not replace a full browser bookmark manager.
- Do not become a generic knowledge base.
- Do not become a multi-user public bookmark service in the current stage.
- Do not add complex local-first sync until the API and data model are ready.
- Do not block Launch Desk on a database migration from KV to D1.

## Current Deployment

The current public deployment is:

```text
https://bookmark.minediamond.tech/
```

The Cloudflare Pages Functions API is served under:

```text
/api
```

## Current Implementation Summary

- Static frontend: `index.html`, `css/styles.css`, and `js/*.js`.
- API: `functions/api/[[path]].js`.
- Storage: Cloudflare KV binding `BOOKMARKS_KV`, key `bookmarks`.
- Extension: Manifest V3 files under `extension/`.
- Routing: `_redirects` rewrites `/search` to `index.html`.

## Visual Direction

website-link follows a Launch Desk aligned visual direction:

```text
Windows 11 Fluent + Mica Bookmark Workspace
```

The current implementation uses flat Fluent surfaces, subtle borders, restrained shadows, a compact header, and lightly blurred floating layers for modal and toast UI.
