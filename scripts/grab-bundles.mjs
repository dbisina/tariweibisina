// Downloads each reference site's HTML plus every same-site (and CDN) JS/CSS
// bundle it references, so the real animation code (GSAP configs, easings,
// shaders, lenis settings) can be read instead of guessed from screenshots.
// Usage: node scripts/grab-bundles.mjs
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const SITES = [
  ["k95", "https://k95.it/en"],
  ["cinetica", "https://www.cinetica.studio/"],
  ["nothin", "https://www.noth.in/"],
  ["juba", "https://mauriciojuba.com/"],
  ["podium", "https://podium.global/"],
  ["semler", "https://www.semlerpremium.dk/brands/lamborghini/aventador-798c407d-6f08-427b-b67b-f684c726bc92/"],
];

const OUT = path.resolve("reference-bundles");
const UA = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36" };

function assetUrls(html, base) {
  const urls = new Set();
  const patterns = [
    /<script[^>]+src=["']([^"']+)["']/g,
    /<link[^>]+href=["']([^"']+\.css[^"']*)["']/g,
    /<link[^>]+rel=["']modulepreload["'][^>]+href=["']([^"']+)["']/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html))) {
      try {
        const u = new URL(m[1], base);
        if (/\.(js|mjs|css)(\?|$)/.test(u.pathname + u.search) || u.pathname.includes("/_next/") || u.pathname.includes("/assets/")) {
          urls.add(u.href);
        }
      } catch {}
    }
  }
  return [...urls];
}

function safeName(u) {
  const url = new URL(u);
  let name = (url.pathname + url.search).replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-120);
  if (!name || name === "_") name = "index";
  return name;
}

for (const [key, siteUrl] of SITES) {
  const dir = path.join(OUT, key);
  await mkdir(dir, { recursive: true });
  process.stdout.write(`\n=== ${key} — ${siteUrl}\n`);
  let html;
  try {
    const res = await fetch(siteUrl, { headers: UA, redirect: "follow" });
    html = await res.text();
    await writeFile(path.join(dir, "page.html"), html);
    process.stdout.write(`  page.html ${(html.length / 1024).toFixed(0)}kB\n`);
  } catch (e) {
    process.stdout.write(`  PAGE FAILED: ${e.message}\n`);
    continue;
  }
  const assets = assetUrls(html, siteUrl);
  process.stdout.write(`  ${assets.length} assets referenced\n`);
  let ok = 0, fail = 0;
  await Promise.all(
    assets.map(async (a) => {
      try {
        const res = await fetch(a, { headers: UA });
        if (!res.ok) throw new Error(res.status);
        const buf = Buffer.from(await res.arrayBuffer());
        await writeFile(path.join(dir, safeName(a)), buf);
        ok++;
      } catch {
        fail++;
      }
    })
  );
  process.stdout.write(`  downloaded ${ok}, failed ${fail}\n`);
}
process.stdout.write("\nDone.\n");
