# Releases and rollback

Version the game, CLI, collector/spec and platform independently. A source commit,
an uploaded game version, a GitHub release and a deployed revision are not the
same event.

## Game releases

Use a stable project ID and a deliberate version in `vapour.toml` or `--version`.
Retain the exact exported ZIP, engine/toolchain version, source revision and
publication result. To restore a known-good game, publish the retained export
again under that project; the current API has no documented “select old version”
operation. Unpublish hides a game without deleting its project/files; deletion
removes the stored game data.

## Go CLI releases: source-preview pipeline

The `.goreleaser.yaml` builds `vapour` for Linux, macOS and Windows on amd64/arm64
with `CGO_ENABLED=0`. Unix archives are `.tar.gz`; Windows uses `.zip`. Archive
names follow `vapour_<version>_<os>_<arch>`, with SHA-256 checksums in
`checksums.txt`. The version is embedded through linker flags.

No CLI release was listed during the source audit. Publish and verify real
release artifacts before enabling an action that downloads them. Check the
downloaded platform/architecture and checksum rather than executing an unchecked file.

## Native profiler releases: planned

The intended standalone distribution is signed GitHub Releases plus published
Cargo packages. SHA-256 and minisign/cosign verification, the embedded CLI public
key, lazy installation cache and previous-version rollback are not implemented.
The current crates are marked unpublished; `cargo install vapour-profiler` is
not a supported installation claim yet.

The planned Vapour cache location is
`~/.local/share/vapour/tools/vapour-profiler-<version>`. The future installer will
retain a previous version and refuse checksum/signature mismatches. Do not build
a dashboard flow that silently installs arbitrary latest binaries in the meantime.

## Platform revisions

The source deploy script tags API and web images from their own repository
revisions. Record the environment, API image, web image and Terraform state
associated with a rollout. Roll back with a deliberate, reviewed image/config
change for that environment; there is no documented one-command rollback script.

Do not use a staging collector artifact as a production rollback image. The
production exclusion gate applies to every deployed revision, including rollbacks.

## Trace schema compatibility

The browser package pins `.vpt` v1 to an immutable profiler commit and hash.
Update that pin intentionally when the contract changes and rerun producer/schema
tests. A new collector version must not silently reinterpret an existing trace
version. Native analyzer support must be demonstrated independently when it lands.
