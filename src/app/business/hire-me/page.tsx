"use client";

import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

const TYPES = ["Web app", "Mobile app", "AI / LLM system", "Systems / infra", "Not sure yet"];
const RANGES = ["< $2k", "$2k – $6k", "$6k – $15k", "$15k+", "Open"];

/** Hire Me intake. The full AI scope+budget analysis (Rimuru) lands with
 * task #7; for now the brief is captured and a rough client-side band is
 * shown, always framed as a draft Daniel authorizes. */
export default function HireMePage() {
  const [type, setType] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [brief, setBrief] = useState("");
  const [sent, setSent] = useState(false);

  const canSend = type && budget && brief.trim().length > 20;

  const mailto = `mailto:danbis664@gmail.com?subject=${encodeURIComponent(
    "Project brief — " + (type ?? "")
  )}&body=${encodeURIComponent(
    `Type: ${type}\nBudget: ${budget}\n\nBrief:\n${brief}`
  )}`;

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-6 pt-40 pb-24 md:px-10 md:pt-48">
        <p className="font-mono text-[11px] tracking-[0.24em] text-acc">HIRE ME</p>
        <h1
          className="mt-5 font-display font-medium leading-[0.95] tracking-[-0.03em] text-ink"
          style={{ fontSize: "clamp(2.6rem, 7vw, 5.5rem)" }}
        >
          Tell me what you want built.
        </h1>
        <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-mut">
          Describe the project in your own words. You get a rough budget band now — the real
          number is scoped and authorized by me before anything starts.
        </p>

        <div className="mt-14 space-y-10">
          <div>
            <p className="font-mono text-[10.5px] tracking-[0.2em] text-mut">01 · WHAT KIND</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className="rounded-full border px-4 py-2 font-sans text-sm transition-colors"
                  style={{
                    borderColor: type === t ? "var(--acc)" : "var(--ln)",
                    color: type === t ? "var(--acc)" : "var(--ink)",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-[10.5px] tracking-[0.2em] text-mut">02 · ROUGH BUDGET</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setBudget(r)}
                  className="rounded-full border px-4 py-2 font-sans text-sm transition-colors"
                  style={{
                    borderColor: budget === r ? "var(--acc)" : "var(--ln)",
                    color: budget === r ? "var(--acc)" : "var(--ink)",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-[10.5px] tracking-[0.2em] text-mut">03 · THE BRIEF</p>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={6}
              placeholder="What are you trying to build, and what does done look like? The more detail, the sharper the estimate."
              className="mt-4 w-full resize-none rounded-2xl border border-ln bg-transparent p-5 font-sans text-[15px] leading-relaxed text-ink outline-none transition-colors placeholder:text-mut focus:border-acc"
            />
          </div>

          {!sent ? (
            <button
              disabled={!canSend}
              onClick={() => setSent(true)}
              className="rounded-full bg-acc px-7 py-3.5 font-sans text-sm font-semibold text-[#0b0b0c] transition-opacity disabled:opacity-30"
            >
              Get a rough estimate
            </button>
          ) : (
            <div className="rounded-2xl border border-acc/40 p-6">
              <p className="font-mono text-[10px] tracking-[0.2em] text-acc">DRAFT ESTIMATE</p>
              <p className="mt-3 font-display text-2xl text-ink md:text-3xl">
                Around <span className="text-acc">{budget}</span> for a {type?.toLowerCase()}.
              </p>
              <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-mut">
                This is a placeholder band. Send the brief and I&apos;ll come back with a
                scoped figure — what&apos;s in, what&apos;s out, and a real number I authorize.
                Deeper AI scoping is coming to this page soon.
              </p>
              <a
                href={mailto}
                className="mt-5 inline-flex rounded-full bg-ink px-6 py-3 font-sans text-sm text-[color:var(--bg)]"
              >
                Send the brief →
              </a>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
