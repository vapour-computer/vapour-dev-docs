# Create a store page

**Availability: staging through the source-preview publishing CLI.** See
[status](../status.md).

A store page is the public listing for a published game. It combines a tagline,
category and tags with Markdown text, media, facts, links and release notes.
Players see the page only while the game is published.

## Files in `store/`

`vapour create` writes the following files:

| File | Purpose |
| --- | --- |
| `store/template.md` | Store-page text. Text before the first `##` heading and each level-two heading form separate sections. |
| `store/page.json` | Page metadata, media paths and the ordered section layout. |
| `store/page.schema.json` | Draft 7 JSON Schema used by compatible editors to validate and autocomplete `page.json`. |
| `store/README.md` | A short editing and media reference kept with the game. |

Keep the generated `$schema` value in `page.json` so the editor can find the
local schema. The CLI performs its own validation even when the editor does not
support JSON Schema.

## `page.json` fields

Unknown properties are rejected. Character limits count Unicode characters.
Media paths are relative to the directory containing `page.json`.

| Field | Required | Value and limit |
| --- | --- | --- |
| `$schema` | No | String pointing to the schema, normally `./page.schema.json`. |
| `version` | Yes | Integer `1`. |
| `game` | No | Object containing `tagline`, `category` and `tags`; no other properties. |
| `game.tagline` | No | String, at most 140 characters. |
| `game.category` | No | Empty or one category from the list below. Input is trimmed and lowercased for upload. |
| `game.tags` | No | At most 5 strings. Each is 1–24 characters and may contain letters, digits, spaces and hyphens; it must start with a letter or digit. Tags are trimmed and lowercased for upload. |
| `media` | No | Object containing the four media fields; no other properties. |
| `media.banner` | No | Path to one banner image, or an empty string. |
| `media.cover` | No | Path to one cover image, or an empty string. |
| `media.screenshots` | No | Array of at most 8 image paths. Empty path entries are skipped. |
| `media.video` | No | Path to one trailer, or an empty string. |
| `sections` | Yes | Ordered array of 1–12 section objects. Every object requires `type`; no other properties beyond the type-specific options below. |
| `sections[].type` | Yes | `media`, `markdown`, `release_notes`, `details` or `links`. |
| `sections[].anchor` | For `markdown` | 1–40 lowercase letters, digits or hyphens. An anchor cannot be used twice. |
| `sections[].title` | No; `markdown` only | Display title, at most 60 characters. |
| `sections[].limit` | No; `release_notes` only | Number of releases to show, from 1 to 20. Omit it to use the default. |
| `details` | No | Array of at most 20 label/value objects. |
| `details[].label` | Yes | 1–40 characters. |
| `details[].value` | Yes | 1–200 characters. |
| `links` | No | Array of at most 6 label/URL objects. |
| `links[].label` | Yes | 1–40 characters. |
| `links[].url` | Yes | An `https://` URL of at most 300 characters. |

The resulting `version`, `sections`, `details` and `links` layout must fit in
16 KiB of JSON. `store/template.md` must be valid UTF-8 and is limited to 20,000
characters.

Categories are:

`action`, `adventure`, `arcade`, `casual`, `horror`, `platformer`, `puzzle`,
`racing`, `retro`, `rpg`, `shooter`, `simulation`, `sports`, `strategy` and
`other`.

## Arrange sections

The `sections` array controls which blocks appear and their order:

- `media` shows the trailer and screenshots.
- `markdown` shows one part of `template.md`.
- `release_notes` shows notes from published versions.
- `details` shows the label/value facts.
- `links` shows the external links.

`media`, `release_notes`, `details` and `links` can each appear only once.
`markdown` can appear more than once, but each occurrence needs a unique anchor.

The special `intro` anchor selects text before the first `##` heading. Other
anchors are made from headings by lowercasing them, replacing groups of
non-alphanumeric characters with `-`, and trimming leading or trailing hyphens.
For example, `## How to play` becomes `how-to-play`. A valid anchor with no
matching heading is allowed, but `vapour store check` warns that its section
will be empty. Raw HTML in the Markdown is not rendered.

## Worked example

Save this as `store/template.md`:

```markdown
Dodge the grid, collect the sparks and chase one more high score.

## About

Neon Circuit is a quick arcade game built for five-minute runs.

## How to play

- Move with WASD or the arrow keys.
- Press Space to dash.

## Credits

Game and art by Example Studio. Music used with permission.
```

Save this as `store/page.json`, with the named media files in `store/`:

```json
{
  "$schema": "./page.schema.json",
  "version": 1,
  "game": {
    "tagline": "Outrun an endless neon grid.",
    "category": "arcade",
    "tags": ["2d", "one-button"]
  },
  "media": {
    "banner": "banner.webp",
    "cover": "cover.png",
    "screenshots": ["shot-1.jpg", "shot-2.jpg"],
    "video": "trailer.webm"
  },
  "sections": [
    { "type": "media" },
    { "type": "markdown", "anchor": "intro" },
    { "type": "markdown", "anchor": "about", "title": "About Neon Circuit" },
    { "type": "markdown", "anchor": "how-to-play", "title": "How to play" },
    { "type": "release_notes", "limit": 5 },
    { "type": "details" },
    { "type": "links" },
    { "type": "markdown", "anchor": "credits", "title": "Credits" }
  ],
  "details": [
    { "label": "Controls", "value": "Keyboard or gamepad" },
    { "label": "Players", "value": "Single player" }
  ],
  "links": [
    { "label": "Website", "url": "https://example.com/neon-circuit" },
    { "label": "Support", "url": "https://example.com/support" }
  ]
}
```

Then validate it without uploading:

```sh
vapour store check
```

## Common validation mistakes

The command reports the precise failing field. These examples show the exact
error line for common mistakes; the section index starts at zero, and file names
or measured values vary with the project.

| Mistake | Error line |
| --- | --- |
| `version` is not `1` | `error: store/page.json: version must be 1` |
| Unsupported category `platform` | `error: store/page.json: game.category "platform" is not valid; use one of: action, adventure, arcade, casual, horror, platformer, puzzle, racing, retro, rpg, shooter, simulation, sports, strategy, other` |
| Six tags | `error: store/page.json: game.tags has 6 entries; the limit is 5` |
| Invalid tag `co_op` | `error: store/page.json: game.tags: "co_op" must be 1-24 characters (letters, digits, spaces or hyphens)` |
| No sections | `error: store/page.json: sections must have 1 to 12 entries (found 0)` |
| Missing or invalid Markdown anchor in the second section | `error: store/page.json: sections[1]: markdown needs an anchor of 1-40 lowercase letters, digits or hyphens` |
| Reused `about` anchor | `error: store/page.json: sections[2]: anchor "about" is used twice` |
| A second `media` section | `error: store/page.json: sections[1]: "media" can appear only once` |
| Option added to `media` | `error: store/page.json: sections[0]: "media" takes no options` |
| Unknown section type `gallery` | `error: store/page.json: sections[0]: unknown type "gallery" (use media, markdown, release_notes, details or links)` |
| Seven links | `error: store/page.json: links has 7 entries; the limit is 6` |
| Non-HTTPS link | `error: store/page.json: links[0].url must start with https:// and be at most 300 characters` |

A missing heading is a warning rather than an error. For an anchor named
`story`, the command prints:

```text
warning: section "story" has no matching "## " heading in the content file, so it will be empty
```

Fix all reported errors before using `vapour store push` or publishing a build.

## Media rules

Put media beside `page.json` or use paths relative to it. The CLI identifies file
formats from their contents, not their names or extensions.

| Media | Accepted formats | Minimum dimensions | Maximum dimensions | File-size limit |
| --- | --- | --- | --- | --- |
| Banner | PNG, JPEG or WebP | 960×300 and at least 2:1 | 8192×4096 | 4 MiB |
| Cover | PNG, JPEG or WebP | 460×215 | 4096×4096 | 2 MiB |
| Screenshot (up to 8) | PNG, JPEG or WebP | 640×360 | 8192×8192 | 4 MiB each |
| Trailer | MP4 or WebM | — | — | 30 MiB |

SVG, GIF and other image formats are rejected. Renaming an unsupported file to
`.png`, `.jpg` or `.webp` does not make it valid. All media sent in one store-page
upload must fit within a 30 MiB media budget, so compress the trailer or
screenshots when their combined size is too large.
