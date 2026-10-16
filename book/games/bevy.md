# Bevy and Rust

> **Prefer a walkthrough?** The [Bevy tutorial](../tutorials/bevy.md) takes a real sample project from export to a phone-ready build, step by step.

Bevy web builds target `wasm32-unknown-unknown`. Trunk can package the Wasm output
and generate browser-loading assets from an HTML entry point.

## Set up the toolchain

```sh
rustup target add wasm32-unknown-unknown
cargo install trunk --locked
```

Use the Rust, Bevy and Trunk versions pinned by your game project. Choose WebGL2
or WebGPU support according to the target browser set; do not infer engine
feature flags from a different Bevy release.

Example `index.html` at the game project root:

```html
<!doctype html>
<html>
  <head><meta charset="utf-8"><title>My Bevy Game</title></head>
  <body><link data-trunk rel="rust" href="Cargo.toml" data-wasm-opt="z"></body>
</html>
```

## Build and publish

```sh
trunk build --release --public-url ./ --dist build/web
vapour publish --dry-run --version 0.1.0 --notes "Dry run"
vapour publish --version 0.1.0 --notes "First release"
```

Set `project.engine = "bevy"` and `build.dir = "build/web"` in the manifest.
Relative public URLs help the export load under Vapour's game-specific path.
Publishing requires the [source-preview CLI](../status.md).

## Native versus browser profiling

A Bevy browser export is inspected by the browser collector. A Linux process is
the native collector's target. Do not assume that a browser-targeted Wasm binary
can run directly under wasmtime: it may require browser APIs/imports. Future
wasmtime examples need a Wasm program designed for that runtime's import/WASI
contract.

For named Wasm function samples, the loader/runtime must expose usable symbols
or name-section information. The current browser package preserves names supplied
by the browser and does not fabricate missing mappings.
