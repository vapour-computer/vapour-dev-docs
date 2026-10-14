# Publish and verify a build

**Availability: source-preview CLI/API.** Select your target environment before
publishing. A publication uploads game code and changes project visibility.

## Before upload

1. Export the intended engine/project revision for Web.
2. Inspect `vapour.toml`: project ID, engine, version, export directory and cover.
3. Run `vapour whoami` against the intended API and confirm developer access.
4. Run the dry run:

```sh
vapour publish --dry-run
```

The CLI validates the manifest, packs a directory or selects the supplied ZIP,
and checks the 512MiB upload cap. Dry run exits before API authentication or
registration. It does not load the game in a browser, test ownership, or run all
server-side extraction checks.

## Upload

```sh
vapour publish --version 0.2.0
```

For a different game directory:

```sh
vapour publish --dir ./games/my-game --version 0.2.0
```

If the project has no ID, the CLI registers it first and saves the assigned ID.
It then sends a multipart request with the version, build ZIP and optional cover.
The API checks ownership, validates/extracts the ZIP, stores it and marks the game
published. The CLI prints the public game-page URL.

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

Republishing uploads a build again; it is not an atomic “select an old version”
command. Keep known-good release artifacts if you want to upload a rollback build.
See [game management](manage.md).
