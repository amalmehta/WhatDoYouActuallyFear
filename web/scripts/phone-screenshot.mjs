// Captures the README's phone screenshot at a true phone viewport (390×844, 3×), using Chrome's DevTools protocol.
// Headless Chrome can't size its window below ~500px, so the phone size is set through device emulation instead.
// Usage: node scripts/phone-screenshot.mjs [url] [output.png]
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const url = process.argv[2] ?? "https://amalmehta.github.io/WhatDoYouActuallyFear/?demo";
const out = process.argv[3] ?? fileURLToPath(new URL("../../docs/images/website-phone.png", import.meta.url));
const chromePath = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const profileDir = mkdtempSync(join(tmpdir(), "phone-shot-"));
const chrome = spawn(chromePath, [
  "--headless=new", "--hide-scrollbars", "--remote-debugging-port=0", `--user-data-dir=${profileDir}`, "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });

try {
  // Chrome prints its DevTools address on stderr.
  const browserWs = await new Promise((resolve, reject) => {
    let buffer = "";
    chrome.stderr.on("data", (chunk) => {
      buffer += chunk;
      const match = buffer.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) resolve(match[1]);
    });
    chrome.on("exit", () => reject(new Error("Chrome exited before DevTools was ready")));
  });
  const port = new URL(browserWs).port;
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((t) => t.type === "page");

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
  let nextId = 0;
  const pending = new Map();
  const waiters = [];
  ws.addEventListener("message", ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method) waiters.filter((w) => w.method === msg.method).forEach((w) => w.resolve(msg));
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, (msg) => (msg.error ? reject(new Error(`${method}: ${msg.error.message}`)) : resolve(msg.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });
  const waitFor = (method) => new Promise((resolve) => waiters.push({ method, resolve }));

  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
  const loaded = waitFor("Page.loadEventFired");
  await send("Page.navigate", { url });
  await loaded;
  await new Promise((r) => setTimeout(r, 800)); // fonts and first render
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(out, Buffer.from(data, "base64"));
  console.log(`Wrote ${out}`);
  ws.close();
} finally {
  const exited = new Promise((resolve) => chrome.once("exit", resolve));
  chrome.kill();
  await exited;
  rmSync(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
