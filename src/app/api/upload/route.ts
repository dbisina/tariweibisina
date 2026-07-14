import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Media upload for the Studio CMS. The editor POSTs a file (multipart) and
 * gets back a hosted URL to drop into a gallery/video/embed block — so the
 * owner uploads real media, not just pasted links (VISION.md).
 *
 * Storage is Cloudinary (signed upload, secret stays server-side). Set:
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 * When those are absent the route returns 501 with a clear message rather
 * than failing opaquely, so the CMS still runs in link-only mode locally.
 */
export const runtime = "nodejs";

const MAX_BYTES = 100 * 1024 * 1024; // 100MB — covers short video reels

export async function POST(req: Request) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) {
    return NextResponse.json(
      { error: "Uploads not configured. Set CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET." },
      { status: 501 }
    );
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "file too large (max 100MB)" }, { status: 413 });

  const folder = "tariwei/studio";
  const timestamp = Math.floor(Date.now() / 1000);
  // signature = sha1( sorted "k=v" of signed params + api_secret )
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto.createHash("sha1").update(toSign + secret).digest("hex");

  const upload = new FormData();
  upload.append("file", file);
  upload.append("api_key", key);
  upload.append("timestamp", String(timestamp));
  upload.append("folder", folder);
  upload.append("signature", signature);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/auto/upload`, {
      method: "POST",
      body: upload,
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "upload failed" },
        { status: 502 }
      );
    }
    return NextResponse.json({
      url: data.secure_url as string,
      resourceType: data.resource_type as string,
      width: data.width ?? null,
      height: data.height ?? null,
    });
  } catch {
    return NextResponse.json({ error: "upload provider unreachable" }, { status: 502 });
  }
}
