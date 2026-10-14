# Supported engines and frameworks

The current CLI and API accept exactly four engine identifiers:
`godot`, `unity`, `bevy` and `other`. These values are project metadata, not proof
that Vapour compiles your engine or that every engine release has been certified.
The publisher serves a validated static Web/HTML5 export.

| Project/framework | Manifest engine | Guide and support boundary |
| --- | --- | --- |
| Godot | `godot` | [Godot Web export](godot.md); matching editor/templates and supported Web features |
| Unity | `unity` | [Unity Web/WebGL export](unity.md); version/compression/hosting compatibility |
| Bevy | `bevy` | [Bevy/Rust export](bevy.md); Wasm target, browser graphics backend and Trunk |
| Phaser | `other` | [JavaScript frameworks](javascript-frameworks.md); static bundled assets |
| PixiJS | `other` | [JavaScript frameworks](javascript-frameworks.md); renderer plus your game code/assets |
| Three.js | `other` | [JavaScript frameworks](javascript-frameworks.md); static scene/application build |
| Babylon.js | `other` | [JavaScript frameworks](javascript-frameworks.md); static scene/application build |
| Plain Canvas/WebGL/WebGPU | `other` | [Other frameworks](other-frameworks.md); valid browser entry/assets |
| Emscripten/custom Wasm | `other` | [Other frameworks](other-frameworks.md); browser imports and generated loader required |
| Other engines with an HTML5 exporter | `other` | [Export compatibility procedure](other-frameworks.md), not a dedicated certified adapter |

The JavaScript/library rows describe the existing generic web-export route.
There are no dedicated Phaser/PixiJS/Three.js/Babylon.js CLI engine flags,
scaffolds or native adapters. No framework-specific end-to-end certification is
claimed without a tested sample. For example, use `--engine other`, not
`--engine phaser`.

## What every project must satisfy

1. Produce a browser-compatible static output with root `index.html`.
2. Include referenced loaders, shaders, Wasm, textures, audio and data assets.
3. Work under a game-specific URL prefix and the sandboxed iframe.
4. Meet upload/archive limits and any thread/isolation requirements.
5. Pass an actual hosted playthrough, not just a successful upload.

Native executables, Electron applications, server-only Node applications and
Wasm binaries requiring unavailable non-browser imports are not playable web
exports. Use a supported exporter rather than renaming their files.

## Telemetry support is a separate question

The browser collector can observe browser frame cadence independently of the
framework. Wasm memory needs an explicit accessor from that framework's actual
loader. Function names and JS self-profiling depend on browser/runtime support.
No framework name bypasses the staging, ownership or explicit-toggle requirements.
