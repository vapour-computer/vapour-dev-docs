# Local agent and port 6767

**Availability: planned architecture; no 6767 listener exists in the current code.**
The native agent will run on the developer's machine, coordinated by the Vapour
CLI. It will expose both native and optionally forwarded browser telemetry.

## Planned startup

```text
vapour scope on <game-id>
```

The intended flow is:

1. Resolve the game ID to a locally running Vapour game, without accepting a
   remote raw PID or arbitrary executable path.
2. Lazily download a pinned profiler release if needed, checking its checksum
   and signature before execution.
3. Request session privileges for the selected native probes.
4. Start bounded collection and bind **127.0.0.1:6767**.
5. Give the local CLI and authorized staging UI a session-authenticated connection.

Port 6767 replaces the original random-port proposal. A fixed port is not an
authentication mechanism. Origin allowlisting and a session token remain required.
A port conflict must produce an error; the agent must not terminate its owner.

## Two sources, separate capture lifetimes

Native and browser metrics remain source-tagged. Browser-only capture must not
load BPF. Each source has its own explicit toggle, buffers and TTL. The browser
collector must still capture/export/analyze without the native agent installed.

The agent's future browser ingestion must validate the pinned `.vpt` data
contract and bound clients, messages, queues and storage. The TypeScript package
must not import Rust code or a Wasm build of the native analyzer.

## Planned shutdown

Off, TTL expiry or a native target exit ends the relevant capture and releases
its resources. When the final capture ends, the agent closes 6767 and exits.
There is no always-on daemon, systemd service, dormant socket or off-state poller.

Native shutdown is intended to flush a bounded partial dump before detaching;
that trace-flush behavior is not part of the current uprobe proof. Browser off
currently discards its buffers, so export before stopping.

## Security and integration boundaries

- Vapour CLI will allowlist only the confirmed staging dashboard origin.
- Production origins cannot opt themselves in through a feature flag.
- A `vapour://` handler will strictly validate game IDs, profiles, flags and TTLs,
  with a native confirmation for a first origin-triggered session.
- Claude key submission will be token-authenticated and local-only; native keys
  will use the OS keyring. No report/trace/key goes through a Vapour server.

Exact endpoint/message schemas will be published with the API implementation.
Do not hardcode guessed `/metrics`, `/set-key` or WebSocket paths today.
