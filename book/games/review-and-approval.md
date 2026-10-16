# Review and approval

**Availability: planned.** This needs the matching platform release.

Every version of every game on Vapour is approved by an admin before it appears
on the store or can be played. This includes every new version of a game that
is already live. The zip check (see [.zip verification](zip-verification.md))
is only the first step; approval is the second.

## How a version goes live

```text
publish → zip check (pending → verified or rejected) → admin review (pending → approved or rejected) → live
```

- While a new version waits for review, players keep playing the previous
  approved version of the game.
- A first version stays hidden until it is approved.
- Versions published before this rule keep their approved state.

## What you see on the dashboard

| Status | What it means | What you do |
| --- | --- | --- |
| `Pending review` | The version waits for either the zip check or the admin review | Wait; check the zip status on the same dashboard list |
| `Approved` | An admin approved the version | Nothing; the version is live |
| `Rejected` | An admin rejected the version, with a note explaining why | Read the admin's note, fix what it says, publish a new version number |

## What admins check

An admin reviews whether the game:

- plays as described on the store page,
- credits rights and licenses correctly,
- has content that is acceptable and an appropriate age rating,
- has a store page that is accurate.

An admin cannot approve a version whose zip check is `pending` or `rejected`, and cannot skip the admin
review. For an `unverified` version (published without a signed attestation,
for example by an older CLI), an admin must explicitly accept it. That is
slower for you, so always use the latest CLI so the attestation is sent.

Games marked 18+ (the NSFW toggle in the dashboard Edit form) are shown only to
signed-in viewers who are 18 or older. The rating does not change what admins
check; it only changes who can see the game.

## FAQ

| Question | Answer |
| --- | --- |
| How long does review take? | No promise yet. The dashboard page will say when there is a target. |
| Can I withdraw a pending version? | A pending version cannot be edited. Publish the fix under a new version number. |
| Why does my version say `Rejected`? | Read the admin's note on the dashboard, fix what it describes, and publish the fix under a new version number. |
| My zip check is `unverified`. Do I still get reviewed? | Yes, but an admin must explicitly accept the version. Publish again with the latest CLI so the signed attestation is included. |
