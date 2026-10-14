# Documentation maintenance

The handbook is the workflow index across repositories. Source and tests remain
the authority for implemented behavior.

## Update a process

1. Identify the source revision and relevant command/API/hook.
2. Update [status](status.md) if publication, release or integration changed.
3. Update the guide, command/config/limit references and troubleshooting together.
4. Add new pages once to `SUMMARY.md`, with working relative links.
5. Run the documentation checker and any meaningful changed examples.
6. Commit and push through the docs repository's review flow.

Use “planned” for an interface that does not exist, “source preview” for an
implemented but unpublished checkout, and explicit branch/release references for
available code. Do not remove an integration blocker just because a helper
function or mock-based unit test exists.

## Evidence worth recording

- Exact CLI help and option behavior, including defaults and precedence.
- Actual backend route auth/ownership and body/size rules.
- Engine/exporter version, output tree and hosted-play evidence for framework guides.
- Real kernel lifecycle evidence rather than build success alone.
- Browser observer/feature support and actual isolated-browser smoke results.
- Production bundle/HTTP/rules-emulator checks at the appropriate layer.
- Measured overhead hardware/workload, never just an unverified target.

The 14 October 2026 audit used the source revisions in the availability matrix,
the CLI handlers/config/packer, infra API/config/deploy scripts, browser package
README/tests and canonical trace specification. GitBook configuration was checked
against its current content-configuration documentation.

## Avoid stale recipes

The old CLI README's `go install .../vapour-cli@latest` does not guarantee the
documented executable name or unpublished command set. Old CI examples reference
an unverified `v1` tag. These guides
follow the audited code rather than silently copying those older recipes.

Keep unknown runtime symbols, memory export hooks, origins and environment settings
as explicit integration inputs. Ask the runtime/environment owner instead of
guessing a plausible internal name.

## GitBook updates

Edit the repository's Markdown and navigation as the source of truth. Once Git
Sync is configured, GitBook imports the changes. Keep existing space keys stable:
changing a key can create a new space rather than renaming the old one. See
[GitBook setup](gitbook-setup.md) and the repository's contribution instructions.

## Screenshots: how they are made

Screenshots of web content are captured with a **headless Chromium** and no extra dependencies, using
`scripts/shot.mjs` (it speaks the DevTools protocol over Node's built-in WebSocket). Images live in `book/assets/img/`.

```sh
# the controller preview page
vapour controller preview --html --out /tmp/preview.html
node scripts/shot.mjs --url file:///tmp/preview.html --out book/assets/img/preview.png --w 1000 --h 760 --full

# a running game with the FPS overlay
vapour test --no-open --no-profile --port 8765 &
node scripts/shot.mjs --url http://127.0.0.1:8765/ --out book/assets/img/game.png --w 1280 --h 720 --wait 35000
```

Other options: `--mobile` (phone emulation), `--scale 2`, `--gl` (ask for the real GPU), `--waitfor "<js expression>"`,
`--eval` / `--evalfile` (run JavaScript before the shot, for example to import a dump), `--clip x,y,w,h`.

Rules we follow:

- **Terminal output is never a screenshot.** Show commands and their real output in a `text` or `sh` code block.
- **Say how a screenshot was made** in its caption when it could mislead. Headless Chromium renders in software, so an
  FPS reading from it is low; the caption says so.
- **Keep illustrative data labelled.** The dashboard screenshots of a trace use the book's sample fixture, and say so.
- **Give every image descriptive alt text.** `llms-full.txt` turns it into `[Image: …]` for language models.
- **Editor steps.** The Godot editor can be captured on a virtual display (see below). Unity cannot, without an editor and license, so its
  steps carry a dashed `shot-slot` figure that says exactly what to capture. Replace it with an image when you can.

## GitHub Pages

`.github/workflows/pages.yml` builds the book and deploys it on every push to `main`. Do this once in the repository:
**Settings → Pages → Build and deployment → Source: GitHub Actions**. The site address is
`https://<owner>.github.io/<repository>/`. Cloudflare Pages keeps working from the same `npm run build` output; the GitHub
Pages copy sets `SITE_URL` so `llms.txt` and the sitemap point at the right host.

## Outputs for language models

`npm run build` also runs `scripts/build_llms.mjs`, which writes `llms.txt`, `llms-full.txt`, `sitemap.xml`, `robots.txt` and
a Markdown copy of every page under `md/` next to the HTML. See [use this handbook with an AI
assistant](reference/ai-assistants.md). Nothing is hand-maintained: add a page to `SUMMARY.md` and it is included.

## Publishing the official template repositories

The three repositories (`vapour-template-godot`, `-bevy`, `-unity`) are generated from the CLI's own starter files in
`internal/scaffold/templates/<engine>/`, so they stay in step with `vapour create`. `scripts/publish-template-repos.sh [org]`
needs `git` and a signed-in `gh`. For each engine it fills in the README title ("Bevy Starter", "Godot Starter", "Unity Starter"),
makes a one-commit repository, and either creates `<org>/vapour-template-<engine>` (public) or pushes to `main` of an existing one
with `git push --force-with-lease`. Each run builds a fresh history, so it is meant to **replace** the template's contents. We have
not run it: it changes live repositories, and because the new local repository has not fetched the remote's history, Git may reject
the push as stale. If that happens, resolve it on purpose instead of forcing blindly.

## Capturing the Godot editor

The editor can be captured without touching your desktop by running it on a virtual display (`Xvfb`) and clicking with `xdotool`:

```sh
Xvfb :99 -screen 0 1600x1000x24 &
DISPLAY=:99 godot --editor --path . --rendering-driver opengl3 --resolution 1600x1000 --position 0,0 &
DISPLAY=:99 xdotool mousemove 91 21 click 1        # the Project menu
DISPLAY=:99 import -window root shot.png
```

Unity cannot be captured this way unless a Unity editor and license are installed.
