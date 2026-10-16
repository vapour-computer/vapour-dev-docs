# Troubleshooting

Start by recording the component revision, target environment and exact command.
Do not include PATs, Claude keys, complete credential files or replayed key inputs
in a bug report.

## CLI and publishing

Every CLI error ends with this support line:

```text
Need help? https://vapour-dev-docs.pages.dev/
```

Use that canonical handbook address to find the current workflow and limits.

| Symptom | Check and next action |
| --- | --- |
| Repository has no expected CLI commands | Read [status](status.md); implemented source may not be on public main yet |
| `vapour` not found after Go install | Build the source explicitly with `-o .../vapour` and put that directory on PATH |
| 401 / token check failed | API environment, PAT spelling/revocation, and whether `VAPOUR_TOKEN` overrides your saved login |
| 403 | Developer role, publishing scope, and ownership of the selected project ID |
| 409 creating a project | Slug collision; inspect existing projects before making another |
| No `vapour.toml` | Change to the game root or use `publish --dir` |
| No `index.html` | Export for Web and correct `build.dir`; don't upload a desktop build |
| Native binaries or symlinks rejected | Use the generated browser output with regular packaged files |
| 413 | ZIP size, extracted size, entry count or cover limit |
| Dry run succeeds but upload fails | Server validation, auth/ownership and network are separate from local packing |
| Logout appears ineffective | Unset `VAPOUR_TOKEN`; local logout is not server revocation |

## Hosted game

| Symptom | Check and next action |
| --- | --- |
| Wasm fails to load | Actual asset URL, response code, `application/wasm` MIME and compression handling |
| Unity compressed export fails | Matching encoding headers or a compatible decompression fallback |
| Assets load at site root instead of game path | Relative bundler/public asset base and generated loader paths |
| SharedArrayBuffer unavailable | `crossOriginIsolated` in the game frame and all relevant resource/worker headers |
| Play URL points to Storage emulator `/play` | Configure the reachable API serving origin; current local defaults are not a complete hosted-player URL setup |
| Newly uploaded content looks stale | Compare versioned asset URLs and cache behavior before republishing repeatedly |
| Blank game despite accepted ZIP | An upload validates packaging, not browser/engine runtime compatibility |
| Phone controls do nothing | Open the play page source/network tab and confirm it loads `/__vapour/runtime.js`; without runtime injection, controls and quit hooks are inactive |
| Stick movement stutters or gets missed | Keep the stick past ~50% deflection so it stays held; release happens with hysteresis below ~35%, with a 50 ms minimum press to reach at least one game frame |
| Can't open menu on phone | Add a controller `menu` button mapped to `Escape`, and ensure the game binds `Escape` to pause/settings |
| "Click to play" covers the game on phone | The prompt should not appear on touch-only devices; if it does, check pointer detection/runtime version and remove forced mouse-capture on touch |

## Browser telemetry

| Symptom | Check and next action |
| --- | --- |
| No toggle or automatic metrics in the live player | Expected: live wiring is disabled pending owner grants and loader memory hooks |
| Staging artifact build rejected | All required flags, exact staging project and exact HTTPS game origin |
| Start returns null | Toggle off, non-owner, expired/invalid grant, origin mismatch, production build or a stopped/used document |
| Dashboard gets no BroadcastChannel messages | The game and dashboard may be cross-origin; a validated bridge is still needed |
| Wasm memory unavailable | Pass the actual iframe's memory accessor; don't guess engine globals |
| Functions unavailable | JS Self-Profiling support, authorized staging policy header and explicit opt-in |
| Frame history is shorter than TTL | Bounded ring overwrote old high-refresh frames; inspect drop counts |
| Dump after off fails | Off released the buffers; export before stopping |
| Claude analysis stays offline | No stored key, explicit offline option, rejected key, rate limit or network/response failure |
| Storage key removal fails | Browser storage access is blocked; clear that origin's site data through browser settings |

## Native profiler

| Symptom | Check and next action |
| --- | --- |
| `on`, `live` or `analyze` missing | Current native binary is `probe-test` only |
| Nothing listening on 6767 | Start `vapour-profiler dashboard` from the implemented checkout; no listener exists before explicit launch |
| Dashboard is locked after reload | Open the original full terminal URL with its `#token=...` fragment |
| Keyring save fails | Install `secret-tool` and unlock Secret Service; environment keys are an alternative |
| Native dashboard has no FPS/flamegraph | Current live mode collects CPU/RSS/PSS only; those views require recorded frames/stacks in an imported trace |
| clang/BPF compilation failure | BPF-capable clang, UAPI headers, libelf/zlib and `CLANG` selection |
| Kernel BTF missing | `/sys/kernel/btf/vmlinux` and a supported BTF-enabled kernel |
| Permission denied | Explicit session/test authorization and kernel security policy; don't run builds as root |
| Uprobe symbol lookup failure | Correct target executable, unstripped/available symbol and matching PID |
| Apparent bpftool residual maps | Use the provided two-scan test; bpftool creates temporary inspection objects itself |
