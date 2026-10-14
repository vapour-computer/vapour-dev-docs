# Vapour Developer Handbook

GitBook-ready documentation for building, publishing and profiling games on Vapour.

**[Read the handbook](book/README.md)** · **[All chapters](book/SUMMARY.md)** · **[Implementation status](book/status.md)**

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

## Update and validate

```sh
python3 scripts/check_docs.py
```

Read [CONTRIBUTING.md](CONTRIBUTING.md) before editing implementation claims.
