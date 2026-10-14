# Production exclusion guardrails

The requirement is stronger than “hide the toggle”: production must not ship,
serve, accept or render Devtools/browser-telemetry functionality.

## Implemented on the browser branch

- The collector is a separate package with no default player import.
- Staging artifacts require explicit build flags, the staging project and an
  exact HTTPS game origin.
- The normal production build removes stale `.staging` and `.next` output.
- Emitted client/server/standalone files and route manifests are checked for
  telemetry markers and routes; shipping the package as a production dependency fails.
- The local HTTP test requires Devtools/API/collector paths to return 404.
- Runtime collector checks reject non-staging grants, non-owners, expired grants
  and an unexpected origin before capture starts.
- No Firestore preference collection, Devtools API or default bootstrap is added.

Run from the browser branch's `apps/web`:

```sh
npm run build
npm run check:production
node scripts/check-production-http.mjs
```

The build rejects `VAPOUR_DEVTOOLS_ENABLED=true` outside staging. Setting an
unknown environment value is also an error. GitHub Actions runs the package,
browser smoke and production-boundary checks on changes to this code.

The recorded 404 test covers the built **Next application**, not a deployed
cloud API or a Firestore rules emulator.

## Required before live UI/player wiring

| Layer | Required enforcement | Current integration status |
| --- | --- | --- |
| Backend config | Production Devtools false; flags cannot override it | Dedicated config/grant integration pending |
| Preference APIs | Production paths 404; staging requires verified game ownership | No new preference API implemented |
| Firestore | Production denies all Devtools-pref access; staging permits the game owner only | Dedicated rules/emulator proof pending |
| Player bootstrap | Owner + backend enabled + explicit toggle before any import | Hook deliberately not connected |
| Routes/callback | No `/devtools/*` registration in production | No Devtools routes registered on branch |
| CSP/headers | Exact staging/direct-provider/local targets; JS profiling policy only for authorized staging sessions | Requires actual game-serving integration |
| Native localhost | Session tokens and staging-origin allowlist | Native API not implemented |

Separate Firebase projects already appear in infra configuration; that alone
does not prove the missing preference rules or backend guards. Keep live
integration disabled until the full checks are implemented and verified.

## Data-flow boundary

Staging Firestore may eventually store only preferences such as profile, flags
and TTL, written on change. Captures, stacks, dumps, provider keys and reports
must remain local or go directly to the explicitly selected provider as a summary.
There must be no server polling/upload path for performance data.

When the future URL handler and native API land, explicitly test hostile params,
non-allowlisted/prod origins, missing tokens, port conflicts and shutdown cleanup.
Do not call those cases verified while the interfaces do not exist.
