# Export and validate dumps

A game ZIP and a `.vpt` performance dump serve different purposes. Publish the
game ZIP to Vapour; keep performance dumps local unless you deliberately share
one outside the product workflow.

## Open a saved dump in the local dashboard

The implemented maintainer checkout now provides `vapour-profiler dashboard`.
Open its full token-bearing URL in Chromium, click **Open dump**, and select
`.vpt` or `.folded`. Use **Offline report** or **Analyze with Claude**; export
the retained trace with **Export .vpt** and JSON findings with **Save report**.
Imports start no probes. See [dashboard usage](../telemetry/dashboard.md) for
charts, flamegraphs, budgets and before/after comparisons. This command is not
yet part of a published profiler release.

## Single JSON report (`vp-report`)

The profiler can also export one derived JSON file that includes both computed
metrics and (optionally) the full retained trace:

- Dashboard: **Download JSON** button (`/api/report`)
- CLI: `vapour-profiler report capture.vpt -o report.json`

For a smaller metrics-only output, omit `trace` (`/api/report?trace=0` or
`vapour-profiler report --no-trace`).

The schema is
[`docs/schema/vp-report-v1.schema.json`](https://github.com/vapour-computer/vapour-profiler/blob/main/docs/schema/vp-report-v1.schema.json),
and field details are in
[`docs/report-format.md`](https://github.com/vapour-computer/vapour-profiler/blob/main/docs/report-format.md).

## Browser export: available package API

With an active authorized session:

```ts
const text = await session.dump();
const url = URL.createObjectURL(new Blob([text], { type: "application/x-ndjson" }));
const link = document.createElement("a");
link.href = url;
link.download = "capture.vpt";
link.click();
setTimeout(() => URL.revokeObjectURL(url), 1000);
```

Run from an explicit download action. The URL revocation is short-lived download
cleanup, not a telemetry poller. Use `session.dumpFolded()` for a `.folded` string.
Both exports may stop the optional function sampler to collect its final samples.
Dump before off/TTL; stopped browser sessions release their data.

## Format

Version 1 is UTF-8 JSON Lines, one JSON object per line:

1. One `metadata` record with `format: "vpt"`, `version: 1`, source and start time.
2. `metrics`, `frame`, `memory`, `stack`, contextual `spike`, `asset` (profiler `main` branch only, see [below](#the-two-schema-pins)) and optional `probe` records.
3. A completed dump ends with `end`, containing duration and dropped-record counts.

Unsupported values are missing or null. CPU units, observer occupancy and memory
types are not interchangeable. Times are relative milliseconds, memory is bytes.
A partial interrupted trace may omit `end`; a reader must label it partial.

### The two schema pins

The v1 contract exists in two states, and you may meet either:

| Where | Commit | Has the `asset` record | Schema SHA-256 |
| --- | --- | --- | --- |
| The browser telemetry package's pin | [`a019f02`](https://github.com/vapour-computer/vapour-profiler/blob/a019f0293c99ff00c6449468be12d3737d1cf14e/docs/trace-format.md) | **No** | `673c9c4755898fff77e8c6c80f6acd80943a7f3020594cb53d25ee205eb2c36e` |
| The profiler's `main` branch | [`3a7fdb3`](https://github.com/vapour-computer/vapour-profiler/blob/3a7fdb3535e1c43889bc59d49a3808b037bae063/docs/trace-format.md) | **Yes** | `97d85531f1d4fc87ba3fa1f9faa6d45b5a1270813368b40f2ff67faa36a6a9e9` |

The `asset` record was added to version 1 **additively** ([vapour-profiler#2](https://github.com/vapour-computer/vapour-profiler/pull/2)),
so a trace without assets is valid under both. The browser package still vendors the older schema, so its dumps never contain `asset`
records, and it must be re-pinned before a producer there can emit them. The dashboard's importer accepts `asset` records and rejects
a duplicate `id` or an `endMs` before `startMs`. See [Find expensive assets](assets.md).

The browser package vendors its schema and immutable provenance. It has no code
dependency on the profiler. An [illustrative trace](../.gitbook/assets/browser-sample.vpt)
is included in this documentation repo.

## Validate a saved dump today

From the browser branch's `apps/web` after `npm ci`, set `TRACE` to your file:

```sh
export TRACE="/absolute/path/to/capture.vpt"
node --input-type=module <<'JS'
import { readFile, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
assert((await stat(process.env.TRACE)).size <= 50 * 1024 * 1024, 'Oversized dump');
const schema = JSON.parse(await readFile('packages/browser-telemetry/schema/vpt-v1.schema.json', 'utf8'));
const ajv = new Ajv();
addFormats(ajv);
const valid = ajv.compile(schema);
const lines = (await readFile(process.env.TRACE, 'utf8')).trimEnd().split('\n');
let metadata = 0;
let ended = false;
const clocks = new Map();
for (const [index, line] of lines.entries()) {
  assert(Buffer.byteLength(line) <= 1024 * 1024, 'Oversized record');
  assert(!ended, 'Record after end');
  const record = JSON.parse(line);
  assert(valid(record), JSON.stringify(valid.errors));
  if (index === 0) assert(record.type === 'metadata', 'Metadata must be first');
  if (record.type === 'metadata') metadata++;
  assert(metadata === 1, 'Missing or repeated metadata');
  if ('timeMs' in record) {
    assert(record.timeMs >= (clocks.get(record.type) ?? 0), 'Non-monotonic record times');
    clocks.set(record.type, record.timeMs);
  }
  ended = record.type === 'end';
}
console.log(ended ? 'Valid complete trace' : 'Valid partial trace: no end record');
JS
```

This checks schema/ordering without producing a report. Saved-dump analysis is
now available through the local dashboard checkout. Standalone `vapour-profiler
analyze capture.vpt` and `dump` subcommands remain pending. The independent
browser collector still analyzes its active session rather than importing files.
