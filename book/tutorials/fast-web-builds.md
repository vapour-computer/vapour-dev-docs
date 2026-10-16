# Tutorial: make your web build fast

<span class="badge badge-preview">Preview tools</span> <span class="badge">Godot 4.7.2</span> <span class="badge">Bevy 0.20</span> <span class="badge">Unity 6</span>

The tutorial builds are tuned to **export cleanly**, not to run fast. The Godot TPS demo stuttered in Chromium on a
laptop with an Intel UHD GPU **and** on a laptop with an RTX 5060. A strong GPU did not fix it, so the GPU was not the
problem. This page shows what was slowing it down and how to change the build, the export settings and the
WebAssembly for speed.

## What is verified, and what is not

| Step | State |
| --- | --- |
| The causes listed below, read from the TPS project, its export and the Vapour player | **Verified** by reading the code and the exported `index.html` |
| Each change below makes the game faster | **Not measured yet.** Measure before and after on your own hardware (step 1) |
| WebGPU in Godot web exports | **Not available.** Godot 4.7's web export renders only through WebGL2 |

## Why the TPS demo stutters

1. **It runs on one thread.** The exported `index.html` contains `GODOT_THREADS_ENABLED = false`. Rendering, physics,
   audio mixing, animation and GDScript all share the browser's main thread. That thread is the limit, so a faster GPU
   does not help.
2. **Its settings were made for desktop.** The project asks for HDR output, a 2D HDR buffer, debanding, bloom,
   FSR2 upscaling, a 2048 shadow atlas and anisotropic filtering. On the web it renders with the Compatibility
   renderer (WebGL2), which draws objects again for every light that touches them.
3. **The physics setting has no effect.** `physics/3d/physics_engine="Bullet"` is not a Godot 4 engine, so Godot quietly
   uses its default physics instead.
4. **The engine was built for size.** The stock web export templates are optimised for download size, not speed, and
   include every engine module.
5. **The files are big.** The `.pck` is 597 MB and the `.wasm` 40 MB. This mainly slows loading, but it also means more
   memory and early hitches.

## 1. Measure first

Run the game with `vapour test` on real hardware. It shows FPS, the 1% low and the worst frame time (see
[Profile your game locally](profile-locally.md)). Write the numbers down before you change anything.

Then check that the browser really uses your GPU:

- Open `chrome://gpu`. Under **Graphics Feature Status**, WebGL and WebGPU should say **Hardware accelerated**. If they
  say "Software only", every frame is drawn on the CPU.
- **On a laptop with two GPUs (for example NVIDIA Optimus)**, Windows may run the browser on the weaker built-in GPU.
  Open **Settings → System → Display → Graphics**, add the browser, choose **High performance**, and restart the browser.
  Keep the laptop plugged in.
- **On Linux**, Chromium may not enable WebGPU and Vulkan by default. To try them, add these lines to
  `~/.config/chromium-flags.conf` (or `chrome-flags.conf`) and restart:

  ```text
  --enable-features=Vulkan
  --enable-unsafe-webgpu
  ```

  Add `--ignore-gpu-blocklist` only if `chrome://gpu` still says your GPU is blocklisted.

Headless screenshots of the tutorials use software rendering (SwiftShader), so their FPS numbers mean nothing.

### Check your project

Run `vapour perf` to get a quick performance check from your current project files.

`vapour build`, `vapour test` and `vapour publish` also print perf warnings automatically. If you need clean logs,
use `--no-perf-hints`.

## 2. Godot: turn threads on

In **Project → Export… → Web**, switch **Thread Support** on. In `export_presets.cfg`:

```text
variant/thread_support=true
```

A threaded export needs cross-origin isolation. The Vapour player and `vapour test` already send the headers it needs
(`Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`). To check it worked, open
the game frame's console and run `crossOriginIsolated`. It should print `true`, and the exported `index.html` should
contain `GODOT_THREADS_ENABLED = true`.

## 3. Godot: web settings that cost less

Godot can use different project settings on each platform. Add `.web` overrides to `project.godot` so the desktop
build keeps its full quality:

```text
[display]
window/hdr/request_hdr_output.web=false

[physics]
3d/physics_engine="Jolt Physics"

[rendering]
viewport/hdr_2d.web=false
anti_aliasing/quality/use_debanding.web=false
textures/default_filters/anisotropic_filtering_level.web=1
scaling_3d/mode.web=0
scaling_3d/scale.web=0.75
lights_and_shadows/positional_shadow/atlas_size.web=1024
lights_and_shadows/directional_shadow/size.web=2048
```

- `scaling_3d/mode=0` is bilinear scaling. FSR2 and MetalFX do not work in the Compatibility renderer.
- `scaling_3d/scale=0.75` renders the 3D scene at 75% resolution and scales it up. On a HiDPI screen this is the
  biggest single saving for the GPU.
- Jolt has shipped with Godot since 4.4 and is faster than Godot's default 3D physics.

The TPS demo also turns quality options on in code (`menu/settings.gd`). Give the web its own defaults at the start
of `_ready()`, before `load_settings()` reads the saved settings:

```gdscript
func _ready() -> void:
	if OS.has_feature("web"):
		DEFAULTS.rendering.bloom = false
		DEFAULTS.rendering.msaa = Viewport.MSAA_DISABLED
		DEFAULTS.rendering.screen_space_aa = Viewport.SCREEN_SPACE_AA_FXAA
		DEFAULTS.rendering.volumetric_fog = false
		DEFAULTS.rendering.ssao_quality = -1
		DEFAULTS.video.scale_filter = Viewport.SCALING_3D_MODE_BILINEAR
		DEFAULTS.video.resolution_scale = 0.75
	load_settings()
```

These are defaults only. A player who has already saved settings keeps them.

In your own levels, few lights should cast shadows. Each shadowed light makes the Compatibility renderer draw the
scene again. Baked lighting (`LightmapGI`) works in Compatibility and costs almost nothing at run time.

## 4. Godot: build your own export template

The official web templates are optimised for size. You can build a template optimised for speed. The Godot
documentation, under *Compiling for the Web*, lists the Emscripten version that matches your engine version. Use that
version exactly.

```text
git clone --branch 4.7.2-stable --depth 1 https://github.com/godotengine/godot.git
cd godot
scons platform=web target=template_release production=yes optimize=speed lto=full threads=yes
```

- `optimize=speed` asks the compiler for speed. The web platform builds for size unless you say otherwise.
- `lto=full` lets the compiler optimise across the whole engine. Linking takes much longer.
- `production=yes` turns off debug features, and the Emscripten link step runs `wasm-opt` over the result.
- To make the `.wasm` smaller, add a `custom.py` that turns off modules your game does not use (for example
  `module_text_server_adv_enabled = "no"` with `module_text_server_fb_enabled = "yes"` if you need no complex text
  scripts). Godot's *Optimizing a build for size* page lists the options.
- Check your Godot version's build options for WebAssembly SIMD. If it is not on by default, adding
  `ccflags="-msimd128" linkflags="-msimd128"` enables it. All current desktop browsers support SIMD.

The output is a zip in `bin/`, for example `godot.web.template_release.wasm32.zip`. Point the preset at it:

```text
custom_template/release="res://../templates/godot.web.template_release.wasm32.zip"
```

Keep the editor and the template on the **same Godot version**. In CI, build the template once, store it as an
artifact or release asset, and download it before the export step.

## 5. Godot: make the files smaller

- Under **Import**, use **VRAM Compressed** for large textures. Turn on **VRAM Texture Compression → For Mobile** as well
  if phones will play the game.
- Use the export filter to leave out files the game never loads (videos, source art, test scenes).
- New publishes are Brotli-compressed on upload for `.wasm`, `.js`, `.pck`, `.data` and `.json`, and served with
  `Content-Encoding: br` (with identity fallback for clients that do not support Brotli).
- Games published before that deploy keep their old objects. Republish to get compressed assets.

## 6. Bevy: WebGPU and a faster `.wasm`

Bevy can render with WebGPU. One build uses **either** WebGPU **or** WebGL2, not both. To try WebGPU, add the feature
to Bevy in `Cargo.toml`:

```text
bevy = { version = "0.20.0", default-features = false, features = [ ..., "webgpu" ] }
```

A browser without WebGPU then cannot run the game. To support both, publish a WebGL2 build as well, or keep WebGL2
until your players' browsers support WebGPU.

The template's `release` profile uses `opt-level = "s"` (small). Its `dist` profile uses `opt-level = 3` (fast) with
`lto = true` and `codegen-units = 1`. To build with that profile and run `wasm-opt` for speed, add a Rust link to the
`<head>` of `index.html` (the template has none yet, so Trunk uses its defaults):

```text
<link data-trunk rel="rust" data-cargo-profile="dist" data-wasm-opt="3" />
```

## 7. Unity: WebGPU

Unity 6 can build for WebGPU, as an experimental option. In **Player Settings → Other Settings**, turn off **Auto
Graphics API** and put **WebGPU** above **WebGL 2** in the list. Unity then uses WebGPU where the browser has it and falls
back to WebGL2 where it does not. Under **Publishing Settings**, keep **Code Optimization** on **Runtime Speed** for
release builds.

## What you learned

- If a strong GPU does not fix the lag, look at the **main thread** first. Turn threads on.
- Settings made for desktop cost far more in the browser. Use `.web` overrides instead of lowering desktop quality.
- The stock Godot web template is built for size; your own template can be built for speed.
- WebGPU is available in Bevy and Unity, not in Godot's web export. Keep a WebGL2 fallback, because not every browser
  has WebGPU.
- Measure on real hardware, before and after. Software-rendered screenshots say nothing about speed.
