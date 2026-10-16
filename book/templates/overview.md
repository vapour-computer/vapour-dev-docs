# Start a new game from a template

<span class="badge badge-preview">Preview</span> <span class="badge">Godot</span> <span class="badge">Bevy</span> <span class="badge">Unity</span>

A **template** is an empty starter folder for a new game, with everything Vapour needs already set up: your game's
settings file (`vapour.toml`) and a ready-to-fill store page. One command makes it, and a few more take you from there to a
published game.

> **A template is a starting point, not a finished game.** It does not contain an engine project yet, so you add your own game
> to it. If you would rather start from something that already runs, follow a [tutorial](../tutorials/overview.md) instead.

## Template or tutorial?

| | Template | Tutorial |
| --- | --- | --- |
| What you get | An empty starter folder | A complete, working sample game |
| Best for | Starting your own new game | Learning the whole process once |
| Has a game inside | No | Yes |
| Command | `vapour template <engine> <name>` | Clone the sample, follow the page |

## Pick your engine

| Engine | Command | Page |
| --- | --- | --- |
| Godot | `vapour template godot "My Game"` | [Godot template](godot.md) |
| Bevy (Rust) | `vapour template bevy "My Game"` | [Bevy template](bevy.md) |
| Unity | `vapour template unity "My Game"` | [Unity template](unity.md) |

## From template to published game

These are the same six steps for every engine. Your engine's page has the details.

1. **Sign in** once, with a token from your Vapour account. See [Vapour tokens](../auth/tokens.md).

   ```sh
   vapour login --token vpr_...
   ```

2. **Make the folder** from the template.

   ```sh
   vapour template godot "My Game"
   cd my-game
   ```

3. **Add your game** to the folder, using your engine. Your engine's page shows how.
4. **Make a browser version** of your game: an export that has an `index.html`.
5. **Try it on your computer.** This opens your game with a live speed counter and a performance page. See
   [Understand your game's performance](../telemetry/guide.md).

   ```sh
   vapour test
   ```

6. **Check, then publish.** The first command checks and packs your game without uploading anything.

   ```sh
   vapour publish --dry-run --version 0.1.0 --notes "Dry run"
   vapour publish --version 0.1.0 --notes "First release"
   ```

Before you publish, fill in your store page: see [Create a store page](../games/store-page.md).

## What the template command does for you

- Makes a folder named after your game (`My Game` becomes `my-game`) and stops if that folder already has files in it.
- Registers your game on Vapour, so the name is yours. Add `--offline` to skip this. The game is then registered the first time you publish.
- Copies the starter files for your engine.
- Adds your store page files and your settings file, `vapour.toml`.

It needs Git installed, and you must be signed in unless you use `--offline`.

This is the real output for `vapour template godot "Doc Check" --offline`:

```text
$ vapour template godot "Doc Check" --offline
Cloning into 'doc-check'...
Created Doc Check in ./doc-check
Next: write your store text in doc-check/store/template.md and edit doc-check/store/page.json,
export your game for Web into doc-check/build/web, then run `vapour publish --version 0.1.0 --notes "Doc check"` from ./doc-check
```

and the folder it makes:

```text
doc-check/
├── .gitignore
├── README.md
├── vapour.toml
└── store/
    ├── README.md
    ├── page.json
    ├── page.schema.json
    └── template.md
```

Every setting in `vapour.toml` is explained in the [reference](../games/manifest.md).

## What is in each template

| Template | Contains | Does **not** contain |
| --- | --- | --- |
| Godot | A README and a `.gitignore` | A Godot project, a scene, a Web export setting |
| Bevy | A README, a `.gitignore`, empty `src` and `assets` folders | A Rust project or any code |
| Unity | A README, a `.gitignore` and Vapour's build helper for Unity | A Unity project |

If you try to build right after making a template, the tool tells you what is missing:

```text
$ vapour build
error: godot is required; install it yourself or set GODOT
```

```text
$ GODOT=/path/to/godot vapour build
error: required build input /…/doc-check/project.godot: stat /…/doc-check/project.godot: no such file or directory
```

That is expected. Add your game first.

Two small things to know:

- The README in each template says **"Godot Starter"**, **"Bevy Starter"** or **"Unity Starter"**, not your game's name. Rename it.
- The Unity template's README lists some folders that Unity creates itself and that are not in the template.

## Your own templates

A studio can keep its own starters. Publish repositories called `vapour-template-godot`, `vapour-template-bevy` and
`vapour-template-unity` under your organization on GitHub, then:

```sh
vapour template godot "My Game" --org my-studio
```

## Common problems

| You see | What to do |
| --- | --- |
| `template engine must be one of bevy, godot, unity` | Use one of those three. For anything else use `vapour create --engine other` |
| `… already exists and is not empty` | Pick another name, or remove the existing folder |
| `git is required to clone a template or sample` | Install Git |
| `not logged in` | Run `vapour login`, or add `--offline` |

## Status

`vapour template` is **in preview**: it is in the CLI's main branch but not in a release yet. The three template repositories are
public at [github.com/vapour-computer](https://github.com/vapour-computer). See [what is available today](../status.md).
