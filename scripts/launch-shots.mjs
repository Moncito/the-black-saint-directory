/**
 * Renders the launch screenshots into launch/ (git-ignored).
 *
 *   npm run build && npm run start        (in another terminal)
 *   npm run launch:shots -- --url=http://localhost:3000
 *
 * Desktop frames are 1600 × 1200 — the Awwwards main-thumbnail size — and
 * phone frames are 390 × 844 at 3×. Headless Chrome renders WebGL in
 * software, so the fog is forced on with ?tier=full.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import puppeteer from "puppeteer-core";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = "true"] = a.replace(/^--/, "").split("=");
    return [k, v];
  }),
);
const url = args.url ?? "http://localhost:3000";
const out = resolve(args.out ?? "launch");
mkdirSync(out, { recursive: true });

const chrome =
  process.env.CHROME_PATH ??
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
  ].find(existsSync);
if (!chrome) throw new Error("Chrome not found. Set CHROME_PATH.");

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Scroll in steps so scroll-driven scenes play as they would for a person. */
async function scrollTo(page, y) {
  let cur = await page.evaluate(() => scrollY);
  while (Math.abs(cur - y) > 2) {
    cur += Math.sign(y - cur) * Math.min(350, Math.abs(y - cur));
    await page.evaluate((v) => window.scrollTo(0, v), cur);
    await wait(80);
  }
  await wait(1800);
}

const shots = [
  // name, path, viewport, how to frame it
  ["01-hero", "/", "desktop", async (p) => p.mouse.move(1180, 330)],
  [
    "02-manifesto",
    "/",
    "desktop",
    async (p) => {
      const top = await p.evaluate(() => document.querySelector(".manifesto").getBoundingClientRect().top + scrollY);
      await scrollTo(p, top + 1200 * 1.2);
    },
  ],
  [
    "03-work-gallery",
    "/",
    "desktop",
    async (p) => {
      const top = await p.evaluate(() => document.querySelector(".gallery").getBoundingClientRect().top + scrollY);
      await scrollTo(p, top + 1500);
    },
  ],
  [
    "04-services-halo",
    "/",
    "desktop",
    async (p) => {
      const top = await p.evaluate(() => document.querySelector(".halo").getBoundingClientRect().top + scrollY);
      await scrollTo(p, top + 900);
    },
  ],
  ["05-work-index", "/work", "desktop", async () => {}],
  ["06-case-study", "/work/roomify", "desktop", async () => {}],
  ["07-systems-demo", "/services/systems", "desktop", async (p) => scrollTo(p, 760)],
  ["08-quote-builder", "/start", "desktop", async (p) => scrollTo(p, 420)],
  ["09-studio", "/studio", "desktop", async (p) => scrollTo(p, 120)],
  [
    "10-footer",
    "/",
    "desktop",
    async (p) => {
      const max = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      await scrollTo(p, max);
    },
  ],
  ["11-phone-hero", "/", "phone", async () => {}],
  ["12-phone-work", "/work", "phone", async () => {}],
  ["13-phone-quote", "/start", "phone", async (p) => scrollTo(p, 520)],
];

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--hide-scrollbars"],
});
try {
  for (const [name, path, kind, frame] of shots) {
    const page = await browser.newPage();
    await page.setViewport(
      kind === "phone"
        ? { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
        : { width: 1600, height: 1200, deviceScaleFactor: 1 },
    );
    await page.goto(`${url}${path}?intro=0&tier=full`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await wait(6000);
    await frame(page);
    await wait(1200);
    // The custom cursor is a pointer aid, not part of the design to show.
    await page.addStyleTag({ content: ".cursor-ring, .cursor-dot { display: none !important; }" });
    writeFileSync(resolve(out, `${name}.png`), await page.screenshot({ type: "png" }));
    console.log(`launch/${name}.png`);
    await page.close();
  }
} finally {
  await browser.close();
}
