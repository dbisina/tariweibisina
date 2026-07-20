// One-off: screenshot each live project and upload to Cloudinary, printing
// the resulting hosted URLs so they can be dropped into projects.ts.
// Reads Cloudinary creds from .env.local directly (no dev server needed).
import { chromium } from "playwright";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ENV_PATH = path.join(process.cwd(), ".env.local");
const env = Object.fromEntries(
  fs
    .readFileSync(ENV_PATH, "utf8")
    .split(/\r?\n/)
    .map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim()])
);

const CLOUD = env.CLOUDINARY_CLOUD_NAME;
const KEY = env.CLOUDINARY_API_KEY;
const SECRET = env.CLOUDINARY_API_SECRET;
if (!CLOUD || !KEY || !SECRET) {
  console.error("Missing Cloudinary env vars in .env.local");
  process.exit(1);
}

const TARGETS = [
  { slug: "uhop", url: "https://uhop.dev" },
  { slug: "airfree-geospatial", url: "https://airfree-zeta.vercel.app" },
  { slug: "mamazee", url: "https://mamazee-three.vercel.app" },
];

async function uploadToCloudinary(buffer, publicId) {
  const folder = "tariwei/projects";
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto.createHash("sha1").update(toSign + SECRET).digest("hex");

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: "image/png" }), `${publicId}.png`);
  form.append("api_key", KEY);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("public_id", publicId);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? "upload failed");
  return data.secure_url;
}

const browser = await chromium.launch();
const results = {};
for (const { slug, url } of TARGETS) {
  console.log(`\nScreenshotting ${slug} (${url})...`);
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500); // settle any entrance animations
    const buffer = await page.screenshot({ type: "png" });
    console.log(`  captured ${buffer.length} bytes, uploading...`);
    const uploadedUrl = await uploadToCloudinary(buffer, slug);
    console.log(`  -> ${uploadedUrl}`);
    results[slug] = uploadedUrl;
  } catch (e) {
    console.error(`  FAILED for ${slug}:`, e.message);
    results[slug] = null;
  } finally {
    await page.close();
  }
}
await browser.close();

console.log("\n=== RESULTS ===");
console.log(JSON.stringify(results, null, 2));
