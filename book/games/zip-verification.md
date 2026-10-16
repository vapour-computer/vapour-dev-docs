# .zip verification

**Availability: implemented on CLI main; check your installed release and server.**
These commands may not be present in older CLI releases. A compatible API is
required for server verification.

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
4. **Local verification.** `publish` verifies the signed, exact ZIP bytes before
   uploading. This is the same local signature and hash check as `vapour verify`.
5. **Upload gate.** The server requires the attestation as part of the publish
   request. It independently checks the signature, registered developer key,
   SHA-256 and ZIP size **before storing any build or version**. Missing
   attestations return HTTP 400 `verification_required`; forged, mismatched or
   wrong-key attestations return HTTP 400 `verification_failed`. Malformed JSON,
   duplicate or oversized attestations return HTTP 400 `invalid_upload`.
6. **Background scan.** After accepting a verified upload, the server scans the
   ZIP independently. It records a verification status
   for the version: `pending` while the check is queued, then `verified`
   or `rejected`.
6. **Verify later.** Anyone with the zip and the attestation can check them
   offline. With `--remote`, the CLI also compares the hash with the one the
   server recorded for that version and shows the server status.
7. **Dashboard.** The "Your games" list shows a **.zip verification** column
   beside a review badge. See [Review and approval](review-and-approval.md).

Each version records a verification status: `pending`, `verified`, `rejected`
or `unverified`.

| Status | Meaning |
| --- | --- |
| `pending` | The zip check is queued or running |
| `verified` | Signature valid, SHA-256 and size match the bytes the server received, and the server's own scan passed |
| `rejected` | Signature, hash, size or the server's scan failed. The version is taken offline automatically and can never be approved. Fix the problem and publish a new version. |
| `unverified` | Historical uploads without an attestation, or a verification queue failure; new unsigned ZIP uploads are rejected |

Rejection reasons you can see on the dashboard: `bad_signature`,
`hash_mismatch`, `size_mismatch`, `bad_key_id`, `bad_key`,
`unsupported_version`, `unknown_key`, `bad_attestation`, or any scan code.

`unknown_key` means the signature was valid but the key was not yours: the
first valid key a developer account uses is remembered, and a zip signed by a
different key on the same account is rejected. If you lose your signing key,
ask the platform team to reset the remembered key.

## What the scan checks

| Code | Severity | Meaning | How to fix |
| --- | --- | --- | --- |
| `too_many_entries` | error | Over 5,000 files in the archive. | Reduce file count; pack data into fewer files. |
| `zip_bomb_total` | error | Over 1 GiB unpacked in total. | Shrink the build; see [large-game delivery](large-games.md). |
| `file_too_large` | error | One file unpacks to over 512 MiB. | Split or compress the large file. |
| `zip_bomb_ratio` | error | A file of 1 MiB or more unpacks to more than 200 times its packed size. | Re-export the asset so packed and unpacked sizes are closer. |
| `size_mismatch` | error | An entry header lies about its true size. | Re-zip the build with a current zip tool. |
| `nested_archive` | warn | A `.zip`, `.7z`, `.rar`, `.tar` or `.tgz` inside the build. Nested archives are never expanded. | Ship the files directly instead of an archive inside the build. |
| `empty_archive` | error | The zip contains no files. | Re-export the build; check `build.dir`. |
| `not_a_zip` | error | The path is not a valid zip file. | Point `publish` or `scan` at a real `.zip` or folder. |
| `path_traversal` | error | A path contains `..`, an absolute path, a drive letter, backslashes, or control characters. | Re-zip with a tool that writes clean relative paths. |
| `path_too_long` | error | A path is over 240 characters. | Shorten folder and file names. |
| `path_too_deep` | error | A path is over 20 folders deep. | Flatten the build output. |
| `duplicate_path` | error | Two names are equal ignoring letter case or extra slashes. | Rename so every path differs without ignoring case or slashes. |
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
Scanned 143 files (12.4 MiB packed, 40.1 MiB unpacked)
  error native_extension [win/redist/msvcp140.dll]: File has a ".dll" extension, which does not belong in a web bundle.
  warn  nested_archive [cutscenes.tgz]: Entry looks like a nested archive; publish bundles should contain flat web files.
error: build rejected: 1 problem(s) found in the zip. Nothing was uploaded and no version number was used. Fix them and publish again (see the docs: games/zip-verification)
```

`scan` checks only. It does not write an attestation; only `vapour publish`
writes `.vapour/build.zip.attestation.json`.

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
with `--version <semver>` it compares the server's recorded SHA-256 and status
for that version. Exit status is 1 on any mismatch, bad signature, or server
status other than `verified`. Example output:

```text
$ vapour verify my-game.zip
OK: signature valid, SHA-256 9d1e…aa7b matches (key 6f0b1c2d3e4f5a6b, scan pass)
```

```text
$ vapour verify my-game.zip --remote --version 0.2.0
OK: signature valid, SHA-256 9d1e…aa7b matches (key 6f0b1c2d3e4f5a6b, scan pass)
OK: the server recorded the same hash and marked the version verified
```

When the server status is not `verified`, `--remote` prints the status and
exits with status 1, for example `the server marked version 0.2.0 as
"pending"`, `as "rejected"` or `as "unverified"`. When the hash differs it
prints `the server recorded SHA-256 … for version …, but your zip is …`.

### vapour publish

`publish` runs the scan, signing and local verification automatically. There is no flag to skip the
scan. `--dry-run` scans and signs but uploads nothing; it writes the attestation
exactly like a real publish:

```text
vapour publish --dry-run --version 0.2.0 --notes "Dry run"
```

If the scan reports errors, publish stops before authentication and no version
number is used. After the upload, publish prints that server verification is
pending and tells you to run `vapour verify --remote --version <v> <zip>` to
see the result. The new version is not live until an admin approves it; see
[Review and approval](review-and-approval.md).

`--experimental-chunks` remains available for a local dry run, but real chunk
uploads are blocked until they can supply an attestation. Use ZIP publishing.
See [Publish and verify a build](publish.md) for the rest of the flow.

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
- **Lost:** do not just re-create it. The first valid key a developer account
  uses is remembered and a zip signed by a different key is rejected with
  `unknown_key`. Ask the platform team to reset the remembered key.
- **Leaked:** tell the platform team.

## Dashboard

The developer dashboard "Your games" list has a **.zip verification** column,
shown beside a review badge. It shows the status and the first 12 characters of
the SHA-256.

| Status | Meaning |
| --- | --- |
| `Verified` | The attestation signed the upload and the server check passed |
| `Rejected` | The server check failed; the version is taken offline automatically |
| `Unverified` | Legacy version or verification queue failure; not a valid new unsigned ZIP upload |
| `Pending` | The server check is queued or running |

The zip check is not the whole story: every version still waits for an admin
review before it is playable. See [Review and approval](review-and-approval.md).

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `zip_bomb_ratio` on a large texture pack | Very repetitive data can pack more than 200 to 1. Convert large uniform images or audio to a compressed format (WebP, Ogg) before export. |
| `native_executable` on a renamed file | A native program renamed to `.png` is still detected by content. Remove it; detection is by header, not name. |
| `verify` says hash mismatch | You are checking a different or modified zip than the attestation covers. Re-run `vapour publish --dry-run` to write a fresh attestation for the current build, or re-publish. |
| `duplicate_path` that you cannot see | Two names are equal ignoring letter case or extra slashes, such as `Assets/Hit.png` and `assets/hit.png`. This is harmless on Windows or macOS but breaks the archive check; rename one of them. |
| Attestation missing | Only `vapour publish` writes the attestation, including `--dry-run`. `vapour scan` does not write one; run `vapour publish --dry-run` to get the attestation for the current build. |
| `unknown_key` after a publish with your usual key | The signature was valid but the key is not the one remembered for your developer account, for example after switching machines. Ask the platform team to reset the remembered key. |
| Publish accepted, but the dashboard says `Rejected` | The server verifies the zip after the upload, not during it. The version was taken offline automatically and can never be approved. Fix the problem shown in the reason and publish a new version. |

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
