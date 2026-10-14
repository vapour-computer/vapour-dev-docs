# What is available today

This is a source audit dated **14 October 2026**, not a deployment-status check.
No cloud rollout, token issuance or game publication was performed to write it.

## Availability matrix

| Component | Source status | Usable interface in that source |
| --- | --- | --- |
| Standalone profiler | Published `vapour-profiler/main`, `a019f0293c99ff00c6449468be12d3737d1cf14e` | `probe-test`, BPF build pipeline, lifecycle harness; v1 trace specification |
| Browser telemetry | Published `vapour/feat/browser-telemetry`, `edde6951f4d44aecc07013d4af252449d83b5d34` | Explicit integration API, metrics, overlay, exports, offline/direct-Claude analysis, production checks |
| Go publishing CLI | Local source preview `b8794df4a9ee15487f25be08ee077c852a809348`; public `main` was still `bd0aaf3` | `login`, `logout`, `whoami`, `create`, `publish` |
| Rust platform API/infra | Local source preview `344eff97e4d1c4c7f16b67b685fe5e9c0b749d97`; public `main` was still `fc3f2d3` | Account/token/project APIs, local emulator stack, Terraform/deploy script |
| Publishing GitHub Action | Local source preview `67438f4d50564401b758bd2a51d0645b1b7efb6b`; no public tags found | Composite action and engine templates; requires an actual CLI release |
| Web API/auth integration and Docker image | Local source preview `f17682ba34d262cb47baccd4babbdb307117c2c8` | Runtime web config, authentication, dashboard and Dockerfile; not included in the telemetry branch |

When a source-preview guide says “from your checkout,” it means a checkout
containing that implementation. Cloning an initial public repository does not
magically provide unpublished source. Obtain the maintainer checkout or wait for
its source/release publication. No CLI release was listed during the audit.

## Still planned

- Full native Lite/Full metrics, TUI, adapters and runtime symbolization.
- Native `on`, `off`, `live`, `dump`, `analyze`, keyring commands and signed releases.
- The local agent listener on **127.0.0.1:6767**, token-authenticated API and CLI sync.
- `vapour profiler ...`, `vapour scope ...`, and the `vapour://` handler.
- Production-denied Devtools preference APIs/rules and backend owner grants.
- Live dashboard/player wiring, cross-origin telemetry bridge and native forwarding.
- Native `.vpt` ingestion/analysis and a browser UI for importing saved dumps.
- A verified three-path demo and measured overhead targets.

Browser sampling preserves names exposed by the browser. Runtime-specific Wasm
name-section mapping still needs a real loader integration.

## Verification already recorded

The browser branch passed 18 focused tests, a real cross-origin Chromium iframe
capture, a production output scan over 369 files and production HTTP 404 checks.
The provider test used a mocked Anthropic response, not a billable live request.

The native build and Clippy checks passed. An earlier privileged run passed six
lifecycle cases; the subsequent 1Hz timing correction still needs its privileged
rerun, as recorded in the profiler's `docs/verification.md`. Neither result is a
published runtime-overhead benchmark.

## Update this page when code lands

Record an immutable revision, release tag if any, and verification evidence.
Change a workflow's availability only when its actual command, route or hook
exists. A merge is not automatically a deployment.
