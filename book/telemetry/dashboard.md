# Use the local dashboard

**Availability: implemented in the maintainer's profiler checkout; not yet a
published profiler release.** Use a checkout whose `--help` lists `dashboard`.
The earlier published BPF-only revision does not contain this command.
Chromium is the initially verified browser; Firefox verification is pending.

## Start and connect

From the implemented `vapour-profiler` directory:

```sh
cargo build --locked --workspace
./target/debug/vapour-profiler dashboard
```

Open the **full URL printed in the terminal**, including `#token=...`, in Chromium.
The agent binds to `127.0.0.1:6767`. The token is removed from browser history
immediately and kept only in page memory. Reloading requires the original URL.
Use `--port` for another local port; a conflict never kills its current owner.

No daemon is installed. Opening the viewer starts no probes or process sampling.

## Inspect a dump

Click **Open dump** and select a `.vpt` or `.folded` file. Review the stat cards,
hover over the synchronized charts, and adjust the time-window sliders. Click
a recorded spike to focus its surrounding window. Search the flamegraph by
function name, click a frame to zoom, and select Reset zoom to return.

If the trace has `asset` records, the **Asset load cost** panel ranks them by how hard they were to load: click a row or bar to zoom the
timeline onto that load. A live native capture has none, so it shows "No recorded assets". See [Find expensive assets](../analysis/assets.md).

Flame width means retained sample counts, not elapsed time or CPU utilization.
Flat samples get no invented callers. Flamegraphs and reports use the **whole
retained capture**, even when the timeline is zoomed. Unsupported metrics remain
unavailable. Browser main-thread occupancy is labelled as a lower-bound estimate.

## Capture a Linux process

```sh
./target/debug/vapour-profiler dashboard --pid 12345 --ttl 300
```

Replace `12345` with your game PID, then click **Start native capture**. The API
can capture only that CLI-authorized target, not arbitrary page-supplied PIDs.

Current collection reads **process CPU, RSS and permission-dependent PSS at 1Hz
through `/proc`**. Native FPS, BPF stack sampling and deeper probes are not yet
connected. Their visualizations require real imported trace data. Automatic
browser forwarding and Vapour CLI synchronization remain pending.

## Analyze and compare

- **Offline report:** deterministic analysis with no key or external request.
- **Analyze with Claude:** optional direct request to Anthropic with a bounded
  summary. Raw traces and keys never go through Vapour servers.
- **Save report:** downloads JSON findings and evidence.

Reports rank observed hotspots, flag sustained memory growth and suggest next
steps. Causes remain hypotheses; a growing Wasm high-water mark is not proof of a
leak. Unsupported provider findings are dropped; failures fall back to offline
analysis. Recommendations do not modify or execute game source.

Analyze a baseline, click **Use current summary as comparison baseline**, then
open and analyze the next dump from the same workload/options. Supported FPS,
CPU and memory-growth comparisons appear below the report. The baseline and
last-20-actions capture log live only in this tab.

## Configure Claude

Open **Claude key & model**, enter the key, and click **Save to keyring**.
The input clears immediately; this flow uses no browser key storage. It requires
`secret-tool` (libsecret tools) and an unlocked Secret Service keyring.
**Remove key** deletes the saved keyring entry.

Alternatively, the agent reads `ANTHROPIC_API_KEY` from its launching environment.
That value takes precedence and must be unset in the shell separately. Never
paste literal keys into shared commands or logs. The initial configurable model
is `claude-sonnet-4-6`. Automated tests intercept key saving and do not make a
billable provider call; real keyring/provider use requires your environment.

## Export and stop

**Export .vpt** downloads the retained trace; active native exports are partial.
**End session**, Ctrl-C, SIGTERM, target exit or TTL closes the agent and socket.
There is no automatic reconnect polling. Default and maximum session TTL: 300s.

Native captures automatically flush to `$XDG_DATA_HOME/vapour-profiler/dumps`,
defaulting to `~/.local/share/vapour-profiler/dumps`. Files use mode 0600. Storage
is capped at 200MiB; existing dumps are never overwritten or removed. When full,
the agent prints a warning and cannot save another automatic dump—export before
ending. Imported files are not automatically persisted.

## Budgets and verification

The HTML/CSS/vanilla JS assets total approximately 29KB, with no UI framework,
CDN or external fonts. Imports: 50MiB, 1MiB per record, 150,000 records. Flamegraph
display: 4096 nodes/64 levels. Native capture: at most 300 metric buckets.

Chromium rendering, imports/exports, flamegraphs, offline hotspot/growth reports,
token/origin/Host rejection, native metrics, flushing and off/TTL cleanup passed.
Overhead benchmarks and Firefox verification remain pending. This standalone
local UI is independent of the staging-only remote Vapour player/dashboard.
