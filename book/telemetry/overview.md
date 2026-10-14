# Choose a capture path

Vapour has two independent collectors and a planned local aggregation endpoint.
They answer different performance questions.

| | Browser collector | Native profiler |
| --- | --- | --- |
| Runs in | The game's own browser document/iframe | Developer's Linux machine |
| Target | Browser game thread and supplied Wasm memory | An explicitly selected Linux process |
| Signals | rAF frames, observer occupancy, memory, optional JS samples | Planned CPU stacks, thread CPU, memory, frames and opt-in probes |
| Privileges | Browser API/policy support and staging owner authorization | Session BPF/perf privileges |
| Current state | Package on feature branch; live loader wiring pending | Embedded BPF uprobe proof only |
| Vapour dependency | Collector remains code-independent of Rust profiler | Standalone; no Vapour account needed |

## Browser path

After the authorized developer explicitly toggles it on, the game loader imports
the collector. It stores bounded data locally and can render an overlay or call
a local metrics consumer. Dump/Analyze are explicit actions. The package does not
request a native installation, discover a local agent or send metrics to an API.

## Native path

The current proof attaches a uprobe to a known symbol in a local process. The
planned profiler will support generic processes and runtime adapters, with Lite
as the default and heavy probes opt-in. Frame metrics are hidden when no frame
marker exists; an arbitrary process does not automatically have an FPS value.

## Combined path

The planned [local agent](local-agent.md) on `127.0.0.1:6767` will expose both
sources to the CLI/staging dashboard. Source labels must preserve their meaning:
browser observer occupancy is not native CPU utilization, and browser memory
estimates are not process RSS/PSS.

## Toggle invariants

- No capture or module fetch until explicit on, with staging and owner gates.
- Off ends collection and releases its resources; browser off is terminal until reload.
- Both captures off means no planned native agent listener or polling.
- No raw telemetry or Claude key travels through Vapour servers.
- Production ships no Devtools/browser-telemetry feature code or routes.

Start with [browser telemetry](browser.md) or the [native proof](native.md).
