# Web export requirements

Vapour publishes **browser builds**, not desktop executables. Your export must
contain an `index.html`, its JavaScript modules, any Wasm it uses and required game
assets. A pure JavaScript game does not need to add a fake `.wasm` file.

```text
build/web/
  index.html
  game.js
  game.wasm
  assets/...
```

Actual names vary by engine. Preserve the relative layout your generated HTML
expects. Use relative asset URLs where practical so the build works under a
game-specific `/play/<slug>/` path. Opening the HTML from `file://` is not a
representative hosting test.

## Packaging rules

**Status: planned:** [chunked large-game delivery](large-games.md) will target
50 GiB/game and 4 GiB/file. These higher limits are not current support; the
existing ZIP limits below still apply. Chunking does not lift engine memory limits.

The source-preview API accepts a ZIP up to **512 MiB**, with at most **5,000
entries** and **1 GiB uncompressed**. It rejects path traversal, absolute paths,
backslash paths and builds without `index.html`. A single wrapping top-level
directory can be stripped by the server. Prefer `index.html` directly at the root
to keep local and server validation consistent.

The CLI checks and ZIPs a build directory. If given a prebuilt ZIP, it uploads it
as-is after ZIP/size checks; it does not repeat every server extraction check.
`--dry-run` is useful but not a promise that every ZIP will be accepted remotely.

Optional cover upload: maximum **2 MiB**; use a supported image such as PNG, JPEG
or WebP. Keep covers separate from the engine's runtime asset bundle when practical.

## Browser hosting details

- Wasm needs `Content-Type: application/wasm` for normal streaming compilation.
- Compressed Unity exports need matching serving/decompression behavior.
- Threads/SharedArrayBuffer require actual cross-origin isolation, including
  subresource headers. Check `crossOriginIsolated` in the game frame.
- Pointer lock is user-gesture only in browsers. If a game asks too early, the player shows an in-frame prompt
  ("Click to play" / "Click to resume"). That click is swallowed so it does not also fire in-game actions.
- After lock engages, the player ignores the first mouse-move spike on web builds to avoid camera jumps.
- On touch-only devices, the pointer-lock prompt is not shown.
- The sandboxed iframe must be the context in which game telemetry runs. Measuring
  rAF or memory on the surrounding dashboard does not profile the game.

Choose your engine guide: [Godot](godot.md), [Unity](unity.md), [Bevy](bevy.md),
[JavaScript frameworks](javascript-frameworks.md) or [other exporters](other-frameworks.md).
