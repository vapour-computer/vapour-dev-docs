# Limits, units and terminology

## Game publishing

| Limit | Current source value |
| --- | --- |
| Build ZIP upload | 512MiB |
| Extracted archive | 1GiB |
| ZIP entries | 5,000 |
| Cover image | 5MiB |
| Game tagline | 140 characters |
| Game description | 2,000 characters |
| Tags | At most 5; each 1–24 characters |
| Profile name/display name | 1–60 characters |
| Developer bio | At most 500 characters |

The archive rejects path traversal, absolute/backslash paths and missing root
entry points. The CLI directory packer also rejects common native binary files
and symlinks. A prebuilt ZIP still needs server validation.

## Browser capture

TTL: 1–300 seconds. Frames: 32,768 retained. Series and memory events: 300 each.
Observer intervals: 512. Optional function samples: 10,000 at 10–1000ms interval.
Heap/document measurement: at most every 30 seconds, one request at a time.

`.vpt`: 50MiB file and 1MiB per record. Direct Claude summary: 24,000 UTF-8 bytes;
response: 256KiB; timeout: 15 seconds. These are implementation bounds, not a
promise of identical memory usage or overhead on every device.

## Native capture

The new dashboard viewer/capture session has a 300s default/maximum TTL, at most
300 live buckets, a 200MiB automatic-dump storage cap, and import limits of 50MiB,
1MiB per record and 150,000 records. Flamegraph display caps at 4096 nodes/64 levels.
Native Claude calls use a 24KB summary, 256KiB response cap and 20s timeout.

Current proof: TTL default 30 seconds, maximum 300; one bounded per-CPU hit map
and 1Hz reads. Planned profiler: TTL default 300, Lite 49Hz sampling, Full 99Hz,
4MiB ring buffer and 50MiB dump. Planned overhead targets are not measurements.

## Terms

- **Frame time:** interval between observed frame markers/rAF callbacks, in ms.
- **FPS:** inverse frame duration or aggregate frames/elapsed time for the stated window.
- **1%/0.1% low:** inverse mean duration of the slowest fraction of retained frames.
- **Main-thread busy:** browser observer occupancy lower bound, not process CPU percent.
- **RSS/PSS:** native resident/proportional resident memory; not available from this browser collector.
- **Wasm linear memory:** allocated buffer size; logical allocation usage can be lower.
- **Grow observation:** sampled size increase; browser data may combine several actual grows.
- **Self samples:** samples attributed to a leaf function; not a reconstructed total-call tree.
- **Dropped/overwritten:** records no longer retained because a bounded buffer rolled over.
- **MiB/GiB:** binary units, 1MiB = 1,048,576 bytes. Trace memory fields contain bytes.
- **Game version:** published content version, distinct from CLI or profiler version.
- **Source preview:** implemented in an audited checkout, not necessarily published or deployed.
