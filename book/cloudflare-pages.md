# Host the handbook on Cloudflare Pages

This repository builds a static documentation site with **HonKit**, a maintained
GitBook-compatible builder. It reads the same `book/` Markdown and `SUMMARY.md`
used by GitBook Git Sync. No application server or Cloudflare Worker is needed.

## Cloudflare Pages configuration

Connect `vapour-computer/vapour-dev-docs` and set:

| Setting | Value |
| --- | --- |
| Production branch | `main`, after merging the build fix |
| Framework preset | None |
| Root directory | Repository root; leave blank/default |
| Build command | `npm run build` |
| Build output directory | `_book` |
| Node version | 22, selected by `.node-version`; remove a conflicting environment override |

Cloudflare installs the npm dependencies from the committed `package.json` and
lockfile. If dependency installation has been disabled in project settings,
enable it or use `npm ci && npm run build` as the build command.

For an initial preview, deploy `fix/cloudflare-build`. For production, merge the
fix and trigger a **new deployment from the latest `main`**. Retrying a deployment
pinned to an old commit does not pull newer source. The initial repository commit
`47c7746` contains only the original README; it cannot build the handbook. Check
the new log's checkout SHA against the branch revision you intend to deploy.

## Why the legacy build failed

The old command `npx gitbook-cli build` downloads `gitbook-cli@2.3.2` and attempts
to install GitBook 3.2.3. Its old npm/graceful-fs dependency fails on modern Node
with `TypeError: cb.apply is not a function`.

The repository now pins HonKit in the lockfile and runs its local executable.
This path was verified on **Node 22.16.0**, matching the reported Cloudflare build
environment. No downgrade to an obsolete Node release is required.

## Build locally

From the repository root:

```sh
npm ci
python3 scripts/check_docs.py
npm run build
```

The production output is `_book/` at the **repository root**. It contains HTML,
theme assets, a search index and the sample trace. HonKit resolves its output
argument relative to the input book, so the script deliberately uses
`honkit build ./book ../_book --reload`.

After building, `scripts/check_site.mjs` verifies that every sidebar page exists,
all generated local links/assets resolve, the trace download and search index
are present, and GitHub Actions examples retain literal `${{ ... }}` expressions.
The build fails if this check fails. CI runs the same static build on Node 22.

To preview the finished static files locally:

```sh
python3 -m http.server 8000 --directory _book
```

Open `http://localhost:8000`. This preview command is for local inspection;
Cloudflare Pages serves the files directly.

## Confirm the deployment

Open the landing page and sidebar, follow a framework guide, run a search, and
download the example `.vpt`. If the site is empty or returns 404, check the
checkout revision, repository root and `_book` output setting first. The absence
of a Wrangler configuration file is not the cause of the legacy Node error.

For GitBook's own hosted service, use [GitBook Sync setup](gitbook-setup.md)
instead; it does not require running the legacy npm CLI.
