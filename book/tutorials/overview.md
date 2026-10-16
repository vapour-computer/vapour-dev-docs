# Tutorials

Step-by-step walkthroughs that take a **real sample project** all the way to a Vapour-ready web build. They are
separate from the [reference docs](../README.md): the docs tell you what every setting does, the tutorials show you
the order to do things in, what went wrong for us, and why.

Each tutorial uses a project we forked into the [`vapour-computer`](https://github.com/vapour-computer) organization, on a
branch called `vapour-tutorial`. The branch contains exactly the files we added, so you can compare it to upstream and
see the whole change.

<div class="tutorial-grid">
  <div class="tutorial-card">
    <h3><a href="godot.html">Godot</a></h3>
    <p>The official third-person shooter demo. Web export, keyboard bindings for touch controls, two sticks and three buttons.</p>
    <p><span class="badge badge-preview">Built and verified</span></p>
  </div>
  <div class="tutorial-card">
    <h3><a href="bevy.html">Bevy</a></h3>
    <p>A Rust game template. A custom Trunk build, an output folder that does not collide with source, a one-stick layout.</p>
    <p><span class="badge badge-preview">Built in CI</span></p>
  </div>
  <div class="tutorial-card">
    <h3><a href="unity.html">Unity</a></h3>
    <p>A 2D platformer package. The batch-mode build script, input settings, a GameCI workflow.</p>
    <p><span class="badge badge-warn">Not built by us</span></p>
  </div>
  <div class="tutorial-card">
    <h3><a href="profile-locally.html">Profile locally</a></h3>
    <p>The FPS overlay and the profiler that <code>vapour test</code> gives any engine. How to read them.</p>
    <p><span class="badge badge-preview">Verified</span></p>
  </div>
  <div class="tutorial-card">
    <h3><a href="fast-web-builds.html">Make it fast</a></h3>
    <p>Threads, web-only settings, a speed-optimised Godot template, a faster Bevy <code>.wasm</code>, and where WebGPU is available.</p>
    <p><span class="badge badge-warn">Not measured yet</span></p>
  </div>
  <div class="tutorial-card">
    <h3><a href="ladakh-hills.html">Ladakh Hills</a></h3>
    <p>A 3D Godot driving game: <code>vapour.toml</code>, export presets, load-time optimisations, a joystick for phones and a frame-rate bug found by profiling. <a href="https://vapour-web-637456171586.asia-south1.run.app/games/ladakh-hills">Play it</a>.</p>
    <p><span class="badge badge-preview">Published, phone untested</span></p>
  </div>
</div>

## What every tutorial covers

| Step | What you do |
| --- | --- |
| 1. Export | Produce a web build the way the engine wants it |
| 2. `vapour.toml` | Describe the game, its build and its [controls](../games/manifest.md) |
| 3. Touch controls | Make the game playable on a phone with on-screen controls |
| 4. Test locally | `vapour test` for an FPS overlay and a profiler |
| 5. CI | A workflow that builds on every push and publishes on a tag |
| 6. Publish | `vapour publish --dry-run --version 0.1.0 --notes "Dry run"`, then the real thing |

## Be honest about the state of things

These tutorials use tools that are **in preview**. Each page opens with a table of what we verified and what we did not. We
would rather tell you "not run" than imply it works.

| Tool | State today |
| --- | --- |
| `vapour test` (overlay and profiler launch) | Released in CLI v0.1.1 |
| `vapour controller …` and `[controller]` | Released in CLI v0.1.1 |
| `vapour build`, `vapour publish --version <semver> --notes "..."` | Released in CLI v0.1.1 |
| `vapour-ci` (the `@v1` action) | Not released: publishing from CI will not work until it is |
| Phone controls inside the Vapour player | Preview: we validated the config and the layout, not a real device |

The [status page](../status.md) is kept up to date as things ship.

## Starting a brand-new game instead?

`vapour template <engine> <name>` gives you an empty starter folder with `vapour.toml` and `store/` ready. It is a skeleton,
not a working game: you still create the engine project. See
[Start from an official template](../templates/overview.md). The tutorials are the better
route when you want something that already builds.

## Before you start

- Install the `vapour` CLI with the `curl` script or `go install` (see [prerequisites](../getting-started/prerequisites.md)).
- Have the engine for the tutorial you pick installed, at the version it names.
- Use a Chromium-family browser to test. For the profiler you also need Linux and the `vapour-profiler` binary.

## Words used in the tutorials

| Term | Meaning |
| --- | --- |
| **Web export** | The engine's output for browsers: an `index.html` plus WebAssembly, scripts and data |
| **Touch controls** | On-screen sticks and buttons drawn over the game on a phone |
| **`keyboard-map`** | A control mode where each on-screen control presses a keyboard key your game already understands |
| **Overlay** | The FPS readout `vapour test` adds to the page while testing |
| **Dump / trace** | A saved `.vpt` file of measurements the profiler can open |
| **Preview** | Implemented, but not yet in a release |

## Screenshots with a dashed border

The Unity tutorial has a few **dashed "Screenshot slot"** boxes. They mark steps inside the Unity editor, which we could not capture
because no Unity editor was available. They are real gaps, not decoration, and a screenshot there is a welcome contribution. See
[maintaining the handbook](../maintenance.md).
