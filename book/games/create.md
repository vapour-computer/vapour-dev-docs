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
```

`vapour template` makes a starter folder for Godot, Bevy or Unity, with your settings file and store page already set up. It is a
starting point, not a working game. Everything about it is in the [Templates section](../templates/overview.md).

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
