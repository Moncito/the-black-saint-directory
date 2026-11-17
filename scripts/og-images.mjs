/**
 * Renders the Open Graph images (1200 × 630) into public/og/.
 *
 *   npm run og
 *
 * Each card is plain HTML — the real logo file, the brand fonts, the project
 * plate — screenshotted in headless Chrome. Static files: nothing is generated
 * at request time. Re-run after changing a plate or the copy.
 *
 * Needs Chrome (CHROME_PATH if not in the default location) and network access
 * for the Google Fonts stylesheet.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import puppeteer from "puppeteer-core";

const root = resolve(".");
const out = resolve("public/og");
mkdirSync(out, { recursive: true });

const chrome =
  process.env.CHROME_PATH ??
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].find(existsSync);
if (!chrome) throw new Error("Chrome not found. Set CHROME_PATH.");

// Project data, read from the typed content file so the copy has one source.
const source = readFileSync(resolve("src/content/projects.ts"), "utf8");
const projects = [...source.matchAll(/slug: "([^"]+)",\s*index: "(\d+)",\s*name: "([^"]+)",\s*(?:badge: "([^"]+)",\s*)?kind: "[^"]+",\s*meta: "([^"]+)",[\s\S]*?plate: "([^"]+)"/g)].map(
  (m) => ({ slug: m[1], index: m[2], name: m[3], badge: m[4], meta: m[5], plate: m[6] }),
);
if (projects.length !== 8) throw new Error(`Expected 8 projects, parsed ${projects.length}`);

const dataUri = (file, type) =>
  `data:${type};base64,${readFileSync(resolve(root, "public" + file)).toString("base64")}`;
const logo = dataUri("/brand/logos/svg/bsd-primary-white.svg", "image/svg+xml");

const shell = (body) => `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,500;1,300&family=Geist+Mono:wght@500&display=block">
<style>
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; background: #0a0a0a; color: #fff; overflow: hidden; }
  body { position: relative; font-family: "Inter Tight", sans-serif; }
  .label { font-family: "Geist Mono", monospace; font-weight: 500; font-size: 15px; letter-spacing: 0.08em; text-transform: uppercase; color: #a3a3a0; }
  .logo { position: absolute; left: 56px; top: 44px; height: 92px; }
  .grain { position: absolute; inset: 0; opacity: 0.07; mix-blend-mode: overlay; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>"); }
  .badge { display: inline-block; margin-left: 16px; padding: 7px 12px; border: 1px solid #fff; border-radius: 999px; font-family: "Geist Mono", monospace; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; vertical-align: middle; }
</style></head><body>${body}<div class="grain"></div></body></html>`;

const defaultCard = shell(`
  <div style="position:absolute;inset:0;background:radial-gradient(70% 60% at 78% 110%, rgba(255,255,255,0.09), transparent 70%), radial-gradient(18% 22% at 82% 26%, rgba(255,219,174,0.12), transparent 70%)"></div>
  <img class="logo" src="${logo}">
  <div style="position:absolute;left:56px;bottom:112px;font-weight:500;font-size:96px;line-height:0.92;letter-spacing:-0.05em">
    Every person is a saint<br><span style="font-weight:300;font-style:italic">of their own life.</span>
  </div>
  <div class="label" style="position:absolute;left:56px;right:56px;bottom:44px;display:flex;justify-content:space-between;border-top:1px solid #262626;padding-top:18px">
    <span>Digital studio — Manila, PH</span><span>Websites · 3D · Systems · Mobile</span>
  </div>`);

const projectCard = (p) =>
  shell(`
  <!-- The plate already carries the name, the type line and any concept label: show it whole. -->
  <div style="position:absolute;inset:0;background:#121212"></div>
  <img src="${dataUri(p.plate, "image/jpeg")}" alt="${p.name}${p.badge ? ` (${p.badge})` : ""}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain">`);

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  defaultViewport: { width: 1200, height: 630, deviceScaleFactor: 1 },
});
try {
  const page = await browser.newPage();
  const render = async (html, file) => {
    await page.setContent(html, { waitUntil: "load", timeout: 120_000 });
    await page.evaluate(() => document.fonts.ready);
    writeFileSync(resolve(out, file), await page.screenshot({ type: "jpeg", quality: 86 }));
    console.log(`public/og/${file}`);
  };
  await render(defaultCard, "default.jpg");
  for (const p of projects) await render(projectCard(p), `${p.slug}.jpg`);
} finally {
  await browser.close();
}
