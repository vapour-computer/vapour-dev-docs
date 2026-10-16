# CLI: every command, step by step

This walkthrough covers every top-level `vapour` command in the current CLI
source, including the `store` and `controller` subcommands. Follow the local
steps first. Commands that contact the API need a developer token and a
compatible staging service; **do not publish a test version by accident**.
Check [availability](../status.md) and your binary's `--help` before starting.

## 1. Install and find your way around

Follow [prerequisites](../getting-started/prerequisites.md) to install a release.
For unreleased commands, use a matching source checkout. Inspect the logo and command list:

```sh
vapour --help
vapour --version
vapour publish --help
```

The lowercase wordmark and blue particles appear only in root help. Redirected
help uses plain text; command output you pipe stays clean. Use `vapour <command> --help` for its exact flags. The
global `--api <base-url>` selects an API; a custom host needs an explicit
trust opt-in (`--allow-custom-api`). Local HTTP is allowed only for localhost
with `--allow-insecure-http`. Do not send your token to an unknown host.

## 2. Account: `login`, `whoami`, `logout`

Create a personal access token in your developer dashboard. Use stdin rather
than putting the token in shell history:

```sh
vapour login --token -
vapour whoami
```

Type the token into standard input, then press Enter. The CLI does not print a
prompt. `login` verifies the account via the selected
API; `--no-verify` skips that network check but does not grant permissions.
`whoami` confirms the active account, role and API base. `VAPOUR_TOKEN` takes
precedence over the saved token. At the end of this tutorial, run
`vapour logout` to remove the saved credential; it does not revoke a token or
clear `VAPOUR_TOKEN`. See [tokens](../auth/tokens.md).

## 3. Start a project: `create` or `template`

Choose **one** route and replace the example name:

```sh
vapour create "My Game" --engine godot
```

This makes a project manifest and starter store files. `--engine` also accepts
`unity`, `bevy` and `other`. `--from <git-url>` imports source; `--offline`
uses local scaffolding without network. Alternatively:

```sh
vapour template godot "My Game"
```

`template` clones an engine-specific skeleton. Bevy and Unity are also
supported; `--org` selects its GitHub organization and `--offline` uses the
local fallback. The skeleton is not a complete engine game. Add your project
and a Web export. See [templates](../templates/overview.md) and the
[manifest reference](../games/manifest.md). Run subsequent commands inside
the new game directory, or pass `--dir <game-dir>` where supported.

## 4. Build and inspect: `build`, `perf`, `test`

Set `[build].dir` to your Web export folder, with a top-level `index.html`.
Install the matching engine/export tools, then run:

```sh
vapour build
vapour perf
vapour test --no-profile
```

`build` runs the configured exporter, validates the output and writes
`.vapour/build.json`. `perf` prints engine-specific warnings; use
`--engine godot|unity|bevy` to choose a different engine for that check.
`build`, `test` and `publish` accept `--no-perf-hints` to silence hints.
`test` serves the build on loopback with an FPS overlay; the serve-time
injection does not rewrite your build. On Linux, profiling can launch a
private browser and local profiler. `--no-profile` skips that integration;
`--no-telemetry`, `--no-open`, `--port` and `--profiler <path>` control the
other test paths. Stop the server with Ctrl-C. See
[profile locally](profile-locally.md).

## 5. Prepare phone input: `controller init`, `check`, `preview`

If you want on-screen controls, run:

```sh
vapour controller init --mode keyboard-map --preset default
vapour controller check
vapour controller preview
vapour controller preview --html --out controller-preview.html
```

The initializer writes `[controller]` in `vapour.toml`; `check` validates
bindings and `preview` draws an ASCII layout or writes HTML. Set the keys to
those your game actually handles. Other presets are `shooter` and
`dpad-only`; `dedicated` uses named actions instead of keyboard keys.
`--force` replaces existing controls **after making a manifest backup**.
Test the result in a phone-sized viewport; config validation does not prove
the player supports a device. See [controls](../games/manifest.md).

## 6. Prepare the store: `store check`, `store push`

Edit `store/page.json`, `store/template.md` and the referenced media.

```sh
vapour store check
```

This is local validation; fix any reported fields or media before continuing.
When you intend to update the remote page without a build, run
`vapour store push`. It requires login, uploads the page and may register a
new game, writing its project ID into `vapour.toml`. See
[store page](../games/store-page.md).

## 7. Check the ZIP: `scan`

```sh
vapour scan
vapour scan ./build/web --json
```

With no argument, `scan` uses the manifest's `build.dir`. A folder is packed
temporarily for static checks. Errors block publishing; `--json` gives
machine-readable findings. Scanning is a heuristic, not antivirus. See
[ZIP verification](../games/zip-verification.md).

## 8. Publish safely: `publish`

```sh
vapour publish --dry-run --version 0.1.0 --notes "First release"
```

Supply a new version and exactly one of `--notes` or `--notes-file` even on
a dry run. This validates the store and ZIP, scans and signs the archive,
and writes `.vapour/build.zip.attestation.json`; it does not log in or upload.
For a real publication, remove `--dry-run` **only when you are ready**:

```sh
vapour publish --version 0.1.0 --notes "First release"
```

It updates the store first, then uploads the ZIP and signed attestation.
Each version is single-use. The server verifies the upload and an admin
reviews it before it goes live. `--skip-store` leaves the page unchanged.
`--experimental-chunks` is a separate, server-dependent preview; it scans
but does not send a signed ZIP attestation or release notes. Do not use it
against an ordinary ZIP-only API. See [publishing](../games/publish.md).

## 9. Check integrity: `verify`

```sh
vapour verify ./build.zip --attestation .vapour/build.zip.attestation.json
vapour verify --remote --version 0.1.0
```

The first command checks an **exact copy of the signed ZIP**. Folder
publishing uses a temporary ZIP, so zipping the folder again may change the
hash; if you did not keep the original ZIP, use the second command. Remote
verification checks the signature and server record, but **not** local ZIP
bytes when no ZIP is supplied. `--json` emits a result for scripts. Remote
checks require the project ID and login. See [ZIP verification](../games/zip-verification.md).

## 10. Keep tools and help current: `update`, `llm`, `completion`

```sh
vapour update --check
vapour llm --offline
vapour completion --help
```

`update --check` queries releases without replacing the binary; `update`
installs a release after checksum verification on supported systems.
`--version <tag>` selects one release. Windows users download the release
archive instead of self-updating. `llm` prints the assistant guide to
standard output. `--offline` uses its cache or embedded copy; `--refresh`
forces a fetch and `--url <url>` overrides the source. `completion` generates
shell scripts; follow its help for your shell. If update notices are unwanted,
set `VAPOUR_NO_UPDATE_CHECK=1`.

Finally, run `vapour logout` if you saved a token on a shared machine.
For options and environment rules, see the [CLI reference](../reference/cli.md).
