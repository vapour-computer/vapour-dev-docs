# Tests and verification

Run the relevant checks from the documented component directory. A passing test
means that gate passed, not that every planned feature or deployment is ready.

## Publishing CLI source preview

From `vapour-cli`:

```sh
go test ./...
go build -o /tmp/vapour-cli-check .
/tmp/vapour-cli-check --help
```

The command help should list the implemented publishing commands, not the future
scope/profiler integration. Local CLI tests do not upload games to production.

## API and local end-to-end workflow

From `vapour-infra`:

```sh
cargo fmt --check
cargo clippy -- -D warnings
cargo test
```

Use `scripts/e2e-local.sh` for the emulator-based create/publish/revoke flow.
Set `GODOT_BIN` for a real engine export; the fallback placeholder does not prove
game playability. See [local development](../getting-started/local-development.md).

## Browser package and production boundary

From the telemetry branch's `apps/web`:

```sh
npm ci
npm run typecheck:browser-telemetry
npm run test:browser-telemetry
```

The focused tests cover owner/environment/toggle gates, off-during-import races,
TTL cleanup, bounds, feature detection, function-sampler caps, key storage,
summary-only direct requests, cancellation, evidence validation and pinned schema.

For real browser behavior, install an isolated test Chromium or use an existing
test executable:

```sh
CHROMIUM_PATH=/usr/bin/chromium node scripts/smoke-browser.mjs
node scripts/check-browser-boundary.mjs
npm run build
npm run typecheck
node scripts/check-production-http.mjs
```

The smoke script needs OpenSSL for a temporary loopback test certificate. It
builds test-only staging artifacts and drives a cross-origin iframe. It verifies
actual rAF frames, supplied Wasm memory growth, dump/offline report, lazy fetching
and overlay cleanup. It does not authenticate against a real owner-grant backend.
The following production build removes its staging artifacts and checks output.

CI installs its own Chromium using `npx playwright-core install --with-deps
chromium`; no browser download occurs in the player because of these tests.

## Native lifecycle

From `vapour-profiler`:

```sh
cargo fmt --all --check
cargo clippy --locked --workspace --all-targets -- -D warnings
cargo build --locked --workspace
cc -O0 -g -Wall -Wextra -Werror -o target/probe-target tests/fixtures/probe-target.c
sudo python3 tests/bpf_lifecycle.py
```

The final command is the actual privileged kernel gate. Compilation alone cannot
prove attachment, positive probe hits or cleanup. Review the repository's current
verification record before declaring step 1 complete.

## Not yet verified

The complete staging-toggle-to-report flow, deployed production Firestore denial,
native/browser forwarding on 6767, native saved-dump analysis and three-path
overhead/demo acceptance are future gates. Record actual evidence when they land.
