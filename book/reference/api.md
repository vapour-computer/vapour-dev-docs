# Platform API reference

**Availability: source-preview Rust API.** This is the publishing/account API,
not the planned native localhost API. Choose an explicit base URL; no region or
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
| `POST /projects/:id/publish` | Owner uploads multipart version/build ZIP/optional cover |
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
| `GET /devs/:uid` | Public developer and published games |
| `GET` or `HEAD /play/:slug[/<path>]` | Published extracted game files; root resolves to index.html |

The source server assigns MIME types, browser isolation/resource headers,
frame-ancestor policy tied to the web origin, and cache lifetimes. Missing files
or unpublished games return 404. Verify those headers on the actual deployment.

## Not yet available

No dedicated Devtools-preference/owner-grant API or native localhost endpoint
schema is implemented. The browser package does not upload metrics to any of
these publishing endpoints. The local agent's port is planned as 6767; paths and
message versions must come from its future documented API, not this table.
