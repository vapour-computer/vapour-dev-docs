# Offline and Claude reports

**Available:** active browser-session analysis through the package API, and
saved-dump/native-process analysis in the new local dashboard checkout.
The standalone file-analysis CLI command remains pending.

## Local dashboard workflow

Open a `.vpt`/`.folded` dump or explicitly collect native CPU/RSS/PSS, then click
**Offline report** or **Analyze with Claude**. Native summaries include observed
process CPU and available memory fields; stack-containing imports can rank named
hotspots. No unavailable native frames or stacks are invented. Native analysis
uses the provider trait and keyring/environment key; browser analysis retains its
independent TypeScript implementation and browser key storage.

Use **Save report** for JSON and the comparison-baseline button for before/after
summaries. Reports and flamegraphs cover the whole retained capture, not just
the visible chart range. See [dashboard usage](../telemetry/dashboard.md).

The remainder of this page describes the independent browser package API.

## Run analysis

```ts
const offline = await session.analyze({ offline: true });
const optionalClaude = await session.analyze({ model: "claude-sonnet-4-6" });
```

The second call remains offline if no browser key is stored. With a key, it sends
a direct Anthropic request. The model is configurable; check provider availability
before choosing a newer identifier. The package default is a configured model
name, not a promise that it is the newest model at reading time.

The result contains `mode`, ranked `findings`, optional `warning`, and rendered
`markdown`. Each finding names an observed function if available, cites evidence,
describes a likely cause, suggests a fix and gives confidence.

## Deterministic summary

The TypeScript implementation derives:

- Average FPS, 1%/0.1% lows, threshold percentages and retained spike count.
- Wasm start/peak/end memory and least-squares growth slope.
- Observed memory-growth windows that contain frame spikes.
- Peak observer occupancy, labeled as a lower-bound main-thread estimate.
- Top retained function self-sample counts and relevant support/drop metadata.

It does not invent actual process CPU, unavailable stack callers, or per-function
spike attribution. Browser grow observations have one-second uncertainty.
Both truncation and unsupported APIs limit what a report can conclude.

## Offline behavior

The offline report ranks sampled functions and calls out sustained memory growth
when enough points exist. If function sampling is unsupported or disabled, it
reports available signals without pretending to identify a named hot function.
Wasm memory growth may be a retained high-water mark rather than a leak.

## Optional Claude layer

Only a bounded summary is sent, never the raw timeline, metric series, game ID or
memory-event log. The endpoint is fixed to Anthropic; cookies and redirects are
disabled. The request has a 15-second timeout and 256KiB response cap.

Findings are rejected for unknown function/evidence IDs, unsupported quoted
symbols or numeric values absent from the summary. Displayed evidence comes from
the local summary rather than model-generated citations. Free-text causes are
still hypotheses, not a proof of causality.

Bad key, rate limit, timeout, network failure or an unusable response produces a
clear warning and offline report. Off/TTL cancels the request. No provider call is
made merely because the collector is enabled or a key is stored.

## Read the result

Start with the strongest evidence, reproduce the same workload, change one
likely bottleneck, and compare another capture. Never equate sample percentage
with whole-machine CPU percentage. See the [worked example](worked-example.md).
