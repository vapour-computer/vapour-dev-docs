# Connect GitBook

This repository contains a complete GitBook-ready handbook. A live GitBook site
still requires an authorized GitBook organization/account and its GitHub Sync
connection. No live site was created merely by pushing these files.

For Cloudflare Pages, use the [static hosting guide](cloudflare-pages.md)
and `npm run build`. GitBook's hosted service uses the Git Sync flow below.

## Connect and import

1. In your GitBook organization, create/select the documentation site or space.
2. Connect GitHub Sync and authorize the GitBook GitHub app to access
   `vapour-computer/vapour-dev-docs`.
3. Select the repository and `main` branch. For site-level sync, leave the project
   directory at the repository root so GitBook reads `gitbook-docs.yaml`.
4. Import **GitHub → GitBook** for the initial sync; the repository already
   contains the handbook and navigation.
5. Preview the sidebar, code blocks and links. Publish from GitBook and choose
   the site's URL/domain through your account settings.

GitBook UI labels can vary by account/plan. Its current configuration guide is
[Content configuration](https://gitbook.com/docs/docs-as-code/git-sync/content-configuration).

## Files and mapping

| File | Purpose |
| --- | --- |
| `gitbook-docs.yaml` | Site title and stable space mapping to `./book` |
| `book/.gitbook.yaml` | Space-relative root, README and SUMMARY |
| `book/README.md` | Handbook landing page |
| `book/SUMMARY.md` | Sidebar order and chapter groups |
| Root `.gitbook.yaml` | Single-space Git Sync compatibility, with content root `./book/` |

The site space key is `vapour-developer-handbook`. Keep it stable after initial
publication. To rename the display title, change the title without changing the
key. Each Markdown page appears once in the summary.

If using an older single-space setup, point it at the repository root and let
the root `.gitbook.yaml` select `book/`. Do not accidentally nest the root twice
by selecting `book/` and then applying a second `root: ./book/` configuration.

## Verify the first publication

- Landing page and all sidebar groups are present.
- Code snippets preserve syntax and placeholders.
- Source-preview/planned status notices remain visible.
- Sample trace link opens the intended repository artifact.
- No private tokens, environment files or local machine paths were imported.

For routine edits, commit Markdown and `SUMMARY.md` changes to the repository,
run `python3 scripts/check_docs.py`, and let Git Sync import the update. The docs
CI validates content structure/links; it does not itself provision a GitBook site.
