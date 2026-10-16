# Prerequisites and installation

Choose the tools for the workflow you need. Browser profiling does not require
installing the native profiler.

| Workflow | Requirements |
| --- | --- |
| Build/use the publishing CLI source preview | Go 1.24+, Git, implemented CLI checkout |
| Export a game | Your engine plus its matching Web export tools/templates |
| Work on the web app/browser package | Node.js 24+ for the new scripts, npm, Git |
| Build native profiler | Linux x86_64, Rust stable, clang BPF target, C compiler, pkg-config, libelf/zlib development files |
| Run native BPF proof | Linux 5.15+, kernel BTF, bpftool and explicitly authorized BPF/perf privileges |

## Publishing CLI from an implemented checkout

The source preview is not yet a public release; see [availability](../status.md).
From the supplied `vapour-cli` directory:

```sh
go test ./...
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/vapour" .
export PATH="$HOME/.local/bin:$PATH"
vapour --help
```

Building with `-o .../vapour` gives the documented executable name. Do not assume
that `go install .../vapour-cli@latest` installs an executable named `vapour` or
contains unpublished commands. Once releases exist, use their platform-specific
archive and published checksum.

## Install and update from releases

Install the latest published CLI release on macOS/Linux:

```sh
curl -fsSL https://raw.githubusercontent.com/vapour-computer/vapour-cli/main/install.sh | sh
```

The installer verifies checksums and writes `vapour` to `/usr/local/bin` or
`~/.local/bin`. Pin a release with `VAPOUR_VERSION=vX.Y.Z` or choose install
directory with `VAPOUR_INSTALL_DIR`.

To update an existing installation:

```sh
vapour update
vapour update --check
```

Outside CI, the CLI checks for new releases at most once per 24 hours and prints
an update notice. Set `VAPOUR_NO_UPDATE_CHECK=1` to disable that check.

## Browser package checkout

```sh
git clone --branch feat/browser-telemetry https://github.com/vapour-computer/vapour.git vapour-browser
cd vapour-browser/apps/web
npm ci
npm run typecheck:browser-telemetry
npm run test:browser-telemetry
```

This branch contains the collector package and guard checks. It does not contain
the maintainer's unpublished web-auth/Docker integration, and it does not activate
telemetry on page load.

## Native build dependencies

Arch Linux:

```sh
sudo pacman -S --needed base-devel clang libelf zlib bpf
```

Debian/Ubuntu package names vary by release; install a BPF-capable clang,
`build-essential`, `pkg-config`, `libelf-dev`, `zlib1g-dev`, Linux UAPI headers and
bpftool. Build as your normal user. Privileged capture is a separate action.

Continue with [native profiling](../telemetry/native.md).
