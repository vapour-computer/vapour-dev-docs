# Tutorial: Bevy, from a Rust template to a web build

<span class="badge badge-preview">Preview tools</span> <span class="badge">Bevy 0.20</span> <span class="badge">Rust 2024</span> <span class="badge">About 25 minutes</span>

You will take a Bevy game template, build it for the browser with **Trunk**, describe the build in `vapour.toml`, add an
on-screen stick for phones, run it locally with the FPS overlay and profiler, and set up CI.

**Sample repository:** [`vapour-computer/tutorial-bevy-template`](https://github.com/vapour-computer/tutorial-bevy-template),
branch `vapour-tutorial`. It is a fork of [`NiklasEi/bevy_game_template`](https://github.com/NiklasEi/bevy_game_template) (CC0).

## What is verified, and what is not

| Step | State |
| --- | --- |
| The web bundle builds | **Verified** on GitHub Actions: the `vapour-check` workflow passes. The bundle is 35 MB |
| `vapour controller check` accepts the layout | **Verified** |
| `vapour test` serves that bundle with the FPS overlay | **Verified.** We downloaded the exact bundle CI built and ran it (screenshot below) |
| `vapour publish --dry-run` packs it | **Verified**: 9.5 MiB |
| The profiler, and `vapour build` on this project | **Not run.** We could not install Trunk locally (see [the Trunk trap](#a-trap-we-hit-installing-trunk)), and `vapour build` calls it |
| The stick working on a real phone | **Not verified.** Preview feature, not tested on a device |
| Publishing to Vapour | **Not run.** Needs your token and a released `vapour-ci` |

## 1. Get the project and the tools

```sh
git clone https://github.com/vapour-computer/tutorial-bevy-template.git
cd tutorial-bevy-template
git checkout vapour-tutorial
```

You need a recent stable **Rust**, the WebAssembly target, and **Trunk**:

```sh
rustup target add wasm32-unknown-unknown
cargo install --locked trunk
```

### A trap we hit installing Trunk

On our machine (a current Arch Linux with GCC 16) `cargo install trunk` failed. The build of a C dependency,
`libdeflate-sys`, stopped with AVX-512 errors, and switching the compiler to `clang` did not help. If this happens to you,
install a prebuilt Trunk instead (your package manager, or the project's release binaries). GitHub's Ubuntu runners
compile it without trouble, which is why the CI build below works.

## 2. Look at how the template builds

The template already knows how to build for the web: `Trunk.toml` sets the public URL to `./`, and `index.html` has
Trunk directives that copy the `assets` and `credits` folders and **inline two files from `build/web/`**:

```html
<link data-trunk rel="copy-dir" href="assets"/>
<link data-trunk rel="inline" href="build/web/styles.css"/>
...
<link data-trunk rel="inline" href="build/web/sound.js"/>
```

That detail decides everything that follows. In this template, **`build/web/` is a source folder** (it holds `styles.css` and
`sound.js`), and Trunk's default output is `dist/`. The template's own CI runs `trunk build --release` and uploads `dist/`.

> **A trap we hit:** the generic `vapour-ci` Bevy workflow builds with `--dist build/web`, and a first guess for
> `build.dir` is also `build/web`. Here that would write build output into the folder that holds your source files. Use
> `dist/`.

## 3. Describe the build in `vapour.toml`

```toml
[project]
title = "Bevy Game Template"
slug = "tutorial-bevy-template"
engine = "bevy"
platform = "desktop"
version = "0.1.0"

[build]
command = "custom"
args = ["trunk", "build", "--release", "--public-url", "./", "--dist", "dist"]
dir = "dist"
```

- **`engine = "bevy"`** tells Vapour how to treat the files. For example, nothing under `assets/` is marked as needed at boot.
- **`command = "custom"`** runs exactly the program in `args`. Bevy's automatic exporter exists, but this template is built with
  Trunk, so we say so. The first item of `args` is the program, the rest are its arguments.
- **`dir = "dist"`** is where Trunk puts the bundle. `vapour build` then checks that `dist/index.html` exists.

Run it:

```sh
vapour build
```

`vapour build` runs the Trunk command, checks `dist/index.html`, and writes `.vapour/build.json`: every file, its size, and
whether it is needed at boot. Add both folders to `.gitignore`:

```text
dist/
.vapour/
```

Every `vapour.toml` entry is explained in the [reference](../games/manifest.md).

## 4. Touch controls

Open `src/gameplay/actions/mod.rs`. The template handles input in two ways:

```rust
let mut player_movement = Vec2::new(
    get_movement(GameControl::Right, &keyboard_input)
        - get_movement(GameControl::Left, &keyboard_input),
    get_movement(GameControl::Up, &keyboard_input)
        - get_movement(GameControl::Down, &keyboard_input),
);

if let Some(touch_position) = touch_input.first_pressed_position()
    && let Ok((camera, camera_transform)) = camera.single()
    && let Ok(touch_position) = camera.viewport_to_world_2d(camera_transform, touch_position)
{
    // tap-to-follow: the player walks towards the finger
    ...
}
```

Keyboard: **W A S D** and the arrow keys (`game_control.rs`). Touch: tap anywhere and the player walks to your finger.

So this game already works on a phone, in a way. Why add controls? A tap-to-follow game feels different from a stick: the
player cannot hold a direction while looking at where they are going. We added one stick that presses the keys the game
already reads, with **no change to the Rust code**:

```toml
[controller]
mode = "keyboard-map"

[[controller.controls]]
id = "move"
type = "joystick"
x = 0.22          # centre of the stick, as a fraction of the screen; y grows downward
y = 0.74
w = 0.30
h = 0.30
up = "w"
down = "s"
left = "a"
right = "d"
deadzone = 0.15   # ignore tiny movements near the centre
sensitivity = 1.0
repeat_hz = 60    # how often a held direction is re-sent
```

```text
$ vapour controller check
Controller mode: keyboard-map
  move         joystick at (0.22, 0.74) size (0.30, 0.30)
    joystick tuning: deadzone=0.15 sensitivity=1.00 repeat_hz=60
Controller config looks good.
Tip: run `vapour controller preview` to see the layout.
```

> **Something to check on a real phone.** Look at the code above: when a touch exists, tap-to-follow **replaces** the
> keyboard movement. If touching the on-screen stick also counts as a touch inside the game, the two inputs would fight. We
> could not test this. If you see it, the simplest fix is a small change in `set_movement_actions` to skip the touch branch
> while the keyboard direction is non-zero.

## 5. Run it locally

```sh
vapour test
```

You get your build in a Chromium window with an FPS overlay, and the profiler in a second tab. See
[Profile your game locally](profile-locally.md) for what each shows. Bevy's wasm build is a single large `.wasm` plus
your assets, so watch **memory** in the profiler as well as FPS.

![The Bevy game template's menu in a browser with the Vapour FPS overlay in the top-left corner](../assets/img/bevy-game-overlay.png)

*The bundle GitHub Actions built, served by `vapour test` and captured in headless Chromium. The FPS is low (12) because
headless Chromium renders in software; on real hardware it will be far higher.*

## 6. CI

Two workflows live in `.github/workflows/`:

- **`vapour-check.yml`** runs on every push and pull request. It installs the WebAssembly target and Trunk, runs
  `trunk build --release --public-url ./ --dist dist`, checks that `dist/index.html` exists, and keeps the `dist/` folder as a
  downloadable artifact for 7 days.
- **`vapour-publish.yml`** runs when you push a tag such as `v0.1.0` and publishes with `vapour-computer/vapour-ci@v1`.

```yaml
- uses: dtolnay/rust-toolchain@stable
  with: { targets: wasm32-unknown-unknown }
- uses: Swatinem/rust-cache@v2
- name: Install trunk
  run: cargo install trunk --locked
- name: Build for web
  run: trunk build --release --public-url ./ --dist dist
```

> **A trap we hit:** `vapour-ci@v1` is not released yet, and GitHub resolves every action in a job *before* running any
> step, so one unresolved action fails the whole job even behind an `if`. That is why publishing is its own tag-only
> workflow. (Details in the [Godot tutorial](godot.md).)

> **A speed tip:** `cargo install trunk` compiles Trunk from source on every run, which takes minutes. The template's own
> workflow uses the prebuilt `jetli/trunk-action`, which is much faster.

## 7. Check the size

```text
$ vapour publish --dry-run --skip-store
Packed dist (9.5 MiB) as version 0.1.0
Dry run: nothing uploaded.
```

The bundle is 35 MB on disk (almost all of it the 34 MB `.wasm`) and packs to **9.5 MiB**, far inside the 512 MiB limit.
That is what a small Bevy game looks like; a game with large assets will be much bigger.

To publish, add a `VAPOUR_TOKEN` repository secret ([create a token](../auth/tokens.md)) and push a tag.

## What you learned

- Check whether your template's `build/web` (or any output folder) holds **source files** before you point a build at it.
- `build.command = "custom"` plus `args` lets Vapour build any toolchain, as long as the result is a folder with `index.html`.
- A game that already reads the keyboard needs no code change for a stick: map the stick onto the keys.
- Never let a publish step that needs an unreleased action run on every push.

Next: the same flow for [Godot](godot.md) and [Unity](unity.md).
