# Capture lifecycle and budgets

The capture budget is part of the feature, not an optional optimization.

## Current browser lifecycle

```text
Not loaded → authorized explicit on → collecting
                                  → dump / analyze (user actions)
                                  → off / TTL / pagehide / failure → inert until reload
```

The entry module checks the grant before dynamically importing collection code.
The collector repeats the origin/environment check. Off during a pending import
cancels startup. Once started, a session cannot be restarted in the same document.

On stop it cancels rAF/timers, disconnects observers, closes BroadcastChannel,
removes the overlay, clears typed/object buffers and memory accessors, stops the
optional sampler and aborts direct provider analysis. Browser memory measurement
has no cancellation API; an outstanding result is ignored and no new call starts.

| Current browser cap | Value |
| --- | --- |
| TTL | Default/maximum 300 seconds |
| Retained frame records | 32,768 |
| Rolling median | 120 frames; at least 10 for spike warm-up |
| Metric buckets / observed memory grows | 300 each |
| Observer intervals | 512 |
| Optional function samples | 10,000; interval 10–1000ms |
| Optional heap/document measurement | At most once per 30 seconds; one pending call |
| Dump | 50MiB total, 1MiB per line |
| Claude summary / response | 24,000 UTF-8 bytes / 256KiB |
| Claude timeout | 15 seconds |

Overwrites are counted. A dump represents retained buffers; a long high-refresh
capture can lose its oldest frames before TTL. That must not be presented as an
untruncated recording. Explicit export/analysis allocates temporary output;
the no-allocation constraint applies to the hot rAF callback.

## Current native proof

One selected uprobe and bounded per-CPU hit counters, read at most 1Hz. Default
TTL is 30 seconds, maximum 300. RAII closes the link before program/map objects;
kernel FD cleanup handles forced termination. No listener, ring buffer or trace
writer is created by this proof.

## Planned native budgets

Lite sampling: 49Hz. Full: 99Hz. High-frequency sched/syscall data is aggregated
in kernel, not streamed per event. Ring buffer cap: 4MiB with counted drops; dump
cap: 50MiB. Planned governor reduces collection when the measured budget is exceeded.

Targets, not measured claims: frame/CPU/memory-only under 0.5%, Lite under 1%,
Full under 3%. Validate these with the actual sample game and target hardware
before stating them as achieved performance.
