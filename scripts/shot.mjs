// Headless-Chromium screenshot driver for the Vapour tutorials. No dependencies: it speaks the
// DevTools protocol over Node's built-in WebSocket.
//
//   node shot.mjs --url URL --out file.png [--w 1280] [--h 800] [--scale 1] [--mobile]
//                 [--wait 3000] [--eval "js to run before the shot"] [--evalfile file.js] [--clicks "x,y;x,y"] [--afterclick 5000] [--waitfor "js expr that becomes truthy"]
//                 [--timeout 60000] [--gl] [--clip "x,y,w,h"] [--full]
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith("--")) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : true]);
    return acc;
  }, []),
);
const url = args.url, out = args.out;
if (!url || !out) throw new Error("usage: --url URL --out file.png");
const w = +(args.w || 1280), h = +(args.h || 800), scale = +(args.scale || 1);
const wait = +(args.wait || 2500), timeout = +(args.timeout || 60000);

const profile = mkdtempSync(join(tmpdir(), "vapour-shot-"));
const port = 9300 + Math.floor(Math.random() * 400);
const flags = [
  "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
  `--window-size=${w},${h}`, "--force-color-profile=srgb",
];
// Software GL by default so it runs anywhere; --gl asks for the real GPU.
if (args.gl) flags.push("--ignore-gpu-blocklist", "--enable-gpu-rasterization");
else flags.push("--use-angle=swiftshader", "--enable-unsafe-swiftshader");
flags.push("about:blank");
const chrome = spawn("chromium", flags, { stdio: "ignore" });
const done = () => { try { chrome.kill("SIGTERM"); } catch {} setTimeout(() => rmSync(profile, { recursive: true, force: true }), 800); };
process.on("exit", done);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function json(path) {
  for (let i = 0; i < 80; i++) {
    try { return await (await fetch(`http://127.0.0.1:${port}${path}`)).json(); } catch { await sleep(150); }
  }
  throw new Error("browser did not start");
}
const targets = await json("/json/list");
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((res, rej) => {
  const i = ++id; pending.set(i, (d) => (d.error ? rej(new Error(`${method}: ${d.error.message}`)) : res(d.result)));
  ws.send(JSON.stringify({ id: i, method, params }));
});
const evalJs = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || "eval failed");
  return r.result.value;
};

try {
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: scale, mobile: !!args.mobile });
  if (args.mobile) {
    await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0 Mobile Safari/537.36" });
  }
  await send("Page.navigate", { url });
  await sleep(wait);
  if (args.waitfor) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) { try { if (await evalJs(args.waitfor)) break; } catch {} await sleep(400); }
    if (Date.now() - t0 >= timeout) console.error("warning: --waitfor timed out; capturing anyway");
  }
  if (args.clicks) {
    for (const pair of String(args.clicks).split(";")) {
      const [x, y] = pair.split(",").map(Number);
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
      await sleep(250);
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
      await sleep(120);
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
      await sleep(600);
    }
    await sleep(+(args.afterclick || 3000));
  }
  if (args.eval) { await evalJs(args.eval); await sleep(800); }
  if (args.evalfile) { await evalJs(readFileSync(args.evalfile, "utf8")); await sleep(1500); }
  const shot = { format: "png", captureBeyondViewport: !!args.full };
  if (args.clip) { const [x, y, cw, ch] = args.clip.split(",").map(Number); shot.clip = { x, y, width: cw, height: ch, scale: 1 }; }
  const { data } = await send("Page.captureScreenshot", shot);
  writeFileSync(out, Buffer.from(data, "base64"));
  console.log(`wrote ${out}`);
} finally { ws.close(); done(); }
