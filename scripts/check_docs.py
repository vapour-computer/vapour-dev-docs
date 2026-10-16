#!/usr/bin/env python3
"""Check GitBook navigation, local links, fences and the illustrative trace."""

import json
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
BOOK = ROOT / "book"
LINK = re.compile(r"!?\[[^\]\n]+\]\(([^)\n]+)\)")
errors = []


def prose(text, path):
    output = []
    fence = None
    for number, line in enumerate(text.splitlines(), 1):
        match = re.match(r"^\s*(`{3,}|~{3,})", line)
        if match:
            marker = match.group(1)
            if fence is None:
                fence = marker
            elif marker[0] == fence[0] and len(marker) >= len(fence):
                fence = None
            continue
        if fence is None:
            output.append((number, line))
    if fence is not None:
        errors.append(f"{path}: unclosed fenced code block")
    return output


def local_target(path, value):
    # Optional Markdown title after the destination is not part of its path.
    value = value.strip().split(' "', 1)[0].strip("<>")
    url = urlsplit(value)
    if url.scheme or url.netloc or not url.path:
        return None
    destination = (path.parent / unquote(url.path)).resolve()
    if not destination.is_relative_to(ROOT):
        errors.append(f"{path.relative_to(ROOT)}: link leaves repository: {value}")
        return None
    return destination


pages = sorted(BOOK.rglob("*.md"))
all_docs = pages + [ROOT / "README.md", ROOT / "CONTRIBUTING.md"]
for page in all_docs:
    text = page.read_text()
    lines = prose(text, page.relative_to(ROOT))
    titles = [line for _, line in lines if line.startswith("# ")]
    if len(titles) != 1:
        errors.append(f"{page.relative_to(ROOT)}: expected exactly one H1")
    if not text.endswith("\n"):
        errors.append(f"{page.relative_to(ROOT)}: missing final newline")
    for number, line in lines:
        for match in LINK.finditer(line):
            destination = local_target(page, match.group(1))
            if destination is not None and not destination.exists():
                errors.append(f"{page.relative_to(ROOT)}:{number}: missing {match.group(1)}")

summary = BOOK / "SUMMARY.md"
navigation = []
for match in LINK.finditer(summary.read_text()):
    target = local_target(summary, match.group(1))
    if target is not None:
        navigation.append(target)
expected = set(pages) - {summary}
if len(navigation) != len(set(navigation)):
    errors.append("SUMMARY.md contains a duplicate page")
for missing in sorted(expected - set(navigation)):
    errors.append(f"Page missing from navigation: {missing.relative_to(ROOT)}")
for extra in sorted(set(navigation) - expected):
    errors.append(f"Unexpected navigation target: {extra.relative_to(ROOT)}")

llm = BOOK / "llm.txt"
if not llm.is_file():
    errors.append("Missing required file: book/llm.txt")
else:
    size = llm.stat().st_size
    if size > 60 * 1024:
        errors.append(f"book/llm.txt is {size} bytes; max is 61440 bytes")
    cli = BOOK / "reference" / "cli.md"
    allowed_flags = set(re.findall(r"--[a-z0-9-]+", cli.read_text()))
    used_flags = set(re.findall(r"--[a-z0-9-]+", llm.read_text()))
    for flag in sorted(used_flags - allowed_flags):
        errors.append(f"book/llm.txt mentions flag not listed in book/reference/cli.md: {flag}")

for config in [ROOT / ".gitbook.yaml", BOOK / ".gitbook.yaml", ROOT / "gitbook-docs.yaml"]:
    if not config.is_file():
        errors.append(f"Missing GitBook config: {config}")

# A lightweight fixture sanity check. Full published JSON Schema validation is
# done when changing the example; this is not advertised as a general .vpt parser.
trace = BOOK / ".gitbook/assets/browser-sample.vpt"
records = [json.loads(line) for line in trace.read_text().splitlines()]
if records[0].get("type") != "metadata" or records[0].get("version") != 1:
    errors.append("Example trace must begin with v1 metadata")
if records[-1].get("type") != "end":
    errors.append("Example trace must have a final end record")
clocks = {}
for record in records:
    if "timeMs" in record:
        kind, time = record["type"], record["timeMs"]
        if time < clocks.get(kind, 0):
            errors.append(f"Non-monotonic example trace {kind} times")
        clocks[kind] = time

if errors:
    raise SystemExit("\n".join(errors))
print(f"PASS: {len(expected)} handbook pages, complete navigation, local links, fences, GitBook files and sample trace.")
