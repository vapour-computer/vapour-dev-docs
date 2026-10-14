# What is available today

A snapshot of what you can use, written on **14 October 2026**. Preview items are labelled; a merge or a
source preview is not a deployment.

## Availability

| Component | Status | What you can use |
| --- | --- | --- |
| Standalone profiler (`vapour-profiler`) | Public, early | `probe-test`, the BPF build pipeline, the lifecycle test harness, the `.vpt` v1 trace specification |
| Local performance dashboard | Implemented maintainer checkout; not yet a published release | `dashboard`, authenticated loopback API, CPU/RSS/PSS capture, dump viewer, flamegraphs, offline/Claude reports and comparisons |
| Browser telemetry | Staging-only preview | Metrics, overlay, `.vpt` export and offline or direct-Claude analysis through an explicit integration API. Not wired into the player yet |
| Publishing CLI (`vapour-cli`) | Preview, not yet released | `login`, `logout`, `whoami`, `create`, `publish`, store-page/media validation and upload, and one-time version publishing |
| Publishing GitHub Action (`vapour-ci`) | Preview, not yet released | Composite action and engine templates. Needs a CLI release first |
| Vapour platform (hosted) | Staging | Accounts, tokens, store pages, media, versions, publishing and play on the staging site. Production is not open |

When a guide says "from your checkout" it means a checkout that contains that implementation. Cloning a repository
that has no release yet does not give you the unreleased tool.

## Still planned

- Native Lite/Full metrics, a terminal UI, runtime adapters and symbolization.
- Native `on`, `off`, `live`, `dump`, `analyze`, keyring commands and signed releases.
- Vapour CLI synchronization and simultaneous native/browser source orchestration for the local agent.
- `vapour profiler ...`, `vapour scope ...` and the `vapour://` handler.
- Live player wiring, a cross-origin telemetry bridge and native forwarding.
- Standalone file-analysis command; saved dumps can already be imported/analyzed in the local dashboard checkout.
- A verified three-path demo and measured overhead targets.

## Update this page when code lands

See [dashboard usage](telemetry/dashboard.md) for current instructions. Its native
collection uses `/proc`; full eBPF frame/stack collection remains pending.

Change a workflow's availability only when its command, route or hook actually exists.
