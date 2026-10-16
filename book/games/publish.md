# Publish and verify a build

**Availability: staging through the CLI; ZIP signing is a source preview.** Select your target
environment before publishing. A publication uploads the store page and game
build and creates a version. The server verifies the ZIP and an admin reviews
the version before it goes live.

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
vapour publish --dry-run --version 0.1.0 --notes "Dry run"
```

The CLI validates the manifest, store text, layout and media, packs a directory
or selects the supplied ZIP, checks release notes and local upload limits, then
scans and signs the ZIP. It writes `.vapour/build.zip.attestation.json` even on
a dry run. Dry run exits before API authentication, registration or upload. It does
not load the game in a browser, test ownership, or run all server-side checks.

## Upload

```sh
vapour publish --version 0.2.0 --notes "Release 0.2.0"
```

For a different game directory:

```sh
vapour publish --dir ./games/my-game --version 0.2.0 --notes "Release 0.2.0"
```

If the project has no ID, the CLI registers it first and saves the assigned ID.
It updates the store page first, then sends the version, release notes and build
ZIP. Updating the store first prevents rejected media from consuming a version.
The service checks ownership before accepting the upload and verifies the archive asynchronously. The CLI prints
the game-page URL, but upload does not mean the version is live. See
[.zip verification](zip-verification.md) for the local and server checks.

## After you upload

The server rejects missing, forged or mismatched attestations before storing
the build. After accepting a valid signed ZIP, it scans the archive in the
background. The version is not live until an admin approves it. Run
`vapour verify --remote --version <version> <zip>` to see the zip check result,
and watch the game list on the dashboard for the review badge. While a new
version waits, players keep playing the previous approved version. Read
[.zip verification](zip-verification.md) for the zip check and
[Review and approval](review-and-approval.md) for the review step.

## Versions and release notes

Each version value can be published only once. Before the next release, change
`project.version` in `vapour.toml` or override it for one command:

```sh
vapour publish --version 0.2.1 --notes "Release 0.2.1"
```

Add Markdown release notes inline or from a file:

```sh
vapour publish --version 0.2.1 --notes "Added gamepad controls"
vapour publish --version 0.2.1 --notes-file release-notes.md
```

Pass exactly one of `--notes` or `--notes-file`. The selected notes must be
non-empty after trimming. Release notes are limited to 5,000 characters.

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

After uploading, check the server verification record:

```sh
vapour verify --remote --version 0.2.0
```

This checks the signed attestation and server record, not the bytes of a local
ZIP. To check those too, pass the exact ZIP used for upload. A folder publish
packs into a temporary ZIP; use a prebuilt ZIP and retain it when exact-byte
verification matters. Admin review still follows server verification.

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
