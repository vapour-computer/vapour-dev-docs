# vapour.toml reference

The publishing CLI reads `vapour.toml` from the selected game directory.
This file describes a game build; it must not contain credentials or telemetry keys.

```toml
[project]
title = "My Game"
slug = "my-game"
engine = "godot"
version = "0.1.0"
# id = "..."  # written after the project is registered

[build]
dir = "build/web"
cover = "cover.png" # optional; omit if no cover is supplied

[store]
page = "store/page.json"
content = "store/template.md"
notes = "store/notes.md" # optional release notes
```

| Field | Meaning |
| --- | --- |
| `project.id` | Server project identifier; absent for an offline/unregistered project |
| `project.title` | Required nonempty title |
| `project.slug` | URL slug; creation normalizes it and the server checks uniqueness |
| `project.engine` | `godot`, `unity`, `bevy` or `other` |
| `project.version` | Starts with a letter/digit; subsequent characters may include letters, digits, `.`, `+`, `_`, `-` |
| `build.dir` | Required path to the web export directory or ZIP |
| `build.cover` | Optional legacy path to the cover file; `store.page` media takes precedence |
| `store.page` | Optional path to the JSON store-page definition |
| `store.content` | Optional path to the store-page Markdown text; at most 20,000 characters |
| `store.notes` | Optional path to Markdown release notes; at most 5,000 characters |

Paths are resolved relative to the game directory chosen by `--dir`, not relative
to an arbitrary shell directory. The server treats slug and engine as immutable
after project creation; editing a local manifest does not rename an existing game.
Media paths inside `page.json` are instead relative to that JSON file. See the
[store-page reference](store-page.md) for its fields and limits.

## Overrides

```sh
vapour publish --dir ./my-game --version 0.2.0
```

The version flag changes that publication's version. It normally does not rewrite
an already-registered project's manifest. During first-time registration, however,
the CLI saves the manifest with the newly assigned ID, so the in-memory override
can also be persisted. Check the file after the first publish.

## Validation failures

- Missing title, engine, version or build directory: fix the manifest.
- Missing `index.html`: fix the engine export, not the project ID.
- Duplicate slug: choose another slug for the new project.
- 403 on an existing ID: verify that your credentials own that project.

Use [dry-run validation](publish.md) before a real upload.
