# Connect the web player

**Availability: integration contract; production/player wiring remains disabled.**
The package must run inside the game iframe. The dashboard's cross-origin JavaScript
cannot inspect the game's Wasm memory or treat its own rAF as the game's frame loop.

## Required inputs from the real player

1. The authoritative game ID and a backend-verified owner identity.
2. Backend config confirming Devtools enabled for staging.
3. The exact staging game origin and expected dashboard/parent origin.
4. The real game `WebAssembly.Memory` accessor, when the runtime exposes it.
5. The explicit browser-telemetry toggle and lifecycle callbacks.

No Godot/Unity/Bevy private field names are assumed. Obtain the actual bootstrap
integration before implementing the accessor or Wasm name-section mapping.

## Owner grant

The current package accepts this shape from a trusted loader:

```ts
type Authorization = {
  environment: "staging";
  firebaseProjectId: "vapour-computer-stag";
  devtoolsEnabled: true;
  authenticatedUid: string;
  ownerUid: string;
  gameId: string;
  expiresAt: number; // epoch milliseconds
  playerOrigin: string;
};
```

The package rechecks environment, project, owner equality, expiry and the exact
build-pinned origin. These checks are **not a server authentication system**.
Do not construct ownership claims from URL parameters, localStorage or an
unvalidated postMessage. The backend owner-grant endpoint does not exist yet.

## Load only after authorization and toggle

Conceptual loader logic:

```ts
if (!browserToggle || !verifiedOwnerGrant) return;
const telemetry = await import("./telemetry/entry.js");
const session = await telemetry.startBrowserTelemetry({
  toggledOn: true,
  authorization: verifiedOwnerGrant,
  options: { getMemory: () => actualGameMemory },
});
```

Even the entry module should not be fetched for ordinary players or while off.
It performs a second guard before importing collection code. The production
bundle must have no such loader path at all; a runtime `if` alone is insufficient.

## Cross-origin transport

`BroadcastChannel` reaches only the same origin. A game-origin collector cannot
use it directly to reach a different-origin dashboard. A future bridge must
validate the exact parent/frame origin and `event.source`, then transport only
bounded telemetry over a MessagePort/postMessage contract. The dashboard can
redistribute locally over its own BroadcastChannel.

The new [port-6767 API](local-agent.md) currently permits only its own local
dashboard origin. Automatic remote-player forwarding is not connected; do not
bypass its origin gate to attach a staging frame. The `onMetrics` callback remains
an explicit consumer boundary; no reconnect or discovery polling happens while off.

## Headers and production gate

Only authorized staging game sessions should receive JS profiling policy
permission. Before connecting any UI, implement the backend config, owner-only
staging preferences, production preference denial and production 404 behavior
described by your platform operators. Restrict direct
analysis connections with the intended staging CSP. The current package does
not modify game-serving headers or deploy Firestore rules for you.
