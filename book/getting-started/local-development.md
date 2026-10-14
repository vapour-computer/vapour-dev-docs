# Local development

**Availability: source preview.** The API and integrated web commands require
the implemented maintainer checkouts listed in [status](../status.md).

Use sibling directories so existing scripts can find each other:

```text
workspace/
  vapour/                 # integrated web checkout
  vapour-cli/
  vapour-infra/
  vapour-docs/             # sample game used by the e2e script
  vapour-profiler/
```

## 1. Start API and Firebase emulators

From `vapour-infra`:

```sh
docker compose up --build
```

In another terminal:

```sh
curl --fail http://localhost:8080/healthz
curl --fail http://localhost:8080/home
```

The stack contains emulators, a seed job and the API. Host ports are 8080 for the
API, 9099 for Auth and 9199 for Storage. Firestore listens on 8081 **inside the
Compose network** and is not exposed as a host port by the current file.

## 2. Run the integrated web checkout

From its `apps/web` directory:

```sh
npm ci
VAPOUR_API_URL=http://localhost:8080 \
PUBLIC_API_URL=http://localhost:8080 \
FIREBASE_API_KEY=fake \
FIREBASE_AUTH_DOMAIN=localhost \
FIREBASE_PROJECT_ID=vapour-local \
FIREBASE_AUTH_EMULATOR_URL=http://localhost:9099 \
npm run dev
```

Open `http://localhost:3000`. These variables belong to the integrated web
source preview; the public browser-telemetry feature branch is not a substitute
for that integration. Local mode does not enable browser telemetry's staging
build gate.

## 3. Exercise create/publish without cloud resources

From `vapour-infra`:

```sh
NO_UP=1 KEEP=1 scripts/e2e-local.sh
```

The script creates an emulator developer session, issues a PAT, builds the CLI
in a temporary directory, creates a game, uploads an export, checks catalog
visibility and revokes the PAT. It uses an isolated CLI config directory.

Set `GODOT_BIN` to an executable Godot path for a real game export. Without a
usable binary, the script uses a placeholder web fixture; passing that run is
not proof that a real game renders. `CLI_DIR` and `SAMPLE_DIR` override sibling
locations. Run it only against the intended local emulators.

## 4. Stop or reset

```sh
docker compose down
```

To also remove Compose volumes, use `docker compose down -v`; this is a local
data reset. The e2e script also tears down the stack it starts unless `KEEP=1`.

For a published game's missing play assets, inspect `PUBLIC_BASE_URL`: it must
point to a reachable API that serves `/play`. The current Compose default uses
9199 for the Storage emulator, so do not assume that its generated `/play` URLs
are a complete player-serving configuration. See [troubleshooting](../troubleshooting.md).
