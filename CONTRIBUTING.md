# Updating the handbook

1. Start from a reviewed source revision and its actual behavior.
2. Edit the matching page under `book/`; update references and status as needed.
3. Add new pages once to `book/SUMMARY.md`.
4. Run `python3 scripts/check_docs.py`, then `npm ci` and `npm run build` to check the rendered site.
5. Review the diff for unsupported claims, accidental secrets and broken examples.
6. Commit/push through the repository's normal review process.

Use fenced `text` blocks, not runnable shell recipes, for planned commands.
Never publish real PATs, provider keys, Firebase ID tokens, private tfvars or
credential-file contents. Use explicit placeholders for environment-specific
origins. The handbook may describe source-preview work without publishing other
repositories' unpublished commits.

New framework guides need the exporter/version, actual build output, serving
requirements and hosted-play evidence before being called a dedicated tested
integration. Generic static web compatibility is not the same as an audited
engine-specific adapter.

Keep GitBook space keys stable. `gitbook-docs.yaml` and the `.gitbook.yaml` files
support site-level and single-space sync of the same `book/` content.
