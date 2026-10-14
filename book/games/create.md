# Create or import a project

**Availability: source-preview publishing CLI.** See [status](../status.md).

## Create a new project

```sh
vapour create "My Game" --engine godot
```

Supported engine values are `godot`, `unity`, `bevy` and `other`. The default is
`godot`. The CLI derives a lowercase slug and creates a directory such as
`my-game/`, writes engine-specific README scaffolding and saves `vapour.toml`.
The current templates do not generate a complete playable engine project.
Create your Godot/Unity/Rust project in that directory or import an existing one.

The scaffold also creates a `store/` directory:

| File | Purpose |
| --- | --- |
| `template.md` | Markdown text for the store page |
| `page.json` | Game details, media paths and page layout |
| `page.schema.json` | Editor validation and autocomplete for `page.json` |
| `README.md` | A short store-page editing reference |

Edit these files before publishing; see [Create a store page](store-page.md).

Normally it registers the remote project first. If the server rejects the
request, scaffolding has not been written. If later disk or clone work fails,
the already-created remote project may still exist; inspect your projects before
retrying with a new identity.

## Start from an official template

```sh
vapour template godot "My Game"
vapour template bevy "My Game"
vapour template unity "My Game"
```

`vapour template <engine> <name>` clones an engine starter repository, removes its `.git` folder, and then runs the same
setup as `vapour create`. It is a thin wrapper: everything in the sections around this one (slug, registration, `store/`
files, the saved manifest) applies to it too.

| Engine | Repository it clones |
| --- | --- |
| `godot` | [`vapour-computer/vapour-template-godot`](https://github.com/vapour-computer/vapour-template-godot) |
| `bevy` | [`vapour-computer/vapour-template-bevy`](https://github.com/vapour-computer/vapour-template-bevy) |
| `unity` | [`vapour-computer/vapour-template-unity`](https://github.com/vapour-computer/vapour-template-unity) |

`other` is not available; use `vapour create --engine other`, and the CLI answers `template engine must be one of bevy, godot, unity`.

| Flag | Meaning |
| --- | --- |
| `--org <name>` | The GitHub organization or user that owns the template repos. Default `vapour-computer`. The CLI looks for `vapour-template-<engine>` under it |
| `--offline` | Skip server registration. The first `vapour publish` registers the project and writes its ID |

In order, the command:

1. Lower-cases the engine, checks it, and builds `https://github.com/<org>/vapour-template-<engine>.git`.
2. Makes a slug from the name (`My Game` becomes `my-game`) and refuses to continue if that folder exists and is not empty.
3. Registers the project with the API, unless `--offline`. This needs you to be [logged in](../auth/tokens.md). If the server refuses, nothing is written.
4. Runs `git clone --depth 1` into the new folder and deletes `.git`, so your game starts with a fresh history.
5. Adds the `store/` starter files (without overwriting any the template already has) and saves `vapour.toml` with
   `version = "0.1.0"`, `build.dir = "build/web"`, and the two `store.*` paths.

Git must be installed. The clone uses plain HTTPS, so a private `--org` repository works only if your Git is already
authorized to read it.

### What the templates are, and are not

> **They are skeletons, not working games.** After `vapour template` you still have to create the engine project.
> `vapour build` will fail until you do.

This is exactly what is in each repository today:

| Template | Contains | Does **not** contain |
| --- | --- | --- |
| Godot | `README.md`, `.gitignore` (ignores `.godot/`, `build/`, `*.translation`) | `project.godot`, a scene, a Web export preset |
| Bevy | `README.md`, `.gitignore` (ignores `build/`, `dist/`, `target/`), empty `src/` and `assets/` | `Cargo.toml`, any Rust code, `index.html` or `Trunk.toml` |
| Unity | `README.md`, `.gitignore` (the usual Unity ignores), `Assets/Editor/VapourBuild.cs` | `ProjectSettings/`, `Packages/manifest.json`, a scene |

Here is the real result of `vapour template godot "Doc Check" --offline`:

```text
$ vapour template godot "Doc Check" --offline
Cloning into 'doc-check'...
Created Doc Check in ./doc-check
Next: write your store text in doc-check/store/template.md and edit doc-check/store/page.json,
export your game for Web into doc-check/build/web, then run `vapour publish` from ./doc-check
```

```text
doc-check/
├── .gitignore
├── README.md                  ← from the template ("# Godot Starter")
├── vapour.toml                ← written by the CLI
└── store/                     ← written by the CLI
    ├── README.md
    ├── page.json
    ├── page.schema.json
    └── template.md
```

```toml
[project]
title = 'Doc Check'
slug = 'doc-check'
engine = 'godot'
version = '0.1.0'

[build]
dir = 'build/web'

[store]
page = 'store/page.json'
content = 'store/template.md'
```

There is no `.git` folder, and no engine project. If you run `vapour build` now you get one of these, depending on whether
the editor can be found:

```text
$ vapour build
error: godot is required; install it yourself or set GODOT
```

```text
$ GODOT=/path/to/godot vapour build
error: required build input /…/doc-check/project.godot: stat /…/doc-check/project.godot: no such file or directory
```

Two things to know:

- **The README heading is generic.** The READMEs are rendered once, when the template repos are published, so they say
  "Godot Starter", "Bevy Starter" or "Unity Starter", not your game's name. Rename it.
- **The Unity README overstates the contents.** It lists `Packages/` and `ProjectSettings/` in the layout, but the template
  does not include them. Unity creates them when you create the project.

### Make it buildable

| Engine | What to add |
| --- | --- |
| Godot | Create the project in the folder (Godot writes `project.godot`), then add a **Web** export preset and **commit `export_presets.cfg`**. `vapour build` needs a preset named `Web` with platform `Web`. See the [Godot tutorial](../tutorials/godot.md) |
| Bevy | Add a `Cargo.toml`, your code, and a Trunk setup (`index.html`, `Trunk.toml`). Then either set `build.command = "custom"` or use the automatic exporter. See the [Bevy tutorial](../tutorials/bevy.md) |
| Unity | It is usually easiest to create the project with Unity Hub first, then copy `vapour.toml`, `store/` and `Assets/Editor/VapourBuild.cs` into it. See the [Unity tutorial](../tutorials/unity.md) |

If you want a project that already builds, follow a [tutorial](../tutorials/overview.md): each starts from a complete sample.

### Use your own templates

`--org` lets a team keep its own starters. Publish repositories named `vapour-template-bevy`, `vapour-template-godot` and
`vapour-template-unity` under your organization, then:

```sh
vapour template godot "My Game" --org my-studio
```

### For maintainers: publishing the official templates

The official repositories are generated from the CLI's own scaffold templates (`internal/scaffold/templates/<engine>/`), so
they stay in step with `vapour create`. `scripts/publish-template-repos.sh [org]` needs `git` and an authenticated `gh`. For each
engine it renders the `*.tmpl` files (replacing `{{.Title}}` with "Bevy Starter", "Godot Starter" or "Unity Starter"),
makes a one-commit repository, and either creates `<org>/vapour-template-<engine>` (public) or pushes to `main` of an
existing one with `git push --force-with-lease`. Each run builds a fresh one-commit history, so it is meant to **replace**
the template's contents. We did not run it: it changes live repositories, and because the new local repository has not
fetched the remote's history, Git may reject the push as stale. If that happens, resolve it deliberately instead of forcing blindly.

## Work offline first

```sh
vapour create "My Game" --engine godot --offline
```

This scaffolds locally without API access. The manifest has no project ID yet.
The first real `vapour publish` registers the project and writes its returned ID.
`publish --dry-run` does not register it.

## Import a Git repository

```sh
vapour create "My Game" --engine godot --from https://github.com/YOUR-ORG/YOUR-GAME.git
```

The CLI shallow-clones the repository and removes the cloned `.git` directory,
so the new project starts without the sample's Git history. It writes the new
Vapour manifest and adds missing `store/` starter files without overwriting
existing files. Use `--offline` as well if remote registration should wait.
Git must be installed. Clone into a new empty destination; the CLI rejects a
nonempty directory rather than overwriting an existing project.

## Existing directory without cloning

Create a [manifest](manifest.md) at the existing project's root, leave `id` absent
until first registration, and set the correct engine and build directory. The
publishing CLI can register it on first publish. Avoid inventing or copying
another game's ID: the API enforces ownership.

Next: [export for Web](web-export.md).
