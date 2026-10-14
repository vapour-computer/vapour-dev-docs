# Manage, unpublish and restore games

**Availability: source-preview API.** The current Go CLI does not have project
listing, editing, unpublish or delete subcommands. Use the integrated dashboard
where implemented, or the owner-authenticated project API.

## Inspect and edit

- `GET /projects` lists the developer's games, including drafts.
- `GET /projects/:id` retrieves an owned project.
- `PATCH /projects/:id` updates `title`, `tagline`, `description` and `tags`.

Example edit body:

```json
{
  "title": "My Game",
  "tagline": "A small browser adventure",
  "description": "Explore a compact world.",
  "tags": ["adventure", "web"]
}
```

Tagline is capped at 140 characters, description at 2000, and tags at five strings
of 1–24 characters. Tags are trimmed and lowercased. Slug and engine are immutable
after creation. Unknown IDs return 404; another developer's project returns 403.

## Unpublish

`POST /projects/:id/unpublish` sets the project to draft. It is removed from public
catalog/game/play access, while stored files are retained by the unpublish operation.
Use this for taking a game offline without deleting the project.

## Publish again or roll back

The documented publishing interface is an upload to `POST /projects/:id/publish`,
usually via `vapour publish`. There is no documented “republish existing stored
version” endpoint. Export or select the intended ZIP and publish it again under
the existing project ID. The API replaces the previously served extracted version;
do not treat Storage as your sole release archive.

## Delete

`DELETE /projects/:id` deletes the game, removes it from the developer's project
list, and removes its stored builds, covers and play files. This differs from
unpublishing. Retain a local project and any required release artifacts before
using deletion as part of a deliberate cleanup.

PAT requests need the publishing permissions and ownership enforced by the API.
See [token management](../auth/tokens.md) and the [API reference](../reference/api.md).
