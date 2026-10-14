# Read a performance report

This is an **illustrative synthetic example**, not an overhead benchmark or proof
that all planned native/browser integrations are complete. The supplied
[example dump](../.gitbook/assets/browser-sample.vpt) is a small format fixture.

## Function samples

Assume the retained sample counts are:

| Function | Self samples |
| --- | ---: |
| `planted_slow_loop` | 80 |
| `update` | 5 |

The slow loop has about 94.1% of these 85 retained self samples. The current
offline browser analyzer ranks it first. That means it dominates **this sample
set**, not that it consumed 94.1% of machine CPU or necessarily caused every spike.

Inspect repeated work, algorithmic complexity and allocation inside that loop.
If the browser cannot sample functions, the report must omit the named-function
conclusion rather than guess it from a low FPS value.

## Frame timing

The fixture includes ten 16ms frame intervals followed by a 48ms interval. The
rolling baseline median is 16ms, so 48ms exceeds twice the baseline and is marked
as a spike. Real reports should compare representative runs, not a tiny example's
tail percentiles.

Low FPS can come from expensive main-thread work, waits, background throttling or
other causes. The collector discards hidden-tab gaps, and observer occupancy is
only a lower bound. A spike by itself does not reveal the responsible function.

## Memory

The sample's observed Wasm memory rises from 65,536 bytes to 131,072 and then
196,608 at one-second steps: a slope of 65,536 bytes/second. The report can flag
steady growth and an observation window containing the frame spike.

It cannot prove that an exact `memory.grow` invocation occurred at the same
instant as the spike, because browser growth is sampled at 1Hz. It also cannot
prove a leak: linear memory may remain allocated after the application releases
objects inside it.

## Investigate and compare

1. Repeat the same scene/input sequence and capture duration.
2. Verify that memory continues growing after warm-up under a steady workload.
3. Inspect object ownership and allocation behavior with runtime/engine tools.
4. Optimize the hot loop or suspected allocation path.
5. Re-capture with the same optional probes and compare frame tails, sampled
   hotspots and memory slope.

Keep the game version, browser/runtime version, profile options, visibility and
dropped-record counts with your report. A three-path planted-slow-function/leak
demo remains a future acceptance test, not a result established by this fixture.
