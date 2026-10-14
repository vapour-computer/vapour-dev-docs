# Native profiler: current workflow

**Availability: published BPF lifecycle proof, plus a local dashboard in the
maintainer checkout.** This page covers `probe-test`. See [dashboard usage](dashboard.md)
for process CPU/RSS/PSS capture and saved-dump analysis. The standalone
`on/live/dump/analyze` command family remains pending.

## Build

On Linux x86_64 with the [required dependencies](../getting-started/prerequisites.md):

```sh
git clone https://github.com/vapour-computer/vapour-profiler.git
cd vapour-profiler
cargo build --locked --workspace
cc -O0 -g -Wall -Wextra -Werror -o target/probe-target tests/fixtures/probe-target.c
target/debug/vapour-profiler --help
```

`libbpf-cargo` compiles the C program and generates an embedded skeleton at build
time. Runtime capture does not download or compile BPF. Kernel BTF is expected
at `/sys/kernel/btf/vmlinux`; supported initial target is Linux 5.15+.

The workspace contains `vp-bpf`, `vp-agent`, `vp-adapters`, `vp-analyze` and the
`vp-cli` directory housing the `vapour-profiler` binary. Adapters remain pending;
the new analyzer validates traces and generates dashboard reports. Userspace is
MIT/Apache-2.0; BPF C is GPL-2.0-only.

## Run the actual lifecycle test

Build unprivileged first, then explicitly authorize the test harness:

```sh
sudo python3 tests/bpf_lifecycle.py
```

It starts its own fixture targets, proves positive uprobe hits and inspects
program/map/link IDs with bpftool before, during and after capture. Cases include
TTL, SIGINT, SIGTERM, target exit, SIGKILL and attachment failure. It also checks
that capture processes exit and have no sockets. Evidence is written to
`target/bpf-lifecycle.json`.

The harness scans twice after exit because bpftool can create temporary iterator
maps itself. Stable new IDs indicate a leak. Run on a quiet host so unrelated
BPF activity does not create a false failure.

## Attach to the fixture manually

```sh
target/probe-target &
game_pid=$!
target/debug/vapour-profiler probe-test \
  --pid "$game_pid" \
  --binary "$PWD/target/probe-target" \
  --symbol vp_test_frame \
  --ttl 10
kill "$game_pid"
```

The attach command requires capture privileges. Without them it fails with an
explanation; the production per-session privilege flow is still pending. The
manual command is for an already-authorized capture context. Do not make the
binary setuid or run the build as root.

`probe-test` requires a positive PID and its actual executable; system-wide PID
selection is forbidden. It counts calls to that one symbol. It does not report
real FPS, RSS, CPU stacks, traces or overhead percentages yet. Its default TTL
is 30 seconds, capped at 300.

See the repository's `docs/verification.md`: the final timing correction still
needs its privileged rerun. Full metrics/adapters and `cargo install` distribution
remain [planned](../status.md).
