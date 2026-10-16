# Game publishing from CI

**Availability: source-preview action/templates.** The `vapour-ci` implementation
and its `v1` tag were not published at the audit; no CLI release was listed.
Configure the following workflow only after a real action revision and CLI release
are available. `@v1` in an old template is not evidence that the tag exists.

## Build → validate → publish

1. Check out the game and its `vapour.toml`.
2. Install the exact engine/toolchain and export templates required by the game.
3. Export into the manifest's build directory.
4. Preserve the web ZIP/build artifact for diagnosis or rollback.
5. Run the publishing action with a CI PAT and explicit target API.
6. Verify the published game URL and record the version/source revision.

Store `VAPOUR_TOKEN` as a GitHub repository or environment secret. Use separate
tokens for separate environments or automation identities. A token is not a
workflow file value to commit.

## Action inputs

| Input | Meaning |
| --- | --- |
| `token` | Required publishing PAT, supplied from secrets |
| `dir` | Game directory containing `vapour.toml`; default `.` |
| `version` | Required publication version (usually tag name without leading `v`) |
| `notes` | Required release notes text |
| `notes-file` | Optional release notes file path (alternative to `notes`) |
| `api` | API base URL; specify it for staging |
| `dry-run` | `true` validates/packs without uploading |

Example step template; replace the action reference and release tag before use:

```yaml
- uses: vapour-computer/vapour-ci@REPLACE_WITH_PUBLISHED_COMMIT
  with:
    token: ${{ secrets.VAPOUR_TOKEN }}
    api: ${{ vars.VAPOUR_API }}
    dir: .
    version: ${{ steps.version.outputs.value }}
    notes: "Release ${{ github.ref_name }}"
```

With a tag trigger, strip the leading `v` first:

```yaml
- name: Resolve publish version
  id: version
  run: echo "value=${GITHUB_REF_NAME#v}" >> "$GITHUB_OUTPUT"
```

Pin the action commit and CLI version for reproducibility. The source action
downloads the CLI archive and verifies `checksums.txt`; it does not implement
the native profiler's planned signature-verification installer. It supports
Linux/macOS runners on x64/arm64; the CLI release configuration also targets
Windows, but that does not make this installer support Windows runners.

## Engine steps

- **Godot:** install matching export templates, then run the headless `Web` export.
- **Unity:** use the project's matching GameCI/Unity setup and licensed runner;
  inspect the real WebGL output path before copying it to `build/web`.
- **Bevy:** install the Wasm target and pinned Trunk, then build with relative
  public URLs into `build/web`.

Use a dry-run job on ordinary changes and an intentional publish trigger for
releases. A version tag such as `v0.2.0` is accepted by the current manifest's
version pattern; choose one convention rather than silently changing identifiers.

For failed uploads, retain the engine build output and inspect the API error code.
Do not print the token or all environment variables while debugging.
