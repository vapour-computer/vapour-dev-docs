# Local agent and port 6767

**Implemented in the maintainer checkout; not yet a published profiler release.**
`vapour-profiler dashboard` starts an authenticated local UI/API on
`127.0.0.1:6767`. See [dashboard usage](dashboard.md) for launch, capture, dump,
keyring and comparison instructions.

## Current lifecycle

Opening the explicit viewer starts no native collection. `--pid PID` authorizes
one target; clicking Start begins 1Hz process CPU/RSS/PSS collection. Imported
`.vpt` and `.folded` files start no probes. The viewer/API stays available until
End session, TTL, signals or native target exit; shutdown flushes native data
locally subject to the storage cap and closes the agent. No daemon is installed.

Every API request requires `Authorization: Bearer SESSION_TOKEN`. WebSockets
use subprotocols `vapour.v1` and the token; the server selects `vapour.v1`.
The exact loopback Host is checked, and browser Origin must match the local UI.
No remote/Vapour origin is allowlisted in this version. A busy port is an error;
the agent never kills the process occupying it.

## Initial dashboard API

| Endpoint | Operation |
| --- | --- |
| `GET /api/status` | Session state/capabilities and most recent metric |
| `GET /api/live` | Authenticated WebSocket updates, at most 1Hz |
| `POST /api/start` | Capture the CLI-authorized PID only |
| `POST /api/trace` | Raw UTF-8 `.vpt` import into an inactive viewer |
| `GET /api/trace` | Export retained trace; active capture exports are partial |
| `GET /api/assets` | Per-asset cost report from the retained trace's `asset` records, hardest first; empty without them. See [Find expensive assets](../analysis/assets.md#the-api) |
| `POST /api/analyze` | `{ "offline": true }` or `{ "offline": false, "model": "claude-sonnet-4-6" }` |
| `POST /api/key` | Store key in OS keyring, never echo it |
| `POST /api/key/remove` | Remove keyring entry; environment keys are separate |
| `POST /api/off` | Flush native capture and end the local session |

Budgets: four WebSocket clients, eight in-flight HTTP handlers, one import/analysis
at a time and a 30-second request deadline. Provider analysis has a 20-second
timeout, 24KB summary cap and 256KiB response cap. Only explicit analysis sends
a summary directly to Anthropic; there is no Vapour-server telemetry path.

## Integration still pending

The intended `vapour scope` commands will resolve game IDs and coordinate the
agent after lazy installation of verified releases. CLI synchronization, signed
installation and the `vapour://` handler are not implemented by this dashboard.

Automatic browser forwarding, simultaneous source toggles and the staging
dashboard bridge remain pending. Browser data can currently be exported as `.vpt`
and opened locally. Future forwarding must retain source labels and separate
budgets; browser-only operation must never load BPF. The browser collector remains
independent and can operate without the native agent.

Remote integration still needs staging-only builds/backend guards, real game-owner
authorization and exact origin handling before it is enabled.
