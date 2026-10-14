# Export and validate dumps

A game ZIP and a `.vpt` performance dump serve different purposes. Publish the
game ZIP to Vapour; keep performance dumps local unless you deliberately share
one outside the product workflow.

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
2. `metrics`, `frame`, `memory`, `stack`, contextual `spike` and optional `probe` records.
3. A completed dump ends with `end`, containing duration and dropped-record counts.

Unsupported values are missing or null. CPU units, observer occupancy and memory
types are not interchangeable. Times are relative milliseconds, memory is bytes.
A partial interrupted trace may omit `end`; a reader must label it partial.

Canonical contract: [trace-format.md](https://github.com/vapour-computer/vapour-profiler/blob/a019f0293c99ff00c6449468be12d3737d1cf14e/docs/trace-format.md).
Pinned schema SHA-256:

```text
673c9c4755898fff77e8c6c80f6acd80943a7f3020594cb53d25ee205eb2c36e
```

The browser package vendors that schema and immutable provenance. It has no code
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

This checks the shared schema and record ordering; it does not produce a report.
The current Rust executable has **no dump/analyze command**, and the browser UI
has no saved-dump importer. Analyze the current browser session before stopping,
or retain the valid dump for the forthcoming file analyzer. Do not advertise a
nonexistent `vapour-profiler analyze capture.vpt` as a working command.
