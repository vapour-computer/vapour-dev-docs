# Accounts and developer access

**Availability: staging.** Check
[status](../status.md) for source publication and live wiring.

## Account flow

1. Sign in through Firebase/Google in the intended web environment.
2. The application sends the Firebase ID token to `POST /auth/session`.
3. The API creates or updates the account and returns its user/developer records.
4. A developer can create projects and personal access tokens.

The API distinguishes `user` and `dev`. The session request accepts `role: "dev"`
for first-time developer sign-in or upgrading a user to a developer. Do not
implement authorization by hiding UI: project and token operations enforce it
on the backend.

## Verify identity

`GET /me` accepts a Firebase ID token or a Vapour PAT and returns the user,
developer record and whether auth used a token or a session. `vapour whoami`
uses this endpoint. A user's public profile at `GET /users/:uid` does not expose
the private email or role.

`PATCH /me` requires a Firebase ID token. Supported fields are `name`, `avatar`,
`display_name` and `bio`; the latter two require a developer account. A PAT is
not a replacement for the Firebase session when managing account settings.

## Ownership and telemetry

Being a developer is not sufficient to profile somebody else's game through the
staging integration. The trusted backend must verify that the authenticated UID
owns the selected game before it supplies a browser-telemetry grant. That grant
integration remains pending. A caller-constructed JavaScript authorization object
is not proof of ownership.

## Local emulator distinction

The local Auth emulator accepts its test tokens. In the source API, setting
`FIREBASE_AUTH_EMULATOR_HOST` enables emulator authentication behavior. Do not set
emulator variables on a real staging/production service. Real Firebase ID tokens
are checked against Google's signing keys.

Next: [create and manage PATs](tokens.md) or review the
[API reference](../reference/api.md).
