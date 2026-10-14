# vapour.toml reference

`vapour.toml` describes one game: what it is, where its web export lives, how to build it, what its store page
says, and (preview) how touch controls map to keys. The CLI reads it from the game folder. It must never contain
tokens, keys or any other secret.

This page lists **every entry**. Each is marked **Released** (in the current `vapour-cli` main branch) or
**Preview** (implemented in an open or local change, not yet in a release). See
[what is available today](../status.md).

## A complete example

```toml
[project]
id = "6f2c1c1e-..."          # written by the CLI; do not invent it
title = "TPS Demo"
slug = "tps-demo"
engine = "godot"             # godot | unity | bevy | other
platform = "desktop"         # Preview: desktop | native-mobile | port
version = "0.1.0"

[build]
dir = "build/web"            # web export folder (or a .zip)
cover = "cover.png"          # optional, legacy
command = "auto"             # auto | custom | none
# args = ["trunk", "build", "--release", "--dist", "dist"]
#   ^ required when command = "custom"
# boot = ["index.html", "*.js", "*.wasm", "*.pck"]
#   ^ files needed before the game can start
# split_warn_mib = 1024      # warn about single files larger than this

[store]
page = "store/page.json"
content = "store/template.md"
notes = "store/notes.md"

# Preview: touch controls for phones
[controller]
mode = "keyboard-map"        # keyboard-map | dedicated

[[controller.controls]]
id = "move"
type = "joystick"            # button | dpad | joystick
x = 0.20
y = 0.74
w = 0.30
h = 0.30
up = "w"
down = "s"
left = "a"
right = "d"
deadzone = 0.18
sensitivity = 1.0
repeat_hz = 60
```

Paths are relative to the game folder (the `--dir` you pass, default `.`), not to your shell's current directory.
Media paths *inside* `store/page.json` are relative to that JSON file.

## Which command reads what

| Command | Reads | Validates |
| --- | --- | --- |
| `vapour create` | writes a starter file | |
| `vapour build` | `project.engine`, `build.*` | `build.dir` rules below |
| `vapour test` | `project.title`, `project.version`, `build.dir` | the whole manifest (see [validation](#validation-errors)) |
| `vapour publish` | `project.*`, `build.dir`, `store.*`, `controller` | the whole manifest, then the build folder and store page |
| `vapour store check` / `push` | `store.*` | store files only |
| `vapour controller …` | `project.platform`, `controller` | the controller section |

## `[project]`

| Entry | Type | Required | Status | Meaning |
| --- | --- | --- | --- | --- |
| `id` | string | no | Released | The game's server identifier. The CLI writes it into the file the first time it registers the game. Leave it out for a new game. Do not copy another game's ID: a `403` on publish means the ID belongs to someone else. |
| `title` | string | **yes** | Released | The display name. Must contain something other than whitespace. |
| `slug` | string | no\* | Released | The URL name, for example `my-game`. `vapour create` builds it from the title: lowercase `a–z0–9` and `-`, at most 48 characters, `game` if nothing is left. The server requires it to be unique and treats it as **immutable**: editing it later does not rename an existing game. \*The manifest check does not demand it, but `vapour create` and the first publish send it to the server. |
| `engine` | string | **yes** | Released | One of `godot`, `unity`, `bevy`, `other`. Immutable after registration. It also selects which exporter `vapour build` runs and which files count as boot files. |
| `version` | string | **yes** | Released | Starts with a letter or digit, then letters, digits and `. + _ -`. Examples: `0.1.0`, `2024.3-rc1`. Each version can be published **once**; bump it for every release. `--version` overrides it for one run. |
| `platform` | string | no | Preview | One of `desktop`, `native-mobile`, `port`. Empty is allowed. `native-mobile` makes `vapour controller init` default to the `dedicated` mode, and `controller check` warns about incompatible modes. |

## `[build]`

| Entry | Type | Required | Status | Meaning |
| --- | --- | --- | --- | --- |
| `dir` | string | **yes** | Released | The web export: a folder, or a `.zip` file. A folder must contain `index.html` and no native binaries (`.exe`, `.dll`, `.so`, `.dylib`, `.app`, `.msi`). A `.zip` is uploaded as is. |
| `cover` | string | no | Released | Legacy path to a cover image. `store.page` media takes precedence. |
| `command` | string | no | Released | How `vapour build` produces `dir`. `auto` (default) runs the engine's own exporter for `godot`, `unity` or `bevy`. `custom` runs `build.args`. `none` builds nothing and only inspects `dir`. For `engine = "other"`, `auto` is an error: use `custom` or `none`. |
| `args` | list of strings | with `custom` | Released | The command to run, as a list: the program first, then its arguments. Run from the game folder. Required when `command = "custom"`, ignored otherwise. |
| `boot` | list of globs | no | Released | Which files the player must fetch before the game can start. When set, it **replaces** the built-in rules. Patterns are matched against each file's path inside `dir` with `/` separators, and `*` does not cross a `/`. |
| `split_warn_mib` | integer | no | Released | `vapour build` warns about any single file larger than this many MiB, because browser WebAssembly memory is limited. `0` means the default of 1024. The maximum is 4096; anything else is rejected. |

### `build.dir` rules for `vapour build`

`vapour build` is stricter than the other commands, because some exporters delete and recreate the folder:

- It must be a **subfolder** of the game folder: not absolute, not `.`, not outside the game folder.
- It must not pass through a **symbolic link**.
- For Bevy it must not be inside `assets/`.
- Never point it at a folder that holds **source files**. The Bevy asset step deletes and recreates `build.dir`, and build
  tools such as Trunk write into (and may empty) the folder you give them. The [Bevy tutorial](../tutorials/bevy.md) uses a
  template where `build/web/` is source, so its output goes to `dist/` instead.

`vapour test` and `vapour publish` do not enforce the symlink rule, but keep the same habits.

### Default boot files

With no `boot` list, these files are marked as boot files in `.vapour/build.json`:

| Engine | Boot files |
| --- | --- |
| all | `index.html`, every `.js`, every `.wasm` |
| Godot | also `.pck` |
| Unity | also `.data`, `.br`, `.gz`, `.unityweb` |
| Bevy | the above, but nothing under `assets/` |

`vapour build` writes the list, with file sizes, to `.vapour/build.json` (schema `1`). Chunked publishing reads it and
refuses a stale file ("rerun `vapour build`"). Do not commit `.vapour/`.

## `[store]`

| Entry | Type | Required | Status | Meaning |
| --- | --- | --- | --- | --- |
| `page` | string | no | Released | Path to the JSON store-page template: tagline, category, tags, details, media files, section layout. See the [store-page reference](store-page.md). |
| `content` | string | no | Released | Path to the Markdown text of the page. At most 20,000 characters. |
| `notes` | string | no | Released | Path to Markdown release notes for this version. At most 5,000 characters. `--notes` and `--notes-file` override it. |

## `[controller]` (Preview)

Touch controls for phones. They are **drawn by the Vapour player on top of your game** and turn finger movement into
the keys your game already understands. Nothing is added to your build. See the
[Godot tutorial](../tutorials/godot.md) for a worked example.

| Entry | Type | Required | Meaning |
| --- | --- | --- | --- |
| `mode` | string | when controls exist | `keyboard-map`: controls send keyboard keys. `dedicated`: controls send action IDs to a native or mobile runtime. `action-map` is an alias for `dedicated`. |

Each `[[controller.controls]]` table is one on-screen control.

| Entry | Type | Applies to | Rules |
| --- | --- | --- | --- |
| `id` | string | all | Optional label. Shown in `vapour controller check` and previews. |
| `type` | string | all | **Required.** `button`, `dpad` or `joystick`. |
| `x`, `y` | number | all | **Required.** The control's centre, as a fraction of the screen. `0` to `1`, inclusive. `y` grows downward. |
| `w`, `h` | number | all | **Required.** Size as a fraction of the screen. Greater than `0`, at most `1`. |
| `key` | string | `button`, `keyboard-map` | **Required** for a button in `keyboard-map`. A key such as `Space`, `Enter`, `f`, `ArrowUp`. |
| `action` | string | `button`, `dedicated` | **Required** for a button in `dedicated`. An action ID your runtime understands. |
| `up`, `down`, `left`, `right` | string | `dpad`, `joystick` | **All four required.** Keys in `keyboard-map`; action IDs in `dedicated`. |
| `deadzone` | number | `joystick` | At least `0`, below `1`. Recommended `0.10`–`0.25`. `controller check` shows `0.15` when unset. |
| `sensitivity` | number | `joystick` | Greater than `0`. Recommended `0.8`–`1.6`. `controller check` shows `1.0` when unset. |
| `repeat_hz` | integer | `joystick` | How often a held key is re-sent, 1 to 240. Recommended `30`–`90`. `controller check` shows `30` when unset. A joystick is not an analogue input: its deflection becomes a key press duty cycle. |
| `pwm_hz` | integer | `joystick` | Older name for `repeat_hz`. If you set both they must be equal. |

Run `vapour controller check` to validate and `vapour controller preview --html` to see the layout. Keep controls from
overlapping each other: the preview makes overlaps obvious, and a thumb cannot tell two touching controls apart.

## Validation errors

These are the messages the CLI prints, with the fix.

| Message | Fix |
| --- | --- |
| `no vapour.toml in <dir> (run vapour create or cd into your game folder)` | Run from the game folder or pass `--dir`. |
| `project.title is required` | Give the game a title. |
| `project.engine must be one of godot, unity, bevy, other` | Fix the spelling; it is case-sensitive. |
| `project.version "…" is not valid (example: 0.1.0)` | Start with a letter or digit; use only letters, digits and `. + _ -`. |
| `project.platform must be one of desktop, native-mobile, port` | Preview only. |
| `build.dir is required (your web export folder or .zip)` | Set `dir`. |
| `"…" has no index.html: export your game for Web (HTML5)` | Re-export; point `dir` at the folder that holds `index.html`. |
| `found native binaries (…): browsers cannot run these` | You pointed at a desktop export. Use the Web export. |
| `build.dir must be a subdirectory of the project` | `vapour build` only: use a relative subfolder. |
| `build.dir must not traverse symlinks` | `vapour build` only: use a real folder. |
| `command=custom requires build.args (executable followed by arguments)` | Add `args`. |
| `build.command must be auto, custom or none` | Fix the spelling. |
| `split_warn_mib must be between 0 (default 1024) and 4096` | Pick a value in range. |
| `controller.mode is required when controller.controls are set` | Preview only. Add `mode`. |
| `controller.controls[0]: x and y must be between 0 and 1` | Use fractions, not pixels. |
| `controller.controls[0]: up is required for joystick` | A `dpad` or `joystick` needs all four directions. |
| `repeat_hz (30) and pwm_hz (60) disagree` | Keep one of them, or make them equal. |
| `version … is already published` | Bump `project.version`, or pass `--version`. |

## Overrides

```sh
vapour publish --dir ./my-game --version 0.2.0
```

`--version` changes that publication only. It normally does not rewrite your manifest, but on the **first**
registration the CLI saves the file with the new `id`, so check it after the first publish.

Use [dry-run validation](publish.md) before a real upload.
