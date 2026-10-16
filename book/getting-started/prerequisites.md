# Prerequisites and installation

Choose the tools for the workflow you need. Browser profiling does not require
installing the native profiler.

| Workflow | Requirements |
| --- | --- |
| Use the publishing CLI | macOS, Linux or Windows. Go 1.26+ only for `go install` |
| Export a game | Your engine plus its matching Web export tools/templates |
| Work on the web app/browser package | Node.js 24+ for the new scripts, npm, Git |
| Build native profiler | Linux x86_64, Rust stable, clang BPF target, C compiler, pkg-config, libelf/zlib development files |
| Run native BPF proof | Linux 5.15+, kernel BTF, bpftool and explicitly authorized BPF/perf privileges |

## Install the Vapour CLI

Install the released CLI. You do not need to clone or build the repository.

### Option 1: install script (macOS and Linux)

```sh
curl -fsSL https://raw.githubusercontent.com/vapour-computer/vapour-cli/main/install.sh | sh
vapour --version
```

The script supports amd64 and arm64. It downloads the latest release from GitHub,
verifies its checksum and installs `vapour` to `/usr/local/bin`, or to `~/.local/bin`
when `/usr/local/bin` is not writable. Make sure that directory is on your `PATH`.

| Variable | Effect |
| --- | --- |
| `VAPOUR_VERSION=vX.Y.Z` | Install a specific release instead of the latest |
| `VAPOUR_INSTALL_DIR=/path` | Install into this directory |

```sh
curl -fsSL https://raw.githubusercontent.com/vapour-computer/vapour-cli/main/install.sh | VAPOUR_VERSION=v0.1.1 sh
```

### Option 2: `go install`

Needs Go 1.26 or newer.

```sh
go install github.com/vapour-computer/vapour-cli@latest
```

Go names the executable after the module, so this installs **`vapour-cli`**, not
`vapour`, into `$(go env GOPATH)/bin` (usually `~/go/bin`). Add that directory to
your `PATH`, then add the short name the guides use:

```sh
export PATH="$(go env GOPATH)/bin:$PATH"
ln -sf "$(go env GOPATH)/bin/vapour-cli" "$(go env GOPATH)/bin/vapour"
vapour --version
```

A `go install` build reports its version as `dev`. Use the install script or a
release archive if you need a release number in `vapour --version`.

### Option 3: release archive (including Windows)

Download the archive for your system from the
[releases page](https://github.com/vapour-computer/vapour-cli/releases). Archives
exist for macOS, Linux and Windows on amd64 and arm64, with a `checksums.txt` file.
Verify the checksum, unpack the archive and put `vapour` on your `PATH`.

### Update

```sh
vapour update            # install the latest release over the running binary
vapour update --check    # only report whether a newer release exists
vapour update --version v0.1.1
```

`vapour update` verifies the checksum and is not available on Windows. Outside CI,
the CLI checks for a new release at most once every 24 hours and prints
`vapour X.Y.Z is available (you have A.B.C). Run: vapour update`. Set
`VAPOUR_NO_UPDATE_CHECK=1` to turn that check off.

### Uninstall

First locate the executable so you remove the copy you installed, not another
program with the same name:

```sh
command -v vapour
command -v vapour-cli  # only if you used go install
```

If you used the install script, remove `vapour` from the directory it printed
when installing. By default that is `/usr/local/bin` (may need `sudo`) or
`~/.local/bin`; if you set `VAPOUR_INSTALL_DIR`, use that directory instead.
For example, after confirming `command -v vapour` says `/usr/local/bin/vapour`:

```sh
sudo rm /usr/local/bin/vapour
```

If you used the `go install` commands above, remove both the `vapour-cli`
executable and the `vapour` symlink you created. They are in
`$(go env GOPATH)/bin` by default; if you set `GOBIN`, use that directory
instead. Confirm the paths before deleting them:

```sh
rm "$(go env GOPATH)/bin/vapour" "$(go env GOPATH)/bin/vapour-cli"
```

For a manually unpacked release (including Windows), delete the `vapour`
executable from the directory where you placed it. On Windows, use
`Get-Command vapour` in PowerShell to find `vapour.exe`, then delete that file.
Remove any `PATH` entry or shell completion setup you added yourself.
Check for another copy afterward with `command -v vapour` (or
`Get-Command vapour` on Windows).

Uninstalling the executable does **not** delete saved credentials or the
`vapour llm` cache. If you also want to remove local CLI data, run
`vapour logout` **before** deleting the executable, or delete only the saved
credentials file at `${XDG_CONFIG_HOME:-$HOME/.config}/vapour/credentials`
on Linux (the equivalent user config directory on macOS or Windows).
The optional cache lives in the user cache directory under `vapour/`.
Deleting either does not revoke a token: revoke it in your
[developer dashboard](../auth/tokens.md) if it must stop working.

### Check it works

```sh
vapour --help
vapour login --token YOUR_TOKEN
vapour whoami
```

Create the token in your [developer dashboard](../auth/tokens.md). See the
[CLI command reference](../reference/cli.md) for every command.

### Missing commands? You have an old build

`vapour --help` in v0.1.1 lists `build`, `completion`, `controller`, `create`, `llm`,
`login`, `logout`, `perf`, `publish`, `store`, `template`, `test`, `update` and
`whoami`. If `llm`, `test`, `perf`, `template`, `controller` or `update` are missing,
you have the older v0.1.0 binary. Reinstall and check the version:

```sh
go install github.com/vapour-computer/vapour-cli@v0.1.1
# or: the curl install script above
```

Some old binaries cannot run `vapour update`, so reinstall instead.

### Print the guide for an AI assistant

`vapour llm` prints the whole curated Vapour developer guide (the same text as
[`llm.txt`](https://vapour-dev-docs.pages.dev/llm.txt)) to standard output. Pipe it
into your assistant, a file or your clipboard:

```sh
vapour llm                      # print the guide
vapour llm > vapour-guide.md    # save it
vapour llm --refresh            # fetch the newest copy
vapour llm --offline            # use the cache or the copy built into the CLI
```

It works without logging in. See [Use this handbook with an AI assistant](../reference/ai-assistants.md).

Optional shell completion (`bash`, `zsh`, `fish` or `powershell`):

```sh
vapour completion zsh --help
```

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
