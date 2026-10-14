# Architecture and repository map

## Game delivery

```text
Engine project → web export → vapour CLI → platform API
                                             ├─ Firestore metadata
                                             └─ Storage build/play files
Browser dashboard → player shell → isolated game iframe
```

`vapour.toml` connects a local game directory to its remote project. Publishing
uploads the game ZIP and optional cover. The API validates the archive and serves
the extracted web entry point. The game iframe executes the game's JavaScript
and Wasm; the dashboard is a separate document and usually a separate origin.

## Performance capture

```text
Native Linux process → eBPF + /proc → native profiler
Game iframe          → JS collector → local browser buffers

Planned: both sources → local agent :6767 → CLI / staging dashboard
```

The Rust profiler is standalone open source, with no Vapour account or SDK
dependency. Vapour's CLI integration will resolve game IDs and orchestrate it.
The browser collector is TypeScript and has no Rust/Wasm build of the analyzer.
The shared contract is the versioned **`.vpt` data format**, not shared code.

Each collector has a separate toggle. The native collector needs Linux BPF
privileges. The browser collector needs an authorized staging game document,
feature-supported browser APIs, and an explicit accessor for that game's memory.

## Repository responsibilities

| Repository | Responsibility |
| --- | --- |
| [vapour](https://github.com/vapour-computer/vapour) | Next.js web app, player, browser package branch, samples |
| [vapour-cli](https://github.com/vapour-computer/vapour-cli) | Go publishing CLI; future native integration |
| [vapour-infra](https://github.com/vapour-computer/vapour-infra) | Rust/axum API, emulators, Terraform and deployment |
| [vapour-ci](https://github.com/vapour-computer/vapour-ci) | Publishing action and engine workflow templates |
| [vapour-profiler](https://github.com/vapour-computer/vapour-profiler) | BPF/native profiler, canonical trace schema, future native analyzer |
| [vapour-docs](https://github.com/vapour-computer/vapour-docs) | Earlier engine guides and game samples |
| [vapour-dev-docs](https://github.com/vapour-computer/vapour-dev-docs) | This cross-repository handbook and GitBook navigation |

Check [source status](status.md) before assuming that a repository's public
default branch includes everything listed here.

## Data boundaries

- **Vapour servers:** account/project metadata, game uploads, and eventually
  owner-only staging Devtools preferences. No profiler traces or Claude keys.
- **Native machine:** BPF data, native dumps, analysis summaries and native keyring.
- **Browser:** browser buffers, downloaded dumps, reports and optional browser key storage.
- **Anthropic:** a bounded summary, only after an explicit analysis action with a key.

The performance-locality rule does not change the ordinary game publishing path.
