# Unity

Select the Web/WebGL build target supported by your Unity version. Unity editor
labels differ by release: newer versions use Build Profiles, while older
versions use Build Settings.

## Export

1. Switch the project to its Web target.
2. Configure publishing/compression settings to match the server. An uncompressed
   export is the simplest initial check; compressed builds need correctly served
   encoding headers or the engine's decompression fallback.
3. Build into `build/web/`.
4. Confirm that `index.html` and the generated `Build/` assets are present.

```sh
vapour publish --dry-run
vapour publish
```

These commands require the [source-preview CLI](../status.md). Do not assume the
current generic file-serving API infers all engine-specific compression headers;
verify the actual network responses or enable the export's supported fallback.

## CI

The source-preview template uses GameCI's Unity builder for `WebGL`, with Unity
licensing credentials supplied as CI secrets. The example template copies
`build/WebGL/WebGL/` into `build/web/`; inspect your builder's actual output path
instead of blindly assuming that layout applies to every project.

Use the same Unity editor version locally and in CI. Preserve the project files
and version metadata needed to produce a reproducible export.

## Performance

Watch the initial download/compile budget and runtime allocation pressure. A
growing Wasm linear memory high-water mark does not prove a managed leak.
Compare a repeated steady workload and inspect allocation ownership with the
engine's own tools when needed. Vapour's browser collector measures only the
memory instance supplied by the trusted loader; no Unity-specific private field
name is assumed.
