import puppeteer from "puppeteer-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Captures pixel-exact, full-page screenshots of each site for the Remotion
 * walkthrough videos — the "replica" in every video IS the real rendered
 * site, not a rebuild. Uses the machine's installed Chrome (puppeteer-core,
 * channel "chrome"), writes PNGs into public/screens/<site>/ plus a
 * meta.json per site recording each capture's pixel dimensions so the
 * compositions can compute scroll distances exactly.
 *
 * Usage: node scripts/capture.mjs [siteKey ...]   (no args = all sites)
 */

const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 1.5 };

const SITES = {
  portfolio: {
    // the portfolio's realm gate only mounts on "/" — seed the store so the
    // real home renders, and give the entrance animations time to settle
    origin: "http://localhost:3000",
    seedLocalStorage: {
      "tariwei-site-state": JSON.stringify({
        state: { realm: "dark", hasEnteredBefore: true, audioMode: "silence" },
        version: 1,
      }),
    },
    pages: [
      { name: "home", path: "/", settleMs: 6500 },
      { name: "engineer", path: "/engineer", settleMs: 3500 },
      { name: "projects", path: "/engineer/projects", settleMs: 3000 },
      { name: "project-relay", path: "/projects/relay", settleMs: 4000 },
      { name: "business", path: "/business", settleMs: 3500 },
      { name: "hire-me", path: "/business/hire-me", settleMs: 3000 },
    ],
  },
  airfree: {
    origin: "https://airfree-zeta.vercel.app",
    pages: [
      { name: "home", path: "/", settleMs: 5000 },
      { name: "services", path: "/services", settleMs: 3500 },
      { name: "about", path: "/about", settleMs: 3500 },
      { name: "contact", path: "/contact", settleMs: 3000 },
    ],
  },
  mamazee: {
    origin: "https://mamazee-three.vercel.app",
    pages: [
      { name: "home", path: "/", settleMs: 5000 },
      { name: "shop", path: "/shop", settleMs: 4000 },
      { name: "about", path: "/about", settleMs: 3000 },
    ],
  },
  luvsallure: {
    origin: "https://www.luvsallure.com",
    pages: [
      { name: "home", path: "/", settleMs: 6000 },
      { name: "shop", path: "/shop", settleMs: 5000 },
    ],
  },
  uhop: {
    origin: "https://uhop.dev",
    pages: [
      { name: "home", path: "/", settleMs: 5000 },
      { name: "docs", path: "/docs", settleMs: 3500 },
    ],
  },
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const outRoot = join(__dirname, "..", "public", "screens");

const wanted = process.argv.slice(2);
const entries = Object.entries(SITES).filter(([k]) => !wanted.length || wanted.includes(k));

const browser = await puppeteer.launch({
  channel: "chrome",
  headless: true,
  args: ["--hide-scrollbars", "--force-color-profile=srgb"],
});

for (const [site, cfg] of entries) {
  const dir = join(outRoot, site);
  mkdirSync(dir, { recursive: true });
  const meta = {};

  for (const p of cfg.pages) {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    if (cfg.seedLocalStorage) {
      const seed = cfg.seedLocalStorage;
      await page.evaluateOnNewDocument((entriesJson) => {
        for (const [k, v] of Object.entries(JSON.parse(entriesJson))) localStorage.setItem(k, v);
      }, JSON.stringify(seed));
    }
    const url = cfg.origin + p.path;
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
      // let entrance animations / lazy images finish, then nudge lazy
      // content by scrolling through the page once and returning to top
      await new Promise((r) => setTimeout(r, p.settleMs ?? 3000));
      await page.evaluate(async () => {
        const step = window.innerHeight;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
      });
      await new Promise((r) => setTimeout(r, 1200));
      const file = join(dir, `${p.name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      const size = await page.evaluate(() => ({
        w: document.documentElement.scrollWidth,
        h: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
        vh: window.innerHeight,
      }));
      meta[p.name] = { ...size, dpr: VIEWPORT.deviceScaleFactor };
      console.log(`✓ ${site}/${p.name}  (${size.w}x${size.h} css px)`);
    } catch (e) {
      console.error(`✗ ${site}/${p.name}: ${e.message}`);
    } finally {
      await page.close();
    }
  }
  writeFileSync(join(dir, "meta.json"), JSON.stringify(meta, null, 2));
}

await browser.close();
console.log("done.");
