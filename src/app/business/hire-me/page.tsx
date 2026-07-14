"use client";

import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useStudioStore } from "@/lib/studio";
import type { StructuredBrief, ChannelResult, LeadSource } from "@/lib/leads";

const TYPES = ["Web app", "Mobile app", "AI / LLM system", "Systems / infra", "Not sure yet"];
const RANGES = ["< $2k", "$2k – $6k", "$6k – $15k", "$15k+", "Open"];

type Mode = "quote" | "brief";

/**
 * Two intents, deliberately different (VISION.md):
 *  · QUICK QUOTE — name, contact, one line. A ballpark, fast.
 *  · FULL BRIEF  — name, budget, detailed project scope.
 * Both POST to /api/lead, where the LLM structures the request before it
 * reaches Daniel and pings him on Telegram / WhatsApp / email. The structured
 * brief comes back here as the on-page confirmation.
 */
export default function HireMePage() {
  const logLead = useStudioStore((s) => s.logLead);
  const [mode, setMode] = useState<Mode>("brief");

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [type, setType] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [detail, setDetail] = useState("");

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ brief: StructuredBrief; channels: ChannelResult } | null>(null);

  const canSend =
    name.trim().length > 1 &&
    contact.trim().length > 3 &&
    (mode === "quote" ? detail.trim().length > 6 : !!type && !!budget && detail.trim().length > 20);

  const mailto = `mailto:danbis664@gmail.com?subject=${encodeURIComponent(
    `${mode === "quote" ? "Quote request" : "Project brief"} — ${name}`
  )}&body=${encodeURIComponent(
    `Name: ${name}\nContact: ${contact}\nType: ${type ?? "-"}\nBudget: ${budget ?? "-"}\n\n${detail}`
  )}`;

  const submit = async () => {
    if (!canSend || sending) return;
    setSending(true);
    const source: LeadSource = mode === "quote" ? "quote" : "hire-me";
    const payload = {
      source,
      name: name.trim(),
      contact: contact.trim(),
      projectType: type ?? undefined,
      budget: budget ?? undefined,
      detail: detail.trim(),
    };
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.brief) {
        setResult({ brief: data.brief, channels: data.channels });
        logLead({ ...payload, brief: data.brief, channels: data.channels });
      } else {
        // structuring/persist failed server-side — still record locally
        logLead(payload);
        setResult({
          brief: {
            title: `${payload.projectType ?? "Inquiry"} — ${name}`,
            summary: detail.trim(),
            projectType: type ?? "Unspecified",
            budget: budget ?? "Not stated",
            timeline: "Not stated",
            scope: [],
            risks: [],
            priority: "medium",
            suggestedReply: "Brief captured — I'll come back with a scoped figure.",
          },
          channels: { telegram: false, whatsapp: false, email: false },
        });
      }
    } catch {
      logLead(payload);
      setResult(null);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-[1500px] px-4 pt-40 pb-24 md:px-6 md:pt-48">
        <p className="font-mono text-[11px] tracking-[0.24em] text-acc">WORK WITH ME</p>
        <h1
          className="mt-5 font-display font-medium leading-[0.95] tracking-[-0.03em] text-ink"
          style={{ fontSize: "clamp(2.6rem, 7vw, 5.5rem)" }}
        >
          Tell me what you want built.
        </h1>
        <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-mut">
          Two ways in. A quick quote for a ballpark, or a full brief for a scoped figure — either way
          the request is structured and reaches me directly.
        </p>

        {/* mode switch — quote vs full brief */}
        <div className="mt-10 inline-flex rounded-full border border-ln p-1">
          {(
            [
              { m: "quote" as Mode, label: "Quick quote" },
              { m: "brief" as Mode, label: "Full brief" },
            ]
          ).map(({ m, label }) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="rounded-full px-5 py-3 font-sans text-sm transition-colors"
              style={{
                background: mode === m ? "var(--acc)" : "transparent",
                color: mode === m ? "var(--bg)" : "var(--mut)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {result ? (
          <ResultCard result={result} mode={mode} mailto={mailto} />
        ) : (
          <div className="mt-12 space-y-10">
            <div className="grid gap-6 sm:grid-cols-2">
              <Labeled n="01" label="YOUR NAME">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Who's asking?"
                  className="w-full rounded-2xl border border-ln bg-transparent p-4 font-sans text-base text-ink outline-none transition-colors placeholder:text-mut focus:border-acc"
                />
              </Labeled>
              <Labeled n="02" label="CONTACT">
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Email or handle"
                  className="w-full rounded-2xl border border-ln bg-transparent p-4 font-sans text-base text-ink outline-none transition-colors placeholder:text-mut focus:border-acc"
                />
              </Labeled>
            </div>

            {mode === "brief" && (
              <>
                <Labeled n="03" label="WHAT KIND">
                  <Chips options={TYPES} value={type} onPick={setType} />
                </Labeled>
                <Labeled n="04" label="ROUGH BUDGET">
                  <Chips options={RANGES} value={budget} onPick={setBudget} />
                </Labeled>
              </>
            )}

            <Labeled
              n={mode === "brief" ? "05" : "03"}
              label={mode === "quote" ? "WHAT DO YOU NEED" : "THE BRIEF"}
            >
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={mode === "quote" ? 3 : 6}
                placeholder={
                  mode === "quote"
                    ? "One or two lines — what are you after?"
                    : "What are you building, and what does done look like? The more detail, the sharper the estimate."
                }
                className="w-full resize-none rounded-2xl border border-ln bg-transparent p-5 font-sans text-base leading-relaxed text-ink outline-none transition-colors placeholder:text-mut focus:border-acc"
              />
            </Labeled>

            <button
              disabled={!canSend || sending}
              onClick={submit}
              className="rounded-full bg-acc px-7 py-3.5 font-sans text-sm font-semibold text-[color:var(--bg)] transition-opacity disabled:opacity-30"
            >
              {sending
                ? "Structuring…"
                : mode === "quote"
                ? "Get a quick quote"
                : "Send the brief"}
            </button>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Labeled({ n, label, children }: { n: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 font-mono text-[10.5px] tracking-[0.2em] text-mut">
        {n} · {label}
      </p>
      {children}
    </div>
  );
}

function Chips({
  options,
  value,
  onPick,
}: {
  options: string[];
  value: string | null;
  onPick: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onPick(o)}
          className="rounded-full border px-4 py-2.5 font-sans text-sm transition-colors"
          style={{
            borderColor: value === o ? "var(--acc)" : "var(--ln)",
            color: value === o ? "var(--acc)" : "var(--ink)",
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function ResultCard({
  result,
  mode,
  mailto,
}: {
  result: { brief: StructuredBrief; channels: ChannelResult };
  mode: Mode;
  mailto: string;
}) {
  const { brief, channels } = result;
  const pri = { low: "#8b8a84", medium: "var(--acc-2)", high: "var(--acc)" }[brief.priority];
  return (
    <div className="mt-12 rounded-2xl border border-acc/40 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-acc">
          {mode === "quote" ? "QUOTE REQUEST RECEIVED" : "BRIEF STRUCTURED"}
        </p>
        <span
          className="rounded-full px-3 py-1 font-mono text-[9px] tracking-[0.14em] uppercase"
          style={{ border: `1px solid ${pri}`, color: pri }}
        >
          {brief.priority} priority
        </span>
      </div>

      <h2 className="mt-4 font-display text-2xl text-ink md:text-3xl">{brief.title}</h2>
      <p className="mt-3 max-w-xl font-sans text-[15px] leading-relaxed text-mut">{brief.summary}</p>

      <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[11px] tracking-[0.1em] text-mut uppercase">
        <span>Budget · <span className="text-ink">{brief.budget}</span></span>
        <span>Timeline · <span className="text-ink">{brief.timeline}</span></span>
        <span>Type · <span className="text-ink">{brief.projectType}</span></span>
      </div>

      {brief.scope.length > 0 && (
        <div className="mt-6">
          <p className="font-mono text-[10px] tracking-[0.2em] text-mut">SCOPED AS</p>
          <ul className="mt-2 space-y-1.5">
            {brief.scope.map((s, i) => (
              <li key={i} className="flex gap-2.5 font-sans text-sm text-ink">
                <span className="text-acc">›</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
        {(["telegram", "whatsapp", "email"] as const).map((c) => (
          <span key={c} className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: channels[c] ? "var(--acc)" : "var(--ln)" }}
            />
            <span style={{ color: channels[c] ? "var(--ink)" : "var(--mut)" }}>
              {c}{channels[c] ? " sent" : ""}
            </span>
          </span>
        ))}
      </div>

      {!channels.telegram && !channels.whatsapp && !channels.email && (
        <a
          href={mailto}
          className="mt-6 inline-flex rounded-full bg-ink px-6 py-3 font-sans text-sm text-[color:var(--bg)]"
        >
          Email the brief directly →
        </a>
      )}
    </div>
  );
}
