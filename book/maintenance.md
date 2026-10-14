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
