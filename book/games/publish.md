# Publish and verify a build

**Availability: staging through the source-preview CLI.** Select your target
environment before publishing. A publication uploads the store page and game
build, creates a version and makes the game visible to players.

## Before upload

1. Export the intended engine/project revision for Web.
2. Inspect `vapour.toml`: project ID, engine, version, export directory and
   `[store]` paths.
3. Run `vapour whoami` against the intended API and confirm developer access.
4. Validate the store page:

```sh
vapour store check
```

5. Run the dry run:

```sh
vapour publish --dry-run
```

The CLI validates the manifest, store text, layout and media, packs a directory
or selects the supplied ZIP, checks release notes, and enforces local upload
limits. Dry run exits before API authentication, registration or upload. It does
not load the game in a browser, test ownership, or run all server-side checks.

## Upload

```sh
vapour publish --version 0.2.0
```

For a different game directory:

```sh
vapour publish --dir ./games/my-game --version 0.2.0
```

If the project has no ID, the CLI registers it first and saves the assigned ID.
It updates the store page first, then sends the version, release notes and build
ZIP. Updating the store first prevents rejected media from consuming a version.
The service checks ownership and the archive before publishing. The CLI prints
the public game-page URL.

## Versions and release notes

Each version value can be published only once. Before the next release, change
`project.version` in `vapour.toml` or override it for one command:

```sh
vapour publish --version 0.2.1
```

Add Markdown release notes inline or from a file:

```sh
vapour publish --notes "Added gamepad controls"
vapour publish --notes-file release-notes.md
```

`--notes-file` takes precedence over `--notes`; when neither supplies text, the
CLI reads the file configured by `store.notes`. Release notes are limited to
5,000 characters.

Use `--skip-store` to publish only the build and leave the existing page as it
is. A dry run still checks the store page unless `--skip-store` is also present.

## Update the page without a build

```sh
vapour store check
vapour store push
```

`store check` validates locally and uploads nothing. `store push` validates and
updates the page without creating a build version. For an offline-created game,
the first push registers the project and writes its ID to `vapour.toml`.

## Verify the outcome

- Inspect the returned game page and public catalog entry.
- Open the player, checking the entry point and all asset requests.
- Confirm Wasm MIME type and compression behavior in the browser network panel.
- Verify input, audio and thread/isolation requirements with the actual hosted build.
- Record the project ID, version, engine version and source commit with your artifact.

Game HTML is cached for approximately 300 seconds and other served game assets
for 3600 seconds in the source API. When diagnosing a stale build, inspect the
actual asset URL/version and disable cache in your test session before assuming
that the upload failed.

## Retry and recovery

An HTTP error after project creation can leave a valid registered project without
a successful build publication. Keep its saved ID and investigate before creating
a duplicate project. For 401 check credentials/environment, for 403 ownership/role,
for 409 the slug, and for 400/413 archive validation/limits.

A used version cannot be overwritten. To restore older content, publish a
known-good artifact under a new version value. See [game management](manage.md).
