# Other HTML5 and Wasm frameworks

Use `engine = "other"` for a project that exports a browser-compatible static
bundle but does not use one of the named Godot/Unity/Bevy metadata values.
This route does not automatically certify every framework/version or supply a
runtime adapter.

## Plain HTML, Canvas, WebGL and WebGPU

Place `index.html` at the export root and include the application's scripts and
assets. The source-preview CLI accepts an HTML/JavaScript game without a Wasm
file. The `vapour` workspace's `samples/vapour-run/index.html` is a simple example
of a browser-native game layout.

Check keyboard/pointer focus, audio's user-gesture requirement, resize/fullscreen
behavior and required graphics features inside the real sandboxed player.

## Emscripten or custom C/C++ Wasm

Use your project's browser-targeting build/export command. Retain the generated
HTML/JavaScript loader, Wasm and packaged data files together. A raw `.wasm` file
is not a complete browser game, and WASI/system imports are not provided merely
by uploading the module.

Threaded exports need the actual cross-origin-isolation and worker/subresource
headers to be correct. Do not rename compressed files or discard loader files
to make a ZIP smaller. An explicit loader hook is required to pass the real
`WebAssembly.Memory` to telemetry; private runtime field names are not guessed.

## Other HTML5 exporters

If you use a tool such as Defold, GDevelop, Construct, Cocos or another exporter,
follow that tool/version's documented **Web/HTML5 export** procedure, then apply
the same compatibility check below. These names are examples of candidates for
the generic path, not additional audited Vapour integrations or CLI flags.

1. Export to a new clean directory using a browser target.
2. Verify a root `index.html` and every referenced asset.
3. Set `engine = "other"` and `build.dir` to that export directory.
4. Run `vapour publish --dry-run` with the implemented CLI.
5. Publish to the intended test environment and play the hosted build.
6. Verify graphics, input, audio, workers, storage and external network requests.

If the exporter requires a custom backend, a dev server, unsupported browser
imports or hosting behavior the current API does not provide, it needs additional
integration work. A static game upload does not deploy that backend for you.

## Request a dedicated guide

Provide the framework/version, exact export command, output tree, needed headers,
a reproducible sample and successful hosted-play evidence. Maintainers can then
add a versioned guide/test instead of promising compatibility based only on a
framework's marketing name. See [documentation maintenance](../maintenance.md).
