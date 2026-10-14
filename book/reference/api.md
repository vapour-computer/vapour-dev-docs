# Platform API reference

**Availability: source-preview Rust API.** This is the publishing/account API,
not the local dashboard API. Choose an explicit base URL; no region or
live production endpoint is assumed here.

## Authentication

- Web/session requests: `Authorization: Bearer <Firebase-ID-token>`.
- CLI requests: `Authorization: Bearer <vpr_-PAT>`.
- `POST /auth/session` carries `id_token` in its JSON body instead.
- PAT create/publish operations require the `publish` scope and developer role.
- Token management and profile editing require the appropriate Firebase session.

Errors use `{ "error": { "code": "...", "message": "..." } }` and the matching
HTTP status. Common statuses: 400 invalid input, 401 unauthenticated, 403 forbidden,
404 absent, 409 conflict, 413 payload/expansion limit, 500 internal error.

## Account and token endpoints

| Method/path | Purpose and authentication |
| --- | --- |
| `GET /healthz` | Local/API health: `{ "ok": true }`; no auth |
| `POST /auth/session` | Verify/upsert Firebase identity; body `id_token`, optional `role` |
| `GET /me` | Current user/developer and auth kind; ID token or PAT |
| `PATCH /me` | Profile fields; Firebase ID token |
| `GET /users/:uid` | Public UID/name/avatar/created_at; no private email or role |
| `POST /tokens` | Developer Firebase session; body `name`, optional scopes; returns raw PAT once |
| `GET /tokens` | Developer Firebase session; lists token metadata, never secrets |
| `DELETE /tokens/:id` | Owner Firebase session; revokes token; 204 |

## Project and publication endpoints

| Method/path | Purpose |
| --- | --- |
| `POST /projects` | Developer creates draft; body title, optional slug, engine |
| `GET /projects` | Developer's games, including drafts |
| `GET /projects/:id` | Owned game; unknown 404, another owner's game 403 |
| `PATCH /projects/:id` | Owner edits title/tagline/description/tags |
| `PUT /projects/:id/store` | Owner updates page metadata and optional banner, cover, screenshots and trailer; does not create a build version |
| `POST /projects/:id/publish` | Owner uploads a new version, build ZIP and optional release notes; a version value can be used once |
| `POST /projects/:id/unpublish` | Owner sets game to draft, retaining stored files |
| `DELETE /projects/:id` | Owner deletes project and stored build/cover/play files |

Publish response: `{ "game": Game, "url": "<web-base>/games/<slug>" }`.
The game includes identifiers, developer UID, title/slug/engine, version,
build/cover/play URLs, status and creation time. Status is `draft` or `published`.
See [limits](limits.md) for input and ZIP limits.

## Public catalog and game delivery

| Method/path | Purpose |
| --- | --- |
| `GET /home?limit=20&cursor=<opaque>` | Published games/devs with `next_cursor` |
| `GET /games/:slug` | Published game and developer; otherwise 404 |
| `GET /games/:slug/page` | Complete public store-page data and layout for a published game |
| `GET /games/:slug/releases` | Published version history and release notes |
| `GET /categories` | Supported store categories for filters and forms |
| `GET /media/...` | Store image or trailer at a media URL returned by the API; clients should not construct this path |
| `GET /devs/:uid` | Public developer and published games |
| `GET` or `HEAD /play/:slug[/<path>]` | Published extracted game files; root resolves to index.html |

The source server assigns MIME types, browser isolation/resource headers,
frame-ancestor policy tied to the web origin, and cache lifetimes. Missing files
or unpublished games return 404. Verify those headers on the actual deployment.

Store updates use multipart form data: a JSON metadata part describes tagline,
description, category, tags and the page layout, while optional file parts carry
media. Public page responses expose usable media URLs, category and releases;
consumers do not need storage details. See [store-page limits](limits.md#store-page-media).

## Not yet available

No dedicated Devtools-preference/owner-grant API is implemented. The browser package does not upload metrics to any of
these publishing endpoints. The new local dashboard checkout listens on 6767;
its token-authenticated endpoints are documented in [Local agent](../telemetry/local-agent.md).
