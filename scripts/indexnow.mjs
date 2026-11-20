/**
 * Tells IndexNow search engines (Bing, Yandex, Seznam, Naver…) that pages
 * changed, so they recrawl now instead of eventually. Google does not use
 * IndexNow — for Google, submit the sitemap in Search Console.
 *
 *   npm run indexnow                 every URL in the live sitemap
 *   npm run indexnow -- /work /start only these paths
 *
 * The key is public by design: it is served at /<key>.txt to prove the
 * submission comes from the site's owner.
 */
import { readdirSync, readFileSync } from "node:fs";

const host = "blacksaintdirectory.studio";
const keyFile = readdirSync("public").find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error("No IndexNow key file in public/.");
const key = readFileSync(`public/${keyFile}`, "utf8").trim();

const paths = process.argv.slice(2);
let urls;
if (paths.length) {
  urls = paths.map((p) => `https://${host}${p.startsWith("/") ? p : `/${p}`}`);
} else {
  const xml = await (await fetch(`https://${host}/sitemap.xml`)).text();
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

// The key must be live before engines will accept the submission.
const check = await fetch(`https://${host}/${keyFile}`);
if (!check.ok || (await check.text()).trim() !== key)
  throw new Error(`Key file not live at https://${host}/${keyFile} — deploy first.`);

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation: `https://${host}/${keyFile}`, urlList: urls }),
});
console.log(`IndexNow: ${res.status} ${res.statusText} — ${urls.length} URLs submitted`);
if (res.status >= 400) process.exit(1);
