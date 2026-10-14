# Vapour Developer Handbook

GitBook-ready documentation for building, publishing and profiling games on Vapour.

**Canonical handbook: [https://vapour-dev-docs.pages.dev/](https://vapour-dev-docs.pages.dev/)**

[Repository chapters](book/SUMMARY.md) · [Implementation status](book/status.md) · [Tutorials](book/tutorials/overview.md)

The handbook covers the CLI, tokens, engine exports, publishing, CI, local
development, deployment, browser telemetry, native profiling, traces and analysis.
It documents the source available on 14 October 2026 and explicitly labels
unreleased workflows. It does not imply that preview features are deployed.

## GitBook

`gitbook-docs.yaml` defines the site mapping. `book/.gitbook.yaml` and
`book/SUMMARY.md` define the space and navigation. The root `.gitbook.yaml`
also supports a single-space Git Sync setup.

Follow [Connect this repository to GitBook](book/gitbook-setup.md) to authorize
GitHub Sync and publish a site. No GitBook account credentials are stored here.

## Tutorials

Step-by-step walkthroughs for [Godot](book/tutorials/godot.md), [Bevy](book/tutorials/bevy.md) and
[Unity](book/tutorials/unity.md), plus [local profiling](book/tutorials/profile-locally.md). Each uses a sample project
forked into the `vapour-computer` organization (branch `vapour-tutorial`). Every page says what was verified and what was not.

## GitHub Pages

`.github/workflows/pages.yml` deploys the book on every push to `main`. Enable it once under
**Settings → Pages → Source: GitHub Actions**. The site is then at `https://<owner>.github.io/<repository>/`.

## For language models

The build also writes `llms.txt`, `llms-full.txt`, `sitemap.xml` and a Markdown copy of every page under `md/`. See
[use this handbook with an AI assistant](book/reference/ai-assistants.md).

## Cloudflare Pages / static hosting

Use the maintained HonKit builder on Node 22:

```sh
npm ci
npm run build
```

Cloudflare settings: **framework preset None**, **build command `npm run build`**,
**output directory `_book`**, repository root, production branch `main`.
The build validates every generated page and local link. See the
[Cloudflare Pages guide](book/cloudflare-pages.md).

`gitbook-cli` is the obsolete legacy builder and crashes on current Node versions.
GitBook's hosted service uses Git Sync; this static hosting path uses HonKit.

## Update and validate

```sh
python3 scripts/check_docs.py
```

Read [CONTRIBUTING.md](CONTRIBUTING.md) before editing implementation claims.
