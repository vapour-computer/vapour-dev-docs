# Configuration reference

Variables belong to different components. Check [availability](../status.md)
before expecting source-preview config to work on a public/deployed revision.

## Publishing CLI

| Variable | Purpose |
| --- | --- |
| `VAPOUR_API` | API base; overridden by `--api`, overrides saved/default API |
| `VAPOUR_TOKEN` | PAT override for automation; overrides the saved credential |
| `XDG_CONFIG_HOME` | Parent of the `vapour/credentials` directory |

The saved credential file contains `token` and optional `api`. The game manifest
contains neither token nor provider key. See [tokens](../auth/tokens.md).

## Rust API runtime

| Variable | Source default / meaning |
| --- | --- |
| `PORT` | `8080`; API listen port |
| `GCP_PROJECT` | `vapour-local`; Firebase/GCP project |
| `STORAGE_BUCKET` | `<project>.appspot.com` |
| `WEB_BASE_URL` | `http://localhost:3000`; game-page links and embedding web origin |
| `PUBLIC_BASE_URL` | `http://localhost:9199`; generated public URLs; configure to correct serving API in deployment |
| `CORS_ORIGINS` | Optional comma-separated exact web origins |
| `FIREBASE_AUTH_EMULATOR_HOST` | Emulator Auth host:port; unset on real deployments |
| `FIRESTORE_EMULATOR_HOST` | Emulator Firestore host:port; unset on real deployments |
| `STORAGE_EMULATOR_HOST` | Emulator Storage host:port; unset on real deployments |
| `RUST_LOG` | Log filter; source/container examples use `info` |

Without emulator settings, Firestore/Storage access uses the service's cloud
identity via cached metadata-server credentials. The data path is not configured
by pasting an API key into the server process.

## Integrated web runtime — unpublished integration

| Variable | Purpose |
| --- | --- |
| `VAPOUR_API_URL` | Server-side API base; absent can use mock catalog |
| `PUBLIC_API_URL` | Browser API base; must have appropriate CORS |
| `FIREBASE_API_KEY` | Firebase web configuration value |
| `FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `FIREBASE_PROJECT_ID` | Firebase project identity |
| `FIREBASE_AUTH_EMULATOR_URL` | Optional local Auth emulator URL |
| `MEDIA_URL` | Optional media origin |
| `GAME_CDN_URL` | Game-serving origin; configure for your environment |

Firebase public web config is not a Claude API key or a user PAT. It still must
refer to the correct environment and be protected by backend/rules authorization.

## Browser telemetry build — published feature branch

| Variable | Purpose |
| --- | --- |
| `VAPOUR_ENV` | `staging`, `production`/`prod`, or `local`; default production |
| `VAPOUR_DEVTOOLS_ENABLED` | `true`/`false`; true allowed only on staging |
| `FIREBASE_PROJECT_ID` | Must equal `vapour-computer-stag` for staging build |
| `VAPOUR_STAGING_PLAYER_ORIGIN` | Exact HTTPS origin of the actual game document |
| `CHROMIUM_PATH` | Test-only browser executable override for the smoke script |

These build flags do not replace the runtime owner grant or create a backend
config endpoint. Runtime changes cannot insert excluded code into production.

## Native build and planned runtime

`CLANG` can select a BPF-capable compiler for the current Rust build. Native
`ANTHROPIC_API_KEY`, OS keyring, origins and local API settings belong to planned
interfaces. They are not consumed by the current `probe-test` command.
