# Browser telemetry

**Availability: published package on `feat/browser-telemetry`; not connected to
the live player.** This guide uses the package in its own iframe integration or
isolated test harness.

## Build the package

From the browser branch's `apps/web` directory:

```sh
npm ci
npm run typecheck:browser-telemetry
npm run test:browser-telemetry
VAPOUR_ENV=staging \
FIREBASE_PROJECT_ID=vapour-computer-stag \
VAPOUR_DEVTOOLS_ENABLED=true \
VAPOUR_STAGING_PLAYER_ORIGIN=https://YOUR-STAGING-GAME-ORIGIN \
npm run build:browser-telemetry
```

Use the exact game iframe origin, not the surrounding dashboard origin. The
build requires an HTTPS origin and the known staging project. Output is
`.staging/browser-telemetry/`, outside Next's `public/` and production output.
These artifacts are not automatically served by the player.

## Start a capture through the trusted loader

The [integration guide](player-integration.md) describes the owner grant and
memory hook. Default TTL is 300 seconds, hard-capped at 300. JS heap/document
measurement and function profiling are both off by default.

```ts
const session = await telemetry.startBrowserTelemetry({
  toggledOn: true,
  authorization: verifiedOwnerGrant,
  options: {
    getMemory: () => actualGameMemory,
    ttlSeconds: 300,
    overlay: true,
    onMetrics: consumeOnThisMachine,
  },
});
```

These variable names are explicit loader inputs, not discovered globals. An
absent memory accessor leaves Wasm metrics unavailable rather than measuring
some other document.

## Read the metrics correctly

- **FPS/frame times:** rAF presentation cadence, not GPU render time.
- **Lows:** inverse mean duration of the slowest 1%/0.1% of retained frames in
  the relevant sample window; the 1Hz metric buckets and whole-trace summary differ.
- **Spikes:** greater than twice the preceding rolling median, after warm-up.
- **Main-thread busy:** lower-bound long-task/long-animation-frame occupancy,
  never whole-process CPU percent. Only one observer source is used.
- **Wasm memory:** `memory.buffer.byteLength`, sampled at 1Hz. Several grows can
  coalesce into one observation.
- **JS/document memory:** optional and sampled at most every 30 seconds. Chromium
  heap estimates and user-agent document/worker estimates are labeled differently.
- **Functions:** opt-in JS Self-Profiling, interval at least 10ms, 10,000-sample cap.
  Policy denial/unsupported browsers are reported; no substitute samples are invented.

The overlay can be changed with `session.setOverlay(true|false)`. No per-frame
allocations are made in the collector's rAF callback; buffers are allocated on
capture start and capped. Hidden-tab gaps are omitted rather than called spikes.

## Export, analyze, stop

```ts
const trace = await session.dump();
const folded = await session.dumpFolded();
const offline = await session.analyze({ offline: true });
telemetry.stopBrowserTelemetry();
```

Save exports before off. Dumping function data ends the optional sampler; it is
not silently restarted. Off/TTL/pagehide clears buffers, observers, timers,
channels and the overlay, and aborts pending provider analysis. Another capture
requires a document reload.

For the actual browser smoke test, see [verification](../platform/testing.md).
