# Tutorial: Ladakh Hills, a Godot driving game on desktop and phones

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

The controls are one script, `scripts/touch_controls.gd` (158 lines), a full-screen `Control` added over the HUD. Nothing
about the driving code changed: the controls press the same **input actions** the keyboard does (`accelerate`, `brake`,
`steer_left`, `steer_right`), and call the same functions the keys call (`toggle_handbrake()`, `recover_to_checkpoint()`).
That is why one `Web` export serves both desktop and phones.

### The design in one picture

```text
 touch event (InputEventScreenTouch / ScreenDrag)
        │
        ▼
 touch_controls._input()  ── touch lands in a button or the joystick? ──▶ claim it, set_input_as_handled()
        │ no
        ▼
 expedition_game._unhandled_input()  ──▶ drag orbits the camera
```

Because `_input()` runs before `_unhandled_input()`, a finger that lands on a control never reaches the camera, and a finger
that lands anywhere else always does. Nothing has to arbitrate between the two.

### Turn it on

In `_ready()` the game decides whether it is on a touch device:

```gdscript
mobile_mode = OS.has_feature("mobile_port") or OS.has_feature("android") or OS.has_feature("ios")
if OS.has_feature("web"):
	mobile_mode = mobile_mode or bool(JavaScriptBridge.eval("matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0",true))
if mobile_mode: settings["render_scale"] = 0.85
```

`(pointer: coarse)` is the browser's way of saying the main input is a finger, and `maxTouchPoints > 0` rules out a
touch-less machine that merely reports a coarse pointer. A laptop with a touchscreen also has a fine pointer (the trackpad),
so it stays in desktop mode. The `Mobile Web` preset sets the `mobile_port` feature, which forces the mode on for a
standalone build.

When `mobile_mode` is true, the game also:

- creates the controls and adds them to the UI (`TouchControls.new()`, `touch_controls.game = self`);
- widens the HUD and shifts the start card and radio captions so the controls do not cover them;
- replaces the start guide with touch wording ("Joystick: drive and steer", "Pull back: brake / reverse", ...);
- changes "Press Enter" prompts to **Tap SKIP**;
- plays a different radio line (`welcome_mobile`) that talks about the joystick, not the keys;
- skips mouse look and pointer-lock capture, so a touch is never also read as a mouse event;
- changes the lookout hint to "LOOKOUT · P to park · VIEW to enjoy".

The web page itself helps: `index.html` sets `user-scalable=no` in its viewport tag and `touch-action: none` on the canvas,
so the browser does not zoom or scroll when a thumb drags.

### Conditional input handling: one game, two kinds of input

The game never has two copies of its driving logic. It has **one set of input actions** and a few `if` checks that decide
which device may drive them. Here is the whole map.

**1. Keys and touch feed the same actions.** In `_ready()` the game registers every action and its keys with the `InputMap`
from one dictionary, so no `project.godot` editing is needed:

```gdscript
const DRIVE_KEYS: Dictionary = {"accelerate":[KEY_W,KEY_UP],"brake":[KEY_S,KEY_DOWN],"steer_left":[KEY_A,KEY_LEFT],"steer_right":[KEY_D,KEY_RIGHT],"handbrake":[KEY_SPACE],"toggle_drive":[KEY_L],"recenter":[KEY_V],"enjoy_view":[KEY_E] ...}
for action in DRIVE_KEYS:
	if not InputMap.has_action(action): InputMap.add_action(action)
	for key in DRIVE_KEYS[action]:
		var event := InputEventKey.new()
		event.physical_keycode = key
		if not InputMap.action_has_event(action,event): InputMap.action_add_event(action,event)
```

`physical_keycode` means the keys are positions, not letters, so WASD works on a French or Dvorak keyboard. The touch script
then calls `Input.action_press("accelerate", 0.6)`. The physics code only ever asks
`Input.get_axis("brake","accelerate")`, so it cannot tell a finger from a key. A key press is a strength of 1.0 and a stick push
is anything from 0 to 1.

**2. Only the pointer that matches the device may move the camera.** `_unhandled_input()` has two branches that must never both run:

```gdscript
if event is InputEventMouseMotion and not mobile_mode:
	if event.relative.length_squared()>1.0: camera_follow = false
	camera_yaw -= event.relative.x*0.003
	camera_pitch = clampf(camera_pitch+event.relative.y*0.002,0.08,0.85)
if mobile_mode and event is InputEventScreenDrag:
	camera_follow = false
	camera_yaw -= event.relative.x*0.003
	camera_pitch = clampf(camera_pitch+event.relative.y*0.002,0.08,0.85)
```

Browsers (and Godot's *Emulate Mouse From Touch* option) can turn a finger drag into mouse motion. Without `not mobile_mode`
the same drag would turn the camera twice as far. The desktop branch also ignores jitter: it only stops the following camera
when the mouse moves more than one pixel in a frame (`length_squared() > 1.0`).

**3. Pointer capture is a desktop-only idea.**

```gdscript
if OS.has_feature("web") and not mobile_mode and event is InputEventMouseButton and event.pressed and event.button_index==MOUSE_BUTTON_LEFT:
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
```

On the web a browser only grants pointer lock after a user click, so the game captures the mouse on the first left click, not at
startup. A phone has no pointer to lock, so mobile skips this, and `toggle_settings_panel()` keeps the mouse mode visible there:

```gdscript
Input.mouse_mode = Input.MOUSE_MODE_VISIBLE if mobile_mode or settings_panel.visible or expedition_complete else Input.MOUSE_MODE_CAPTURED
```

Mouse wheel zoom (`camera_dist` between 6.5 and 18) is also a desktop-only input: there is no touch version.

**4. Game state gates every device, in the same order.** Both handlers check the state first, so a keyboard and a finger obey
the same rules:

| Order | Check | Effect |
| --- | --- | --- |
| 1 | `ui_cancel` (Esc) | Opens or closes settings, even during a panorama |
| 2 | `settings_panel.visible or expedition_complete` | Return: no driving or camera input while a panel is open or after the summit |
| 3 | `cinematic_active` | Only skipping is allowed: `Enter` on a keyboard, `SKIP` on touch. Both call `finish_checkpoint_panorama()` |
| 4 | Everything else | Camera, `recenter`, `enjoy_view`, driving |

Esc has no phone equivalent, so `MENU` calls `toggle_settings_panel()` directly. The touch script applies the same gates: it
returns from `_input()` while settings are open, and `available_actions()` shrinks the buttons for panoramas and the summit.

**5. Conditions on the action itself, not on the device.** Some rules belong to the action, so every device gets them:

- `enjoy_view` only works if `near_lookout()` is true, the handbrake is on, and speed is below 0.5 m/s. The `VIEW` button sends
  the same action, so it is silently ignored away from a lookout, exactly as `E` is.
- `recover_vehicle` checks `recovery_cooldown <= 0.0` in both the `R` key path and the `RECOVER` button path.
- `toggle_drive` and `handbrake` flip a stored state (`four_wheel_drive`, `handbrake_engaged`) rather than reading whether the
  key is held. The touch buttons call the same toggle, and the HUD and the button label read the same variable.
- `run_started` flips when `abs(throttle_input) > 0.05`, which means a resting thumb inside the dead zone does not start the clock.

**6. Text follows the device.** Whenever words name a control, the game picks them with `mobile_mode`:

| Where | Desktop | Phone |
| --- | --- | --- |
| Start guide | `WASD / arrows   Drive`, `L   2WD / 4WD` | `Joystick: drive and steer`, `Tap 2WD / 4WD for traction` |
| Panorama prompt | `Enter to start driving` | `Tap SKIP to start driving` |
| Radio welcome | `welcome` | `welcome_mobile` |
| Lookout hint | key-based | `LOOKOUT · P to park · VIEW to enjoy` |
| Summit postcard button | `Drive again  ·  Enter` | `Drive again` |
| Settings file | `user://graphics.cfg` | `user://mobile_graphics.cfg` |

**Rules to copy into your own game**

1. Define actions once; let keys, gamepad and touch all press them. Do not read `InputEventKey` in gameplay code.
2. Branch on the *device* only where the event type differs (mouse motion, screen drag, pointer lock).
3. Branch on the *game state* before the device, so every input obeys the same pause, menu and cutscene rules.
4. Put validity checks (cooldowns, "near a lookout") in the action's handler, not in the button.
5. Detect touch once, store it in a variable (`mobile_mode`) and use that variable everywhere, including your instruction text.
6. Test both paths. The touch test sends synthetic touches; for the desktop branch, run `vapour test` in a browser.

### Layout

`layout_buttons()` runs on startup and again whenever the control resizes (`resized.connect(layout_buttons)`), so rotating a
phone relays everything out. It builds a dictionary of `Rect2` hit zones from the screen size. One `unit` (the shorter side
divided by 720) scales every size, so the layout holds on any phone:

```gdscript
unit = maxf(1.0,minf(size.x,size.y)/720.0)
var b: float = 108.0*unit       # button size
var gap: float = 18.0*unit
var margin: float = 26.0*unit   # distance from the screen edge
```

| Control | Zone (all multiplied by `unit`) | Does |
| --- | --- | --- |
| Joystick | 216 × 216 at the bottom-left corner | Steer and accelerate; pull back to brake or reverse |
| `2WD` / `4WD` | 108 × 108, bottom-right, upper | Toggles traction mode. The label shows the current mode |
| `P` | 108 × 108, bottom-right, lower | Toggles the latched handbrake. The label reads `P ON` when engaged |
| `RECOVER`, `VIEW` | 108 × 108 each, above the joystick | Return to the last gate; enjoy a parked lookout |
| `CAM`, `MENU` | 108 × 76, top-right | Recenter the camera; open settings |
| `SKIP` | 180 × 86, bottom-right | Shown only while a panorama plays |

The steering and pedals go on the left thumb and the mode switches on the right, so your right thumb is free to drag the
view. Buttons are reachable at the edges where a phone is held.

`available_actions()` returns only the controls that make sense right now. This one function drives both what is **drawn**
and what can be **touched**, so a hidden button can never be tapped by accident:

| Game state | Controls on screen |
| --- | --- |
| Driving | joystick, `2WD`/`4WD`, `P`, `RECOVER`, `VIEW`, `CAM`, `MENU` |
| Panorama playing | `SKIP`, `MENU` |
| Summit reached | `MENU` (the summit postcard has its own **Drive again** button) |
| Settings open | none: the controls hide and release everything |

In portrait (`size.y > size.x`) the game draws "Rotate your phone for the wider valley view" over the screen. A test checks
that every zone fits inside both a 1280×720 and a 720×1280 screen.

### How the joystick works

Each finger has an **index**, a number the engine gives that touch and keeps until the finger lifts. The script remembers which
finger owns the stick (`stick_finger`) and which finger owns each button (the `fingers` dictionary, index to action). That is
what lets you steer with one thumb and tap `4WD` with another.

**Pressing.** `_input()` checks each available zone. A touch that lands in the joystick's rectangle calls
`activate(index, "joystick", position)`. If no finger owns the stick yet, that finger becomes `stick_finger`. A second finger
landing on the stick is ignored.

**Dragging.** While the owner moves, every `InputEventScreenDrag` with the same index calls `update_stick()`:

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

1. **Offset.** The thumb's distance from the stick centre is divided by 82 px (at `unit` 1), then capped at length 1. Pulling
   further than 82 px gives full deflection, and the thumb can wander outside the circle without the stick breaking.
2. **Dead zone.** A length under 0.12 counts as zero, and the rest is rescaled to 0 to 1. A resting thumb does not creep the car.
3. **Four actions at once.** Up is `accelerate`, down is `brake`, left and right are `steer_left` and `steer_right`. Pushing
   up-left presses two actions together, each with its own **analog strength** (the second argument of
   `Input.action_press`). The game already read `Input.get_axis("brake","accelerate")`, so a half push gives half throttle.
4. **Release a single action** when its value drops to zero, so sliding from left to right switches steering cleanly.
5. **Lift.** The touch-up event with the stick's index calls `release_stick()`, which clears `stick_finger`, centres the knob
   and releases all four actions.

The knob is drawn 78 px from the centre at full deflection, inside a 108 px ring, and turns amber while a finger holds it.
The word `DRIVE` sits under the ring.

### How the buttons work

Buttons fall into three kinds, handled in `activate()`:

| Kind | Buttons | Behaviour |
| --- | --- | --- |
| **Toggle** | `2WD`/`4WD`, `P` | Acts once on touch-down, then waits for the next tap. The finger is remembered so the button stays lit until it lifts |
| **One-shot** | `CAM`, `VIEW`, `MENU`, `SKIP`, `RECOVER` | Calls the same function the key calls, once per tap |
| **Hold** | the joystick actions | Presses an input action and releases it on lift |

Details that were worth getting right:

- `CAM` and `VIEW` do not call new code. They build an `InputEventAction` for `recenter` or `enjoy_view` and pass it to
  the game's `_unhandled_input()`, exactly what the `V` and `E` keys would do.
- `RECOVER` respects the game's one-second `recovery_cooldown`, so tapping it repeatedly cannot teleport the car in a loop.
- `MENU` calls `release_all()` before it opens the settings, so a car does not keep driving behind the panel.
- A button is drawn in the pressed colour when its finger is down, **or** when the state it controls is on. That is why `P`
  and `4WD` stay amber after the finger leaves.
- The `P` handbrake is latched by the touch-down event. The test sends press and release within one frame and still expects
  the brake to engage, which is what a fast tap does on a phone.

### Making touches safe

A touch controller fails in the same few ways, usually "the car keeps driving". Each rule below prevents one:

- **Claim and pass on.** A touch inside a zone is claimed with `set_input_as_handled()`. A touch **outside every zone is left
  alone**, and the game uses its `InputEventScreenDrag` to change the camera yaw and pitch (`yaw -= relative.x * 0.003`, pitch
  clamped between 0.08 and 0.85 rad). Dragging also turns off `camera_follow`, which is why `CAM` exists.
- **Drags stay with their owner.** A drag whose index belongs to the stick or a button is consumed, so a thumb that slides off
  the joystick does not suddenly start spinning the camera.
- **Release on state changes.** `_process()` calls `release_all()` when settings are open, a panorama starts, or the run ends.
- **Release on lost focus.** `NOTIFICATION_APPLICATION_FOCUS_OUT` calls `release_all()`, which covers a notification pulling
  down, an app switch or a call, where the browser never delivers the touch-up.
- **Release on exit.** `_exit_tree()` also calls `release_all()`, so freeing the node (or restarting) cannot leave a pedal pressed.
- **Reference counting.** `release_finger()` only releases an input action if no *other* finger still holds the same action.
- **Hide when closed.** `visible = not game.settings_panel.visible`, and `_input()` returns early while settings are open, so
  the menu receives its own touches.

### Tuning knobs

If the feel is wrong on your own game, these are the numbers to change, all in `touch_controls.gd`:

| Number | Now | Effect |
| --- | --- | --- |
| `82.0 * unit` in `update_stick` | 82 px | Smaller = a short throw reaches full power |
| `0.12` dead zone | 12% | Larger = steadier at rest, less fine control |
| `b = 108.0 * unit` | 108 px | Button size. Keep it above about 9 mm on a phone (roughly 44 px CSS) |
| `0.003` / `0.002` in `expedition_game.gd` | rad per px | Camera drag sensitivity for yaw and pitch |
| `settings["render_scale"]` | 0.85 | Phones draw at 85% resolution to hold frame rate |

### Test it without a phone

`tests/touch_controls_test.gd` loads the real `main.tscn`, adds the controls and feeds them synthetic `InputEventScreenTouch`
events with chosen finger indexes:

```sh
godot --headless --path . --script tests/touch_controls_test.gd
```

It checks that:

1. `SKIP` dismisses the opening panorama.
2. The joystick steers and accelerates at once, and the car really moves (velocity above 0.3 m/s).
3. Tapping `4WD` with a **second finger** engages 4WD and does not cancel the stick.
4. Pulling back brakes and does not accelerate.
5. Releasing the stick releases every driving action.
6. A press and release inside one frame still latches the handbrake.
7. Opening the menu releases held pedals.
8. Dragging scenery orbits the camera, and `CAM` restores following.
9. Every button fits on screen in landscape and portrait.

The output ends with `Mobile multitouch tests: 0 failures`, and the process exits 1 if any check fails, so it works in CI.
This is the logic check. It cannot tell you whether the buttons feel too small or too close to your thumb, which is why this
tutorial marks phone controls as **not verified** until someone records a run on a real device.

### A phone checklist

Before you tell players it works, try these on one or two real phones:

1. Load the hosted link in landscape. The buttons should not overlap the HUD or the radio caption.
2. Steer with one thumb while you tap `4WD` and `P` with the other.
3. Drag the scenery to look around, then tap `CAM`.
4. Pull down the notification shade mid-drive, then return. The car should not keep accelerating.
5. Open `MENU`, change a setting and close it.
6. Rotate to portrait and back.

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
