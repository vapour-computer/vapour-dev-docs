# Large-game delivery plan

**Status: planned.** Current publishing and limits remain documented in
[web exports](web-export.md) and [limits](../reference/limits.md).
There is no 42 MB code limit. A 32 MiB Cloud Run HTTP/1 ingress cap is separate
from the API's larger ZIP router limit and the store request budget.

The target is 50 GiB/game and 4 GiB/file: content-defined ~4 MiB SHA-256 chunks,
selective zstd, manifests with paths/sizes/ordered hashes/boot flags, signed
resumable direct-to-bucket uploads, and finalize that verifies object sizes and
stores an immutable manifest before switching play_version. Background re-hashing
follows. The API handles bounded JSON; per-game chunk namespaces prevent cross-game
existence probes. Physical storage and per-game egress need separate policies.

A worker on a dedicated game origin will serve Range requests from verified CDN
chunks, cache in OPFS, prefetch boot files and lazily fetch the rest. OPFS quota
and iOS eviction require a network-only fallback. Preserve the sandbox. WASM32's
roughly 4 GiB address space remains; >1 GiB files warrant split-pack warnings.

## Engine-build source preview

[CLI PR 1](https://github.com/vapour-computer/vapour-cli/pull/1) adds local adapters:

- Godot 4: installed editor plus matching Web templates and a Web preset;
  import then release export; HTML/JS/WASM/main PCK boot set. Split optional PCKs.
- Unity: installed WebGL editor and Vapour/Build script supplied by create;
  batch build and Addressables check. Move optional content into remote bundles.
  Developer handles licensing. Startup data and decompression fallback are boot.
- Bevy: installed WASM Rust target, matching wasm-bindgen and optional wasm-opt;
  generate HTML and copy assets/ as lazy content. Load assets on demand.

Planned release configuration (not a command for the current released CLI):

```text
[build]
command = "auto" # auto/custom/none; custom also supplies executable args
dir = "build/web"
boot = ["index.html", "*.js", "*.wasm"]
split_warn_mib = 1024
```

Tools/templates are checked, never installed. CI uses the same build command.
Boot globs replace defaults and do not recursively match directories. Local
fixture adapter tests do not prove actual Unity/Bevy exports or hosted play.
Rollout remains direct uploads → game origins/CDN → manifests/quotas → worker/
OPFS/boot → deltas/quota prompts. Small-build ZIP fallback remains available.
