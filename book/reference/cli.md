# CLI command reference

## Publishing CLI — implemented in source preview

Global options: `--api <base-url>`, `--version`, and normal `--help`.

| Command | Options and behavior |
| --- | --- |
| `vapour login` | `--token <PAT>` or `--token -` for stdin; `--no-verify` optionally skips `GET /me` |
| `vapour logout` | Removes the local saved credential file; does not revoke a PAT or unset env vars |
| `vapour whoami` | Queries the selected API and prints identity/role/API base |
| `vapour create <name>` | `--engine godot\|unity\|bevy\|other`, `--from <git-url>`, `--offline` |
| `vapour publish` | `--dir <game-dir>`, `--version <value>`, `--dry-run` |
| `vapour completion` | Generates shell-completion scripts; use `completion --help` for supported shells |

API base precedence is `--api`, then nonempty `VAPOUR_API`, saved login API,
then `https://api.vapour.ink`. The default string is a source default, not a
deployment/availability guarantee. Token precedence is `VAPOUR_TOKEN`, then the
saved credential. Explicitly select the target for staging and local work.

No currently implemented Go command lists/deletes projects, starts a profiler or
registers a `vapour://` handler. Use the [API reference](api.md) for source-preview
project management.

## Standalone native executable — implemented proof

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
