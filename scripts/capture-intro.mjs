/**
 * Pre-renders the serpent intro for the Static quality tier.
 *
 * The intro is deterministic: one GSAP timeline drives the shader. In capture
 * mode (?capture) the page exposes `__bsd.seek(t)` and `__bsdRender(ms)`, so
 * this script steps it frame by frame in headless Chrome — no dropped frames,
 * whatever the machine — and hands the frames to ffmpeg.
 *
 *   npm run build && npm run start          (in another terminal)
 *   npm run capture:intro                   → public/intro/serpent.mp4
 *
 * Options:
 *   --url=http://localhost:3000   server to capture from
 *   --size=720                    square frame, px (or WxH)
 *   --fps=30
 *   --stills=0.6,1.4,2.2          write PNG stills at these times instead of a video
 *   --out=public/intro/serpent.mp4
 *
 * Needs Chrome (set CHROME_PATH if it is not in the default location) and ffmpeg.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import puppeteer from "puppeteer-core";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = "true"] = a.replace(/^--/, "").split("=");
    return [k, v];
  }),
);

const url = args.url ?? "http://localhost:3000";
const [width, height] = (args.size ?? "720").split("x").map(Number);
const size = { width, height: height ?? width };
const fps = Number(args.fps ?? 30);
const out = resolve(args.out ?? "public/intro/serpent.mp4");
const stills = args.stills?.split(",").map(Number);
const query = args.query ? `&${args.query}` : "";

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

const frames = join(tmpdir(), `bsd-intro-${Date.now()}`);
mkdirSync(frames, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--hide-scrollbars"],
  defaultViewport: { ...size, deviceScaleFactor: 1 },
});

try {
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("page error:", e.message));
  await page.goto(`${url}/?capture&tier=${args.tier ?? "full"}${query}`, { waitUntil: "networkidle0" });
  await page.waitForFunction("window.__bsd && window.__bsdRender", { timeout: 60_000 });
  // Hide dev-only overlays so they never end up in a frame.
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });

  const duration = await page.evaluate("window.__bsd.duration");
  const step = async (t) => {
    await page.evaluate((time) => {
      window.__bsd.seek(time);
      window.__bsdRender(time * 1000);
    }, t);
    // Two frames: one for WebGL to present, one for the compositor.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  };

  if (stills) {
    const dir = resolve(args.out ?? "stills");
    mkdirSync(dir, { recursive: true });
    for (const t of stills) {
      await step(t);
      const file = join(dir, `t${t.toFixed(2)}.png`);
      writeFileSync(file, await page.screenshot({ type: "png" }));
      console.log(file);
    }
  } else {
    // Stop one frame short of the swap: the logo file takes over from there.
    const count = Math.floor(duration * fps);
    for (let i = 0; i < count; i++) {
      await step(i / fps);
      writeFileSync(
        join(frames, `f${String(i).padStart(4, "0")}.png`),
        await page.screenshot({ type: "png" }),
      );
      if (i % 15 === 0) console.log(`frame ${i + 1}/${count}`);
    }

    mkdirSync(dirname(out), { recursive: true });
    const ffmpeg = spawnSync(
      "ffmpeg",
      [
        "-y", "-framerate", String(fps), "-i", join(frames, "f%04d.png"),
        "-c:v", "libx264", "-preset", "veryslow", "-crf", String(args.crf ?? 27),
        "-pix_fmt", "yuv420p", "-profile:v", "main", "-movflags", "+faststart",
        "-color_range", "tv", "-an", out,
      ],
      { stdio: ["ignore", "ignore", "inherit"] },
    );
    if (ffmpeg.status !== 0) throw new Error("ffmpeg failed");
    console.log(`wrote ${out}`);
  }
} finally {
  await browser.close();
  rmSync(frames, { recursive: true, force: true });
}
