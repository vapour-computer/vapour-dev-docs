# Tutorial: Summit Run, a Godot driving game on desktop and phones

<span class="badge badge-preview">Preview tools</span> <span class="badge">Godot 4.7.2</span> <span class="badge">About 25 minutes</span>

**Summit Run - Ladakh** is a short 3D off-road game: a 600 m climb to Khardung La in nine gates. It was built in Godot,
exported for the browser, tuned to load quickly, given on-screen touch controls, and published with the `vapour` CLI.
This page shows how each of those steps was done, what the numbers were, and what went wrong.

**Source:** [`vapour-computer/ladakh-hills`](https://github.com/vapour-computer/ladakh-hills).
**Play it:** [the hosted release](https://vapour-web-637456171586.asia-south1.run.app/games/ladakh-hills).

## What is verified, and what is not

| Step | State |
| --- | --- |
| Four Web export presets build with Godot 4.7.2 | **Verified** locally |
| `vapour publish` of the `Web` build (v0.3.0) | **Verified**: the hosted player loads it |
| `vapour test` capture on desktop: 59.85 FPS average, 47.59 FPS 1% low, 6.73 s cold ready | **Verified**, one machine (Intel RPL-P through ANGLE, 1280×720). Not a guarantee for other hardware |
| Touch logic (joystick, second-finger taps, release on focus loss) | **Verified** by `tests/touch_controls_test.gd`, which sends synthetic touch events |
| Touch controls on a physical phone | **Not verified.** We did not record a phone run |
| A custom, speed-optimised Godot engine template | **Not used.** The build uses the stock 4.7.2 web template (`index.wasm` is 39.5 MB). See [Make your web build fast](fast-web-builds.md) for that route |
| `vapour build` | **Verified** with the CLI built from the `feat/engine-build` branch: it produced the same `index.wasm` and `index.pck` sizes as our manual export. It is not on the CLI `main` branch yet |
| `vapour publish --dry-run` | **Verified** with the same CLI: it listed the build, screenshots, video and release notes, and uploaded nothing |

## 1. Describe the game in `vapour.toml`

```toml
[project]
id = 'game_e584ce2192584d949f68cfcd0ef29ae1'
title = 'Summit Run - Ladakh'
slug = 'ladakh-hills'
engine = 'godot'
version = '0.3.0'

[build]
dir = 'build/web'

[store]
page = 'store/page.json'
content = 'store/template.md'
notes = 'store/notes.md'

[controller]
```

`[build].dir` is the folder the Godot export writes to. `[controller]` is empty on purpose: the game draws its own touch
controls (step 5), so the player does not add a second set. See the [`vapour.toml` reference](../games/manifest.md).

## 2. Build and publish with the CLI

`vapour.toml` has no `build.command`, so `vapour build` uses its default, `auto`, and runs Godot for you. It needs Godot 4 on
your `PATH` (or in `GODOT`), matching export templates, and a preset named `Web` on the Web platform:

```sh
vapour build
vapour publish --dry-run
vapour publish
```

`vapour build` does two things, which you can also run by hand:

```sh
godot --headless --path . --import
godot --headless --path . --export-release "Web" build/web/index.html
```

It then checks that `index.html` exists and writes `.vapour/build.json`, a list of files and sizes with the ones the player
must fetch before the game starts (`index.html`, every `.js` and `.wasm`, and the `.pck`). Do not commit `.vapour/`.
This command is in the [preview CLI](../status.md), not in a release yet.

`vapour publish --dry-run` packs the folder and the store page, and reports problems without uploading. Publishing sends each version once, so
bump `version` in `vapour.toml` first.

Four export presets live in `export_presets.cfg`. They differ only in `custom_features` and output folder:

| Preset | `custom_features` | Output | Use |
| --- | --- | --- | --- |
| `Web` | none | `build/web` | The published build. Detects touch devices itself |
| `Web Profile` | `showcase_profile` | `build/profile` | Adds a deterministic input driver that plays the real game for profiling |
| `Web Capture` | `showcase_capture` | `build/capture` | Recording and screenshots |
| `Mobile Web` | `mobile_port` | `build/mobile` | Forces touch controls, for a standalone mobile build |

In code, `OS.has_feature("mobile_port")` is true only in the `Mobile Web` export. The test drivers are not in the published
`Web` build because its `exclude_filter` leaves them out.

## 3. Test locally with `vapour test`

```sh
vapour test
```

`vapour test` serves `build.dir` with the FPS overlay and, on Linux, attaches the profiler to the browser. See
[Profile your game locally](profile-locally.md). For repeatable numbers we exported `Web Profile`, which drives the actual
game and its panoramas:

```sh
mkdir -p build/profile
godot --headless --path . --export-release "Web Profile" build/profile/index.html
```

The traces are saved in `media/performance/` in the repository. The 95-second baseline covers the opening and several
checkpoint panoramas.

| Measure | Result |
| --- | --- |
| Average FPS | 59.85 |
| 1% low | 47.59 |
| Worst frame | 183 ms |
| Cold ready time (includes WebAssembly) | 6.73 s |
| `index.wasm` / `index.pck` | 39.5 MB / 3.7 MB |

Process-tree memory counts Chromium and its GPU process, and the native counters are not GPU timings.

## 4. How the build was optimised

The optimisations are in the **content** and the **export**, not in a custom engine. The `.pck` is 3.7 MB because of these:

1. **Bake the scenery.** Generating mountain vertices, convex rock shapes and terrain collision at startup was slow. A tool
   builds them once and saves them as compressed scenes:

   ```sh
   godot --headless --path . --script tools/bake_expedition.gd
   godot --headless --path . --script tools/benchmark_loading.gd
   ```

   The game loads `scenes/world/ladakh_baked.scn` and one shared `scenes/vehicle/expedition_suv.scn`. Rerun the bake after
   you change the route or scenery code, then benchmark startup.
2. **Batch what you draw.** Static rocks are merged into 32 m, distance-culled batches. Their individual collisions stay.
   Distant mountains are meshes with no collision and no shadows. Water is one opaque shader plus a small splash pool.
3. **Keep tools out of the export.** Each preset has an `exclude_filter` such as `media/*,store/*,tests/*,build/*,tools/record*`.
   Review videos, screenshots and test scenes never reach the player.
4. **Keep threads off.** The presets set `variant/thread_support=false`, so the build runs anywhere without
   cross-origin isolation. Turning threads on is the biggest speed-up for a heavy game, but it needs those headers (see
   [Make your web build fast](fast-web-builds.md)).
5. **Cheaper defaults on phones.** Mobile starts at 85% render scale with anti-aliasing off unless the quality is **High**,
   and keeps its own settings file (`user://mobile_graphics.cfg`) so a phone never reads desktop preferences.

### A bug that profiling found

On a second PC the opening 360° panorama seemed frozen. The panorama advanced inside `_physics_process`, and Godot caps
physics catch-up on slow frames. At about 0.48 FPS in a software-rendered capture, only six simulated seconds passed in
roughly 95 real seconds. The fix drives presentation from a monotonic clock in `_process`:

```gdscript
func advance_presentation(now_usec: int) -> void:
	var wall_delta: float = maxf(0.0,float(now_usec-presentation_last_usec)/1000000.0)
	presentation_last_usec = now_usec
	if not presentation_ready or not presentation_visible or settings_panel.visible: return
	if cinematic_active: update_checkpoint_panorama(wall_delta)
	elif expedition_complete: update_summit_orbit(wall_delta)
```

The game also waits for its first rendered frame before it sends `vapour:ready` to the player, and hidden tabs pause the
clock without a catch-up jump. A genuinely slow GPU still looks choppy; the fix only stops a ten-second shot from taking minutes.
The full write-up is `docs/panorama-rca.md` in the repository. The regression test `tests/panorama_clock_test.gd` simulates
ten seconds at 0.5 FPS.

## 5. How the mobile controls were added

The controls are one script, `scripts/touch_controls.gd`, a full-screen `Control` added over the HUD. Nothing about the
driving code changed: the controls press the same **input actions** the keyboard does.

### Turn it on

In `_ready()` the game decides whether it is on a touch device:

```gdscript
mobile_mode = OS.has_feature("mobile_port") or OS.has_feature("android") or OS.has_feature("ios")
if OS.has_feature("web"):
	mobile_mode = mobile_mode or bool(JavaScriptBridge.eval("matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0",true))
if mobile_mode: settings["render_scale"] = 0.85
```

When `mobile_mode` is true it adds the controls to the UI, enlarges HUD text, swaps the starting guide for touch wording,
and tells the player to **Tap SKIP** instead of "Press Enter". The same `Web` export therefore serves desktop and phones.

### Layout

`layout_buttons()` builds a dictionary of `Rect2` zones from the screen size. One `unit` (the shorter side divided by 720)
scales every size, so the layout holds on any phone:

| Control | Place | Does |
| --- | --- | --- |
| Joystick | Bottom left | Steer and accelerate; pull back to brake or reverse |
| `2WD` / `4WD` | Bottom right, upper | Toggles traction mode |
| `P` | Bottom right, lower | Toggles the latched handbrake |
| `RECOVER`, `VIEW` | Above the joystick | Return to the last gate; enjoy a parked lookout |
| `CAM`, `MENU` | Top right | Recenter the camera; open settings |
| `SKIP` / `RESTART` | Bottom right | Shown only during a panorama / at the summit |

`available_actions()` returns only the controls that make sense right now, so during a panorama the screen shows just
`SKIP` and `MENU`. In portrait the game asks you to rotate the phone.

### How the joystick works

Each finger has an index. The script remembers which finger owns the stick (`stick_finger`) and which owns each button
(`fingers`). That is what lets you steer with one thumb and tap `4WD` with another.

```gdscript
func update_stick(point: Vector2) -> void:
	stick_vector = ((point-zones["joystick"].get_center())/(82.0*unit)).limit_length(1.0)
	var strength: float = clampf((stick_vector.length()-0.12)/0.88,0,1)
	var drive: Vector2 = stick_vector.normalized()*strength
	var actions: Dictionary = {"accelerate":maxf(-drive.y,0),"brake":maxf(drive.y,0),"steer_left":maxf(-drive.x,0),"steer_right":maxf(drive.x,0)}
	for action in actions:
		if float(actions[action])>0.001: Input.action_press(action,actions[action])
		else: Input.action_release(action)
```

1. The thumb's offset from the stick centre becomes a vector, capped at length 1.
2. A **dead zone** of 12% ignores tiny movements, and the rest is rescaled to 0 to 1.
3. Up is `accelerate`, down is `brake`, left and right are `steer_left` and `steer_right`, each with an **analog strength**.
   The game already read `Input.get_axis("brake","accelerate")`, so partial pushes give partial throttle.
4. Lifting the finger calls `release_stick()`, which releases all four actions.

### Making touches safe

- `_input()` handles `InputEventScreenTouch` and `InputEventScreenDrag`. A touch inside a zone is claimed and marked handled.
  A touch **outside every zone is left alone**, and the game uses it to orbit the camera (`InputEventScreenDrag` changes the
  camera yaw and pitch).
- Buttons that toggle (`4WD`, handbrake) act once on press. Hold-style actions press an input action and release it on lift.
- The controls release everything when settings open, a panorama starts, the run ends, the app loses focus, or the node
  leaves the tree. This stops a car that keeps driving because a finger lifted while the phone was busy.
- Mouse look and pointer-lock capture are skipped in mobile mode, so a touch is never read twice.

### Test it without a phone

`tests/touch_controls_test.gd` creates the controls and feeds them synthetic events:

```sh
godot --headless --path . --script tests/touch_controls_test.gd
```

It checks that `SKIP` dismisses the opening, that the joystick steers and accelerates at once and really moves the car,
that tapping `4WD` with a second finger does not cancel the stick, that pulling back brakes, and that releasing the stick
releases every action. This is the logic check. Try the real thing on a phone before you tell players it works.

## 6. Check the published build

After `vapour publish`, open the hosted link on a phone and a desktop browser. For v0.3.0 we also loaded the hosted runtime
in a browser, saw the opening camera move and return to the driving view, and saw no browser errors. The summary is saved as
`media/performance/panorama-fixed.json`.

## What you learned

- `vapour.toml` plus `vapour build` (or the two Godot commands it runs) is the whole build. `vapour publish --dry-run` before every publish.
- Bake expensive setup work, batch static geometry and exclude tools from export before you reach for a custom engine build.
- Drive cinematics from a real-time clock, not from capped physics time.
- Touch controls that press your existing input actions leave game code alone. Track each finger by index, release on every
  state change, and let unclaimed touches fall through to the camera.
- Test the logic with synthetic events, then test the feel on a real phone.
