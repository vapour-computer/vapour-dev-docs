# Hard no's: what Vapour cannot run

These are limits of the browser, the engine's web export, or the current upload path.
Changing your game is the only fix for them. `vapour build`, `vapour test` and
`vapour publish` check for most of these and print a `Guardrail:` line with a code.

- **Block** stops the command. If you have a reason to continue anyway, list the code in
  `vapour.toml` and the block becomes a printed finding:

  ```toml
  [guardrails]
  allow = ["godot_csharp"]
  ```

- **Warn** and **info** are printed and the command continues.

A passing check is not proof the game works. It only means none of the known problems
below were found. Always finish with a hosted playthrough.

## Hard no's

| Do not ship | Why | Guardrail | What to do instead |
| --- | --- | --- | --- |
| Godot C# projects | Godot's web export does not support C#. | `godot_csharp` (block) | Port scripts to GDScript. |
| Godot Forward+ or Mobile renderer | Only the Compatibility renderer exports to web. | `godot_renderer` (warn) | Set `rendering/renderer/rendering_method.web="gl_compatibility"`. |
| Native executables and libraries (`.exe`, `.dll`, `.so`, `.dylib`, ...) | A browser cannot load them. | [.zip verification](zip-verification.md) (block) | Use the engine's web export; do not rename files. |
| Unity native plugins | Plugins under `Assets/Plugins/<platform>` are not part of WebGL builds. | `native_plugins` (warn) | Replace with managed code or a `.jslib`, and guard calls with `#if UNITY_WEBGL`. |
| Raw TCP, UDP or ENet sockets | Browsers cannot open them. | `raw_sockets` (warn) | Use WebSocket or WebRTC. You also need a server the browser can reach. |
| Any file over 512 MiB, or a build over 1 GiB expanded | Upload and extraction limits. | `file_too_large`, `build_too_large` (block) | Split packs and compress assets. `--experimental-chunks` lifts these. See [large-game delivery](large-games.md). |
| Electron apps, server-only Node apps, Wasm that needs non-browser imports | Not a web export. | none | Use a supported exporter. |
| Engines without a web exporter (for example Java) | No adapter or template. | `engine_other` (info) | Port to a supported engine, or an HTML5/Wasm exporter. |

## Not reliable today

These may work on your machine and fail on Vapour. Several are platform work that is
planned; treat them as "no" until the work lands.

| Avoid | Why | Guardrail |
| --- | --- | --- |
| Threaded builds (Unity threads, Godot threads, Bevy atomics) | The player page is not reliably cross-origin isolated, and Safari never is. | `threads` (warn) |
| `OpenURL`, `shell_open`, clipboard, downloads, WebXR | The player sandbox blocks them. | `external_apis` (warn) |
| Asset paths that start with a slash (root-absolute) | Games are served under `/play/{slug}/`. Use relative paths; for Trunk use `--public-url ./`. | `absolute_paths` (warn) |
| PWA service workers (Godot PWA, Unity PWA template) | They clash with other games on the shared origin. | `pwa_service_worker` (warn) |
| Unity Default WebGL template | Fixed 960×600 canvas. Use Minimal or a responsive template. | `unity_default_template` (warn) |
| Unity default compression without Decompression Fallback | Compressed files are served without `Content-Encoding` and fail to load. | none; see [Unity](unity.md) |
| Saving to `user://` (Godot) without a unique prefix | All games share one browser origin today, so save files can collide. | `user_saves` (info) |

## What the checks do not catch

The `raw_sockets` and `external_apis` checks scan source text, so they can flag code that
is never reached on web, and can miss code that builds its calls dynamically. They never
inspect compiled plugins. Treat them as a prompt to check, not a verdict.
