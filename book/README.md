# Vapour Developer Handbook

Build a web game, publish it to Vapour, and investigate its performance locally.
This handbook covers both game-developer workflows and platform-maintainer
workflows, from credentials and engine exports to trace analysis and deployment.

## Start with your goal

| Goal | Start here |
| --- | --- |
| Publish a game for the first time | [First game](getting-started/first-game.md) |
| Build Godot, Unity or Bevy for the browser | [Web exports](games/web-export.md) |
| Create, rotate or revoke a CLI token | [Vapour tokens](auth/tokens.md) |
| Automate a game release | [Publishing from CI](games/ci-cd.md) |
| Profile a browser game | [Browser telemetry](telemetry/browser.md) |
| Work on Linux/eBPF profiling | [Native profiler](telemetry/native.md) |
| Understand port 6767 and the two collectors | [Local agent](telemetry/local-agent.md) |
| Export or inspect a performance dump | [Dumps](analysis/dumps.md) |

## Read availability before running commands

The project is under active implementation. The publishing CLI and backend have
working source in the maintainer workspace, but that implementation was not yet
on their public `main` branches at this documentation snapshot. The native
profiler currently provides an attach/detach proof. Browser telemetry is on a
published feature branch and is not wired into the live player.

Every workflow is grounded in the [implementation status](status.md). A source
preview is not a release announcement or a claim about the deployed service.
Commands marked **planned** describe the intended interface, not executable
instructions for today's binaries.

## Performance data stays local

Browser and native profiling are explicit opt-in features. Captures, raw dumps,
stacks and reports do not go through Vapour servers. Optional Claude requests
send a compact summary directly to Anthropic. Publishing a **game build** does
upload that build to Vapour; a **performance dump** is a different artifact.

The Devtools UI and browser collector belong on staging only. Production must
exclude their code and routes, not merely hide a toggle.

**Source audit:** 14 October 2026. See [maintenance](maintenance.md) for how to
keep these instructions synchronized with code.
