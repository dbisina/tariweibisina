import { NextResponse } from "next/server";
import { isStudioAuthed } from "@/lib/studio-auth";
import { extractPdfTextFromBuffer, structureDocument, type ImportKind, type InlineDoc } from "@/lib/ai/doc-import";
import { OWNER } from "@/lib/ai/knowledge";

/**
 * Document import for the Studio: multipart (PDF/image/TXT/MD file) or JSON
 * ({text}) in, a structured Pitch / ResearchEntry / case-study block list
 * out. Scanned/image-only PDFs and photos go through Gemini's native
 * document vision (the OCR path) — the file itself is attached to the
 * request instead of extracted text. The Studio applies the result to the
 * DRAFT store; Publish stays the only path to production. Studio-authed —
 * this costs Gemini tokens.
 */
export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024;
// inline base64 must fit Gemini's ~20MB request cap with room for the prompt
const MAX_OCR_BYTES = 14 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"];

export async function POST(req: Request) {
  if (!isStudioAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let kind: ImportKind = "pitch";
  let text = "";
  let doc: InlineDoc | undefined;

  const contentType = req.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      kind = (String(form.get("kind") ?? "pitch") as ImportKind) || "pitch";
      const f = form.get("file");
      if (!(f instanceof File)) return NextResponse.json({ error: "no file" }, { status: 400 });
      if (f.size > MAX_BYTES) return NextResponse.json({ error: "file too large (max 25MB)" }, { status: 413 });
      const buf = new Uint8Array(await f.arrayBuffer());
      const isPdf = f.name.toLowerCase().endsWith(".pdf") || f.type === "application/pdf";
      const isImage = IMAGE_TYPES.includes(f.type);

      if (isImage) {
        // photos/screenshots of documents — straight to the vision path
        if (f.size > MAX_OCR_BYTES)
          return NextResponse.json({ error: "image too large for OCR (max 14MB)" }, { status: 413 });
        doc = { mimeType: f.type, data: Buffer.from(buf).toString("base64") };
      } else if (isPdf) {
        try {
          text = await extractPdfTextFromBuffer(buf);
        } catch {
          text = "";
        }
        if (text.trim().length < 200) {
          // no usable text layer — scanned PDF; attach the file itself and
          // let Gemini read the pages visually
          if (f.size > MAX_OCR_BYTES)
            return NextResponse.json(
              { error: "This looks like a scanned PDF over 14MB — too large for OCR. Split it or paste the text." },
              { status: 413 }
            );
          doc = { mimeType: "application/pdf", data: Buffer.from(buf).toString("base64") };
        }
      } else {
        text = new TextDecoder().decode(buf);
      }
    } else {
      const body = await req.json();
      kind = (String(body?.kind ?? "pitch") as ImportKind) || "pitch";
      text = String(body?.text ?? "");
    }
  } catch {
    return NextResponse.json({ error: "couldn't read the document" }, { status: 400 });
  }

  if (!["pitch", "research", "case"].includes(kind))
    return NextResponse.json({ error: "kind must be pitch | research | case" }, { status: 400 });
  text = text.trim();
  if (!doc && text.length < 200)
    return NextResponse.json(
      { error: "Not enough text to work with — upload the PDF/image itself (OCR is supported) or paste more text." },
      { status: 422 }
    );

  const result = await structureDocument(kind, text, OWNER.email, doc);
  if (!result)
    return NextResponse.json({ error: "The model couldn't structure this document — try again in a moment." }, { status: 502 });
  return NextResponse.json(result);
}
