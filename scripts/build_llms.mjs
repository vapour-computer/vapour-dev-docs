// Generates LLM-friendly outputs next to the built site:
//   _book/llms.txt        index of every page, with links to its plain-Markdown source (llmstxt.org format)
//   _book/llms-full.txt   the whole handbook as one Markdown file, in navigation order
//   _book/md/**           the Markdown source of every page
// Run after `honkit build`. SITE_URL overrides the public address used in links.
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const book = resolve(root, "book");
const out = resolve(root, "_book");
const site = (process.env.SITE_URL || "https://vapour-computer.github.io/vapour-dev-docs/").replace(/\/?$/, "/");

const summary = await readFile(resolve(book, "SUMMARY.md"), "utf8");
const parts = [];
for (const line of summary.split("\n")) {
  const part = line.match(/^##\s+(.+)/);
  if (part) { parts.push({ title: part[1].trim(), pages: [] }); continue; }
  const page = line.match(/^\*\s+\[([^\]]+)\]\(([^)]+\.md)\)/);
  if (page) {
    if (!parts.length) parts.push({ title: "Handbook", pages: [] });
    parts[parts.length - 1].pages.push({ title: page[1], path: page[2] });
  }
}

/** First real sentence of a page, for the one-line description in llms.txt. Skips badge lines and fragments. */
function describe(markdown) {
  const paragraphs = markdown.replace(/^#.*$/m, "").split("\n\n").map((p) => p.trim()).filter(Boolean);
  for (const raw of paragraphs) {
    if (/class="badge/.test(raw) || /^(\||```|>|\*|-|#|\d+\.|<)/.test(raw)) continue;
    const text = raw
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/<[^>]+>/g, "").replace(/[*`_]/g, "").replace(/\s+/g, " ").trim();
    if (text.length < 40) continue;
    const sentences = text.split(/(?<=[.!?])\s+/);
    let result = sentences[0].trim();
    if (result.length < 50 && sentences[1]) result += " " + sentences[1].trim();
    return result.length > 220 ? result.slice(0, 217) + "…" : result;
  }
  return "";
}

/** Plain Markdown for llms-full.txt: screenshots become [Image: alt], slots become notes, other HTML is dropped. */
function plain(markdown) {
  return markdown
    .replace(/<figure class="shot-slot">[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<\/figure>/g, (_, t) => `[Screenshot not yet added: ${t.replace(/<[^>]+>/g, "").trim()}]`)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, (_, alt) => `[Image: ${alt}]`)
    .replace(/<\/?(div|span|h3|p|code|a)[^>]*>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n");
}

const pageUrl = (p) => site + "md/" + p;
let index = `# Vapour Developer Handbook\n\n> Build, publish and profile browser games on Vapour. Guides and tutorials for Godot, Unity and Bevy, the vapour.toml reference, the vapour CLI, local profiling with \`vapour test\`, and the trace format. Preview features are labelled; check the status page before relying on a tool.\n\nEach link below goes to the plain-Markdown source of a page. The whole handbook as one file is [llms-full.txt](${site}llms-full.txt).\n`;
let full = `# Vapour Developer Handbook (complete text)\n\nSource: ${site}\nEach page below starts with its address. Screenshots appear as [Image: description].\n`;

for (const part of parts) {
  index += `\n## ${part.title}\n\n`;
  for (const page of part.pages) {
    const source = await readFile(resolve(book, page.path), "utf8");
    index += `- [${page.title}](${pageUrl(page.path)}): ${describe(source)}\n`;
    full += `\n\n---\n\nPage: ${site}${page.path.replace(/\.md$/, ".html").replace(/^README\.html$/, "")}\nMarkdown: ${pageUrl(page.path)}\n\n${plain(source).trim()}\n`;
    const target = resolve(out, "md", page.path);
    await mkdir(dirname(target), { recursive: true });
    await cp(resolve(book, page.path), target);
  }
}

await writeFile(resolve(out, "llms.txt"), index);
await writeFile(resolve(out, "llms-full.txt"), full);
await writeFile(resolve(out, ".nojekyll"), "");
await writeFile(resolve(out, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${site}sitemap.xml\n`);
const urls = parts.flatMap((p) => p.pages.map((pg) => site + pg.path.replace(/\.md$/, ".html").replace(/^README\.html$/, "")));
await writeFile(resolve(out, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`);
console.log(`llms: ${urls.length} pages -> llms.txt, llms-full.txt, md/, sitemap.xml`);
