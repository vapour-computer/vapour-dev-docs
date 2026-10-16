# JavaScript frameworks

Phaser, PixiJS, Three.js, Babylon.js and custom JavaScript games use Vapour's
**generic static web-export path**. Set `engine = "other"`. This is not a claim
of a dedicated Vapour adapter or a tested engine-specific build service.

## Shared build workflow

From your existing game project, use its pinned package manager and lockfile.
For an npm project whose scripts define a production build:

```sh
npm ci
npm run build
```

Point `build.dir` at the actual static output, commonly `dist`:

```toml
[project]
title = "My Browser Game"
slug = "my-browser-game"
engine = "other"
version = "0.1.0"

[build]
dir = "dist"
```

If you use Vite, configure a relative asset base for the game subpath:

```ts
import { defineConfig } from "vite";
export default defineConfig({ base: "./" });
```

Other bundlers have different public-path settings. Inspect their output rather
than assuming that every `npm run build` command produces `dist/index.html`.
Publish only the generated static files, not `node_modules`, the dev server, or
your source tree.

```sh
vapour publish --dry-run --version 0.1.0 --notes "Dry run"
vapour publish --version 0.1.0 --notes "First release"
```

Publishing uses the [source-preview CLI](../status.md).

## Phaser

Include all assets referenced by your scenes and preload code. Check image,
atlas, tilemap, font and audio paths under the hosted `/play/<slug>/` prefix.
Test pointer/keyboard focus and audio startup after a user gesture inside the
iframe. Vapour does not infer a Phaser memory export; JS-only games can leave
Wasm memory unsupported.

## PixiJS

PixiJS provides rendering, not a complete publishing package. Bundle your game
logic, renderer setup and asset manifests together. Confirm that texture/font
loading uses the built asset locations. Do not depend on a local dev-server URL
embedded in an asset manifest.

## Three.js

Include models, textures and any loaders/decoder assets your application uses.
For example, a project using compressed geometry or texture decoding must make
its decoder resources reachable with the expected paths and MIME/worker rules.
Check feature compatibility in the target browser; a successfully uploaded ZIP
does not prove that a required GPU capability exists.

## Babylon.js

Include the generated scene assets and optional decoder/worker resources used by
your chosen packages. Test the actual WebGL/WebGPU path and any fallback your
application provides. The telemetry rAF number is browser cadence, not a Babylon
engine GPU timing query.

## Profiling these games

Use the same [authorized iframe integration](../telemetry/player-integration.md).
Do not patch a framework's renderer or replace its render loop just to measure
frame cadence. Memory/function data is feature-detected; absent Wasm memory is
normal for JS-only games. CSP, cross-origin assets and worker/isolation rules must
be verified for the exported game, not assumed from the framework's name.
