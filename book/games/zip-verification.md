# .zip verification

**Availability: planned for CLI v0.2.** The commands and files on this page are a
design target. The current CLI does not run this scan or write an attestation.

`vapour publish` checks the build zip on your computer before anything is
uploaded, signs it, and the server checks it again. It protects players and the
platform from broken or hostile build archives. It is **static heuristic
analysis, not an antivirus**. It reads the zip without extracting it to disk,
looks at at most the first 4 MiB of each file, and never executes anything. It
cannot prove a build is safe. Minified engine JavaScript is not flagged for
being minified.

## How it works

1. **Pack.** The CLI zips `build.dir`, or takes your prebuilt `.zip`.
2. **Local scan.** The CLI statically analyzes the zip. Findings are `error`
   (upload is cancelled, nothing is sent, no version number is used) or `warn`
   (printed, upload continues).
3. **Hash and sign.** The CLI computes the SHA-256 of the exact zip bytes it
   will upload and writes a signed attestation at
   `.vapour/build.zip.attestation.json`.
4. **Upload.** The attestation is sent with the zip as the `attestation` part
   of the publish request.
5. **Server check.** The server recomputes the hash of the bytes it received,
   verifies the signature, compares the hash, and runs its own scan. On any
   failure the upload is rejected automatically with HTTP 422 and error code
   `zip_verification_failed`. The version number is not used up and the build
   is never made playable.
6. **Verify later.** Anyone with the zip and the attestation can check them
   offline. With `--remote`, the CLI also compares the hash with the one the
   server recorded for that version.
7. **Dashboard.** The "Your games" list shows a **.zip verification** column.

Each version records a verification status: `verified`, `rejected` or
`unverified`. `unverified` means the version was published before this feature,
or without an attestation.

## What the scan checks

| Code | Severity | Meaning | How to fix |
| --- | --- | --- | --- |
| `too_many_entries` | error | Over 5,000 files in the archive. | Reduce file count; pack data into fewer files. |
| `zip_bomb_total` | error | Over 2 GiB unpacked in total. | Shrink the build; see [large-game delivery](large-games.md). |
| `file_too_large` | error | One file unpacks to over 1 GiB. | Split or compress the large file. |
| `zip_bomb_ratio` | error | A file of 1 MiB or more unpacks to more than 200 times its packed size. | Re-export the asset so packed and unpacked sizes are closer. |
| `size_mismatch` | error | An entry header lies about its true size. | Re-zip the build with a current zip tool. |
| `nested_archive` | warn | A `.zip`, `.7z`, `.rar`, `.tar` or `.tgz` inside the build. Nested archives are never expanded. | Ship the files directly instead of an archive inside the build. |
| `empty_archive` | error | The zip contains no files. | Re-export the build; check `build.dir`. |
| `not_a_zip` | error | The path is not a valid zip file. | Point `publish` or `scan` at a real `.zip` or folder. |
| `path_traversal` | error | A path contains `..`, an absolute path, a drive letter, backslashes, or control characters. | Re-zip with a tool that writes clean relative paths. |
| `path_too_long` | error | A path is over 240 characters. | Shorten folder and file names. |
| `path_too_deep` | error | A path is over 20 folders deep. | Flatten the build output. |
| `duplicate_path` | error | Two entries differ only in letter case. | Rename so every path differs in more than case. |
| `symlink` | error | An entry is a symlink, device or pipe. | Export a build with only regular files. |
| `native_executable` | error | ELF, Windows PE or Mach-O program, even when renamed to `.png`. `.wasm` is allowed. | Remove the native binary; web builds ship Wasm, not native programs. |
| `native_extension` | error | An `.exe`, `.dll`, `.so`, `.dylib`, `.msi`, `.scr`, `.bat`, `.cmd`, `.ps1`, `.vbs`, `.jar` or `.apk` file. | Remove the native file from the export. |
| `double_extension` | warn | A name such as `game.png.exe`. | Rename to a single extension. |
| `script_shebang` | warn | A file starts with `#!`. | Remove the shell script or ship its task another way. |
| `test_malware_signature` | error | The EICAR antivirus test string. | Remove the test file; it is never a real game asset. |
| `crypto_miner` | error | Known in-browser miner strings. | Remove the miner code and audit your dependencies. |
| `obfuscated_script` | warn | A script looks obfuscated. | Ship plain engine output; check nothing packed your scripts. |
| `external_script_insecure` | warn | A script loads code from another origin. | Bundle the script with the build. |

## Commands

### vapour scan

Scan without uploading. The path is a `.zip` or a folder; the default is
`build.dir`.

```text
vapour scan                        # scans build.dir
vapour scan ./my-game.zip          # scans a prebuilt zip
vapour scan --dir ./games/my-game  # scans another game directory
vapour scan --json                 # machine-readable findings
```

Exit status is 1 if any error finding exists. Example output:

```text
$ vapour scan ./build/my-game.zip
Scanning my-game.zip (143 entries)...
WARN  nested_archive     cutscenes.tgz (not expanded)
ERROR native_extension  win/redist/msvcp140.dll
1 error, 1 warning. Fix errors before publishing.
```

### vapour verify

Check a zip against its attestation, offline or against the server.

```text
vapour verify <zip>                       # attestation defaults to <zip> with .attestation.json appended
vapour verify <zip> --attestation <file>  # explicit attestation path
vapour verify <zip> --remote              # also compares the hash the server recorded
vapour verify <zip> --remote --dir ./games/my-game --version 0.2.0
vapour verify <zip> --json
```

Without `--attestation`, the CLI looks for `<zip>` with `.attestation.json`
appended, then `.vapour/build.zip.attestation.json`. `--remote` needs a login;
with `--dir` and `--version <semver>` it compares the server's recorded SHA-256
and status for that version. Exit status is 1 on any mismatch or bad signature.
Example output:

```text
$ vapour verify my-game.zip --remote --version 0.2.0
SHA-256 9d1e...aa7b matches attestation and server record
Signature OK (key 6f0b1c2d3e4f5a6b)
Server status: verified
```

### vapour publish

`publish` runs the scan and signing automatically. There is no flag to skip the
scan. `--dry-run` scans and signs but uploads nothing:

```text
vapour publish --dry-run --version 0.2.0 --notes "Dry run"
```

If the scan reports errors, publish stops before authentication and no version
number is used. See [Publish and verify a build](publish.md) for the rest of
the publish flow.

## Attestation file

The CLI writes `.vapour/build.zip.attestation.json` next to the build:

| Field | Meaning |
| --- | --- |
| `version` | Attestation format version, currently `1` |
| `sha256` | SHA-256 of the exact uploaded zip bytes |
| `size` | Zip size in bytes |
| `entries` | File count in the zip |
| `scanner` | Scanner identity, `vapour-zipscan/1` |
| `scan` | Result of `pass` or `warn`, and the `findings` |
| `signed_at` | Signing time in UTC |
| `key_id` | First 16 hex characters of the SHA-256 of the public key |
| `public_key` | ed25519 public key, base64 |
| `signature` | ed25519 signature, base64, over the attestation without the `signature` field, canonical JSON with sorted keys |

## Signing key

The key is created on first use at `~/.config/vapour/signing.key`, mode `0600`,
honoring `XDG_CONFIG_HOME`. It signs every attestation your machine produces.

- Never share it or commit it to a repository.
- **Lost:** delete the file and publish again. A new key is created and
  registered on the next publish.
- **Leaked:** tell the platform team.

## Dashboard

The developer dashboard "Your games" list has a **.zip verification** column.
It shows the status and the first 12 characters of the SHA-256.

| Status | Meaning |
| --- | --- |
| `Verified` | The attestation signed the upload and the server check passed |
| `Rejected` | The server check failed; the version is not playable |
| `Unverified` | Published before this feature, or without an attestation |

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `zip_bomb_ratio` on a large texture pack | Highly compressible data misses 200:1. Re-export with a format that packs better, or split the pack so no single file misses the ratio. |
| `native_executable` on a renamed file | A native program renamed to `.png` is still detected by content. Remove it; detection is by header, not name. |
| `verify` says hash mismatch | You are checking a different or modified zip than the attestation covers. Re-run `scan` to write a fresh attestation, or re-publish. |
| Publish fails with HTTP 422, `zip_verification_failed` | The server check failed. Verify locally with `vapour verify`, rebuild, and publish again under the same plan; the version number was not used. |
| `duplicate_path` that you cannot see | Two files differ only by letter case. This is harmless on Windows or macOS but breaks the archive check; rename one of them. |
| Attestation missing | Run `vapour publish --dry-run` or `vapour scan`; both write the attestation for the current build. |

## Limits and honesty

- The scan is a heuristic. It lowers risk; it does not prove a build is safe.
  It reads at most the first 4 MiB of each file and never executes anything.
- A signature shows who produced the zip and that it was not changed since.
  It says nothing about whether the content is safe.
- The platform scans again. The local scan is not the last word.
- Statuses `verified` and `unverified` say how the archive was checked, not how
  good the game is.

For the upload flow, see [Publish and verify a build](publish.md). For every
flag of the CLI, see the [CLI command reference](../reference/cli.md). For what
a web build must contain, see [Web export requirements](web-export.md).
