# CLI command reference

## Publishing CLI

Released in `vapour-cli` v0.1.1. Install it with the
[install script or `go install`](../getting-started/prerequisites.md); you do not
need to build it from a checkout. `go install` names the executable `vapour-cli`.

```text
vapour [command] [flags]
```

Global flags: `--api <base-url>`, `-v, --version`, `-h, --help`. Run
`vapour <command> --help` for the text that matches your installed version.

### Account

| Command | Options and behavior |
| --- | --- |
| `vapour login` | `--token <PAT>` or `--token -` to read the token from stdin; `--no-verify` saves it without calling `GET /me` |
| `vapour logout` | Removes the saved credential file. It does not revoke the token or unset environment variables |
| `vapour whoami` | Asks the selected API who the saved token belongs to and prints identity, role and API base |

### Start a project

| Command | Options and behavior |
| --- | --- |
| `vapour create <name>` | `--engine godot\|unity\|bevy\|other` (default `godot`), `--platform desktop\|native-mobile\|port` (default `desktop`), `--from <git-url>` to clone a sample game, `--offline` to scaffold only. Writes `vapour.toml` and `store/`. Without `--offline` the project is registered with the API |
| `vapour template <engine> <name>` | Engines: `godot`, `bevy`, `unity`. `--org <name>` (default `vapour-computer`), `--offline`. Clones `vapour-template-<engine>`, removes `.git`, then does what `create` does. The templates are skeletons: see [Create or import a project](../templates/overview.md) |

### Build, check and test

| Command | Options and behavior |
| --- | --- |
| `vapour build` | `--dir <game-dir>`, `--no-perf-hints`. Runs the engine's web exporter for Godot, Unity or Bevy, or your `build.command`, checks for `index.html` and writes `.vapour/build.json`. See [`[build]`](../games/manifest.md#build) |
| `vapour perf` | `--dir <game-dir>`, `--engine godot\|unity\|bevy` to override `vapour.toml`. Prints engine-specific web performance guidance and project findings |
| `vapour test` | `--dir`, `--port <n>` (default: a free port), `--no-telemetry`, `--no-profile`, `--no-open`, `--player`, `--mobile`, `--profiler <path>`, `--no-perf-hints`. Serves `build.dir` on `127.0.0.1` with cross-origin isolation headers and an FPS overlay (toggle with Ctrl+Shift+F). `--player` previews in a production-like iframe shell with the sandbox and `allow` attributes; `--mobile` adds a phone-style shell and needs `--player`. On Linux it also starts `vapour-profiler`; `--no-open` skips the browser and the profiler. The overlay is injected while serving and never written to your build folder. See [Profile locally](../tutorials/profile-locally.md) |
| `vapour store check` | `--dir <game-dir>`. Validates `store/page.json`, `store/template.md` and the media files without uploading |
| `vapour controller init` | `--dir`, `--mode keyboard-map\|dedicated\|action-map`, `--preset default\|shooter\|dpad-only`, `--force`. Writes a starter `[controller]` and backs up `vapour.toml` first when replacing |
| `vapour controller check` | `--dir`. Validates `[controller]` and lists each control |
| `vapour controller preview` | `--dir`, `--html`, `--out <file>` (default `controller-preview.html`). ASCII layout, or an HTML page with `--html` |
| `vapour scan` | Path or `--dir <game-dir>` (default `build.dir`), `--json`. Static zip scan without uploading; exits 1 on any error finding. Writes no attestation. Preview, not yet released (CLI v0.2). See [.zip verification](../games/zip-verification.md) |
| `vapour verify` | `<zip>`, `--attestation <file>`, `--dir <game-dir>`, `--json`. With `--remote --version <semver>` (needs a login) also compares the server's recorded SHA-256 and status for that version; exits 1 on a mismatch, a bad signature or a server status other than `verified`. Preview, not yet released (CLI v0.2). See [.zip verification](../games/zip-verification.md) |

### Publish

| Command | Options and behavior |
| --- | --- |
| `vapour publish` | `--dir <game-dir>`, required `--version <semver>`, and exactly one of `--notes <markdown>` or `--notes-file <path>`. Also `--skip-store` (build only), `--dry-run`, `--no-perf-hints` and `--experimental-chunks`. Scans, signs and locally verifies the exact ZIP before upload; the API independently requires and verifies the attestation before storing it. There is no flag to skip the check. Each version can be published once |
| `vapour store push` | `--dir <game-dir>`. Updates the store page without publishing a build version |

`publish --dry-run` validates and packs without authenticating, registering or
uploading. It checks the store page unless `--skip-store` is supplied, and it
writes `.vapour/build.zip.attestation.json` like a real publish. `--version`
and release notes are still required in dry run.

`--experimental-chunks` accepts a local dry run but blocks real uploads until
the protocol can send a signed attestation. Use ZIP publishing for uploads.

### Assistants, updates and shell setup

| Command | Options and behavior |
| --- | --- |
| `vapour llm` | `--refresh`, `--offline`, `--url <url>`. Prints the curated assistant guide fetched from `/llm.txt`, with a cache and an embedded fallback |
| `vapour update` | `--check` only reports, `--version <tag>` installs a specific release such as `v0.1.1`. Verifies the checksum. Not available on Windows |
| `vapour completion <shell>` | Generates a completion script for `bash`, `zsh`, `fish` or `powershell`. Run `vapour completion <shell> --help` for loading instructions |
| `vapour help [command]` | Shows help for any command |

### Environment and files

| Name | Meaning |
| --- | --- |
| `VAPOUR_API` | API base URL. Overridden by `--api` |
| `VAPOUR_TOKEN` | Personal access token. Takes precedence over the saved credential |
| `VAPOUR_NO_UPDATE_CHECK=1` | Turn off the once-a-day release check |
| `VAPOUR_PROFILER` | Path to `vapour-profiler` for `vapour test` |
| `VAPOUR_LLM_URL` | Override the URL `vapour llm` reads |
| `VAPOUR_RELEASES_URL` | Override where `vapour update` and the update check look for releases |
| `~/.config/vapour/credentials` | Saved login. Honors `XDG_CONFIG_HOME` |

Install script variables `VAPOUR_VERSION` and `VAPOUR_INSTALL_DIR` are described in
[installation](../getting-started/prerequisites.md).

API base precedence is `--api`, then nonempty `VAPOUR_API`, saved login API,
then `https://api.vapour.ink`. The default string is a source default, not a
deployment/availability guarantee. Token precedence is `VAPOUR_TOKEN`, then the
saved credential. Explicitly select the target for staging and local work.

Outside CI, the CLI checks GitHub releases at most once per 24 hours and prints
`vapour X.Y.Z is available (you have A.B.C). Run: vapour update` when newer.

No currently implemented Go command lists/deletes projects, starts a profiler on
its own or registers a `vapour://` handler. Use the [API reference](api.md) for
project management outside the CLI.

## Standalone native executable — implemented proof

The newer maintainer checkout also implements:

```sh
vapour-profiler dashboard
vapour-profiler dashboard --pid 12345 --ttl 300 --port 6767
vapour-profiler dashboard --pid 12345 --tree --autostart   # preview: see below
```

`--tree` (needs `--pid`) adds up CPU and memory over the process and all its child processes, which is what a browser needs. `--autostart`
(needs `--pid`) starts capture at launch instead of waiting for the button; `vapour test` passes both. They are in an open pull request.

Default/maximum dashboard TTL is 300 seconds. Open the printed token-bearing
URL in Chromium. A viewer starts no collection; use Start native capture for
the CLI-authorized PID. See [dashboard usage](../telemetry/dashboard.md). This
command is not yet part of a published profiler release.

```text
vapour-profiler probe-test --pid <positive-pid> --binary <target-executable> --symbol <ELF-symbol> [--ttl <1..300>]
```

Default TTL: 30 seconds. The binary must be the selected process's executable.
The proof counts one uprobe's hits and exits on TTL, signal or target exit. It
does not create a localhost server or native trace/report.

## Planned native and Vapour integration commands

The following are design targets, **not current commands**:

```text
vapour-profiler on --pid <PID> | --exec "<cmd>" [--adapter <name>] [--profile lite|full]
vapour-profiler off
vapour-profiler live
vapour-profiler dump -o trace.vpt
vapour-profiler analyze trace.vpt [--offline]
vapour-profiler key set|test|remove
vapour-profiler grant-caps

vapour profiler install|status|update|remove
vapour scope on|off|live|dump|analyze|key ...
```

Selected-probe flags, adapters, TTL defaults and native API options will be
documented against actual help output when implemented. In particular, generic
or wasmtime adapter examples are not executable against the current proof.
