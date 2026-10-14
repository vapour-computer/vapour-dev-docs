# CLI command reference

## Publishing CLI — implemented in source preview

Global options: `--api <base-url>`, `--version`, and normal `--help`.

| Command | Options and behavior |
| --- | --- |
| `vapour login` | `--token <PAT>` or `--token -` for stdin; `--no-verify` optionally skips `GET /me` |
| `vapour logout` | Removes the local saved credential file; does not revoke a PAT or unset env vars |
| `vapour whoami` | Queries the selected API and prints identity/role/API base |
| `vapour create <name>` | `--engine godot\|unity\|bevy\|other`, `--from <git-url>`, `--offline` |
| `vapour publish` | `--dir <game-dir>`, `--version <value>`, `--notes <markdown>`, `--notes-file <path>`, `--skip-store`, `--dry-run`; publishes each version once |
| `vapour store check` | `--dir <game-dir>`; validates page JSON, Markdown and media without uploading |
| `vapour store push` | `--dir <game-dir>`; updates the store page without publishing a build version |
| `vapour build` | `--dir <game-dir>`; runs the engine's web exporter or your `build.command`, checks `index.html`, writes `.vapour/build.json`. See [`[build]`](../games/manifest.md#build) |
| `vapour test` | **Preview, in an open pull request.** `--dir`, `--port`, `--no-telemetry`, `--no-profile`, `--no-open`, `--profiler <path>`. Serves your build on `127.0.0.1` with an FPS overlay and, on Linux, opens the profiler. See [Profile locally](../tutorials/profile-locally.md) |
| `vapour controller init` | **Preview, not yet released.** `--dir`, `--mode keyboard-map\|dedicated\|action-map`, `--preset default\|shooter\|dpad-only`, `--force`. Writes a starter `[controller]` (backs up `vapour.toml` first when replacing) |
| `vapour controller check` | **Preview.** `--dir`. Validates `[controller]` and lists each control |
| `vapour controller preview` | **Preview.** `--dir`, `--html`, `--out <file>`. ASCII layout, or an HTML page with `--html` |
| `vapour completion` | Generates shell-completion scripts; use `completion --help` for supported shells |

API base precedence is `--api`, then nonempty `VAPOUR_API`, saved login API,
then `https://api.vapour.ink`. The default string is a source default, not a
deployment/availability guarantee. Token precedence is `VAPOUR_TOKEN`, then the
saved credential. Explicitly select the target for staging and local work.

`publish --dry-run` validates and packs without authenticating, registering or
uploading. It checks the store page unless `--skip-store` is supplied. Release
notes come from `--notes-file`, then `--notes`, then `store.notes` in the manifest.

No currently implemented Go command lists/deletes projects, starts a profiler or
registers a `vapour://` handler. Use the [API reference](api.md) for project
management outside the CLI.

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
