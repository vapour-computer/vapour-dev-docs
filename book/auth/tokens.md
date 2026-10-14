# Vapour tokens

**Availability: source-preview API and CLI.** These are publishing credentials,
not Claude keys and not future local-agent session tokens.

## Credential types

| Credential | Used by | Destination/storage |
| --- | --- | --- |
| Firebase ID token | Dashboard session and PAT management | Sent to the selected Vapour API for authentication |
| `vpr_...` personal access token | Publishing CLI and CI | Sent to Vapour API; CLI saves it locally; backend stores a hash |
| Local-agent session token | Planned localhost UI connection | Local agent only; not a publishing credential |
| Claude API key | Optional performance analysis | Direct Anthropic request; never a Vapour backend request |

## Create a PAT

Use the integrated dashboard's token settings, or call `POST /tokens` with a
Firebase ID token belonging to a developer. Example request body:

```json
{ "name": "work-laptop", "scopes": ["publish"] }
```

The response includes an ID and the raw `vpr_` token **once**. The backend stores
its SHA-256 hash, not the raw secret. `GET /tokens` returns IDs, names, scopes,
creation dates and revocation status, never the secret. Save the token in your
local CLI config or a CI secret, not in `vapour.toml`.

## Save and verify locally

```sh
read -r -s -p "Vapour token: " token
printf '\n'
printf '%s\n' "$token" | vapour login --token -
unset token
vapour whoami
```

`login` normally verifies the token with `GET /me` before saving it. `--no-verify`
only skips that check; it does not create a valid token or change server permissions.

The file is `$XDG_CONFIG_HOME/vapour/credentials`, or
`~/.config/vapour/credentials` when XDG is unset. The CLI uses mode 0600 for the
file and 0700 when creating the directory. This is a plaintext credential file,
not the local dashboard's OS keyring.

## Override for CI

`VAPOUR_TOKEN` takes precedence over the saved token. Store it as a repository
or environment secret and pass it only to the publish step. Select `VAPOUR_API`
explicitly for staging. Do not print environment variables or enable shell
tracing around the publishing step.

## Revoke and rotate

1. Create a replacement token with a descriptive name.
2. Update the consuming machine or CI secret; confirm `whoami` and a dry run.
3. Revoke the old token using `DELETE /tokens/:id` with the owner's Firebase ID token.
4. Verify that the old token receives 401 on its next authenticated request.

`vapour logout` removes the saved local file. It does **not** revoke the token on
the server, and it does not clear an exported `VAPOUR_TOKEN`; use `unset
VAPOUR_TOKEN` separately. Revocation, local deletion and CI-secret deletion are
distinct actions.

For authentication errors, see [troubleshooting](../troubleshooting.md).
