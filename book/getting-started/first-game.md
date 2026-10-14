# First game: build to publish

**Availability: source-preview publishing workflow.** Use an implemented CLI
checkout and an API environment supplied by the platform maintainer. No public
release or live endpoint is assumed; see [status](../status.md).

## 1. Install and choose the API

Follow [installation](prerequisites.md), then set the intended API explicitly:

```sh
export VAPOUR_API="https://YOUR-STAGING-API"
vapour --help
```

Use `http://localhost:8080` for the local API instead. Tokens belong to their
issuing environment; do not reuse a staging token against a different project.

## 2. Sign in as a developer and create a token

The integrated dashboard's developer sign-in flow creates a developer account.
Create a `publish` token from its token settings, or use the authenticated token
API in [Vapour tokens](../auth/tokens.md).

In Bash, read it without placing the literal token in shell history:

```sh
read -r -s -p "Vapour token: " token
printf '\n'
printf '%s\n' "$token" | vapour login --token -
unset token
vapour whoami
```

## 3. Create and export

```sh
vapour create "My Game" --engine godot
cd my-game
```

The current CLI scaffold supplies a README and manifest, not a complete engine
project. Create the actual game in that directory with your engine, or use
`--from` to import an existing game. Export for Web into `build/web/`. Follow the
[Godot](../games/godot.md), [Unity](../games/unity.md) or [Bevy](../games/bevy.md)
guide. A valid web bundle includes `index.html` and all its referenced assets.
Creating a project does not compile the game for you.

## 4. Validate locally

```sh
vapour publish --dry-run
```

Expected: the CLI prints the packed size and `Dry run: nothing uploaded.` A dry
run does not register an offline project or need a PAT. It is not a browser
playability test or a substitute for the server's ZIP validation.

## 5. Publish and play

```sh
vapour publish
```

Expected: `Published ...` and a `/games/<slug>` URL. Open it, launch the player,
and verify asset loading, input and audio. Keep the exported ZIP if you need to
reproduce the release later.

For the next release:

```sh
vapour publish --version 0.2.0
```

See [publishing](../games/publish.md) for verification and recovery. Performance
capture is a separate opt-in process; it is not activated by publishing a game.
