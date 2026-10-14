import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "_book");
const summary = await readFile(resolve(root, "book/SUMMARY.md"), "utf8");
const pages = [...summary.matchAll(/\]\(([^)]+\.md)\)/g)].map((match) => match[1]);
for (const page of pages) {
  const html = page === "README.md" ? "index.html" : page.replace(/\.md$/, ".html");
  assert((await stat(resolve(output, html))).isFile(), `Missing generated page: ${html}`);
}

async function* files(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else yield path;
  }
}

let links = 0;
for await (const path of files(output)) {
  if (extname(path) !== ".html") continue;
  const html = await readFile(path, "utf8");
  for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
    const href = match[1].replaceAll("&amp;", "&");
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href)) continue;
    const pathname = decodeURIComponent(href.split(/[?#]/, 1)[0]);
    if (!pathname) continue;
    const target = pathname.startsWith("/") ? resolve(output, `.${pathname}`) : resolve(dirname(path), pathname);
    assert(target === output || target.startsWith(output + sep), `Link outside static output: ${href}`);
    try {
      const info = await stat(target);
      if (info.isDirectory()) await stat(resolve(target, "index.html"));
    } catch { throw new Error(`Broken generated link in ${path}: ${href}`); }
    links++;
  }
}

// The template engine must preserve GitHub Actions expressions in code examples.
const ciExample = (await readFile(resolve(output, "games/ci-cd.html"), "utf8")).replace(/<[^>]+>/g, "");
assert(ciExample.includes("${{ secrets.VAPOUR_TOKEN }}"), "CI expression was consumed by templating");
assert((await stat(resolve(output, ".gitbook/assets/browser-sample.vpt"))).isFile(), "Missing trace download");
assert((await stat(resolve(output, "search_index.json"))).isFile(), "Missing search index");
console.log(`PASS: ${pages.length} rendered pages, ${links} local links/assets, search, trace download and literal CI examples.`);
