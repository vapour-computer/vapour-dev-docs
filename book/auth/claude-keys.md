# Claude keys

Claude is optional. Without a key, browser analysis produces an offline report.
A Claude key is never a Vapour PAT and must never be sent to Vapour's API,
Firestore, analytics, URLs or error reports.

## Browser package: implemented API

The authorized staging loader can use the entry module's key helpers:

```ts
try {
  await telemetry.setBrowserKey(keyInput.value, rememberCheckbox.checked);
} finally {
  keyInput.value = "";
  // Also clear the component's key state immediately.
}
```

Default storage is **sessionStorage** on the game origin. Passing `true` for
remember uses **localStorage**, explicitly opting into persistence. Saving a new
key first removes the old value from both stores. `removeBrowserKey()` clears
both stores. A storage failure is surfaced rather than pretending the key was saved.

The settings UI must explain that scripts on that browser origin can access a
stored key. Do not attach input replay, analytics or exception payloads to the
key field. Browser storage is not an OS keyring.

Use `session.analyze()` to exercise a configured key. The current package has no
separate key-test endpoint or dashboard Test button. 401/403 produces a rejected-key
message, 429 a rate-limit message, and network/invalid-response failures fall back
to the offline report. Actual network use requires an explicit analyze action.

## Native keyring: planned

The intended native flow uses an OS keyring/Secret Service, with
`ANTHROPIC_API_KEY` as an environment source. The following command family is
**not implemented** in today's profiler:

```text
vapour-profiler key set|test|remove
```

Native key delivery from a staging UI will use a token-authenticated localhost
connection and immediate field clearing. No existing dashboard currently provides
that flow. Do not store a native key in Firestore while waiting for it.

## What reaches Anthropic

Only the deterministic summary, requested model and analysis instructions. The
browser client uses the direct-browser-access header, disables redirects and
cookies, and caps request time and response size. Raw frames and trace series
are not sent. See [analysis](../analysis/reports.md).
