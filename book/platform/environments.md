# Environments and Firebase projects

Vapour separates local emulators, staging and production. This page records the
configuration found in source, not proof that any environment is currently deployed.

| Environment | Project/config identity | Intended use |
| --- | --- | --- |
| Local | `vapour-local` emulators | API/CLI development and disposable e2e tests |
| Staging | `vapour-computer-stag` | Developer validation and eventual Devtools integration |
| Production | `vapour-computer-prod` | Player-facing service with no Devtools/browser telemetry |

Existing infra documentation records separate Firebase projects. Billing status,
actual origins and deployed revisions must be checked with the environment owner;
they are not inferred from project names or old documentation.

## Different configuration layers

1. **API runtime:** `GCP_PROJECT`, Storage bucket, public/web URLs, CORS and emulator
   variables control the Rust service.
2. **Integrated web runtime:** API/Firebase settings are read by the unpublished
   web integration so the normal application image can be configured at runtime.
3. **Browser telemetry build:** the feature branch has a separate, explicitly
   enabled staging artifact. It cannot be enabled inside an existing production
   bundle by changing runtime config.
4. **Terraform environment:** separate staging/prod directories, variable files,
   state and service configuration.

Do not substitute `GCP_PROJECT` for `FIREBASE_PROJECT_ID`: different components
read different variables. See the full [configuration reference](../reference/configuration.md).

## Staging collector build gate

All of the following are required:

```text
VAPOUR_ENV=staging
FIREBASE_PROJECT_ID=vapour-computer-stag
VAPOUR_DEVTOOLS_ENABLED=true
VAPOUR_STAGING_PLAYER_ORIGIN=https://EXACT-GAME-ORIGIN
```

The default environment is production. `prod` and `production` are accepted
production labels. `local` does not enable the staging collector. Invalid labels,
production enablement attempts, and staging builds using the wrong Firebase
project fail validation.

The ordinary `npm run build` on the telemetry branch is production-only. The
separate `build:browser-telemetry` command produces optional artifacts outside
the normal app output; it does not create a live staging dashboard or route.

## Origins are exact values

The game iframe origin and dashboard origin may differ. Use the actual HTTPS
origins, including port where applicable. A Firebase auth domain or Cloud Run
project name is not automatically the game-frame origin. The collector build
pins the game origin, while the future native agent will allowlist the confirmed
staging dashboard origin.

No production endpoint may accept a request to turn Devtools on. The complete
backend/config/rules enforcement is still a prerequisite for [player wiring](../telemetry/player-integration.md).
