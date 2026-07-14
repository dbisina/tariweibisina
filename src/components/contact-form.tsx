"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStudioStore } from "@/lib/studio";
import type { LeadSource } from "@/lib/leads";

/**
 * Quick-message form on the Contact page. Captures a lead into the Studio
 * CMS, fires it through the server pipeline (POST /api/lead — so Daniel gets
 * pinged on Telegram/WhatsApp/email, same as hire-me/quote), and hands off
 * to the visitor's mail client as a fallback the visitor can see happen
 * immediately.
 *
 * `?topic=sponsorship` (from the ad slot's CTA) marks the lead source
 * "adspot" so it's distinguishable from a general enquiry.
 */
export function ContactForm() {
  const logLead = useStudioStore((s) => s.logLead);
  const params = useSearchParams();
  const source: LeadSource = params.get("topic") === "sponsorship" ? "adspot" : "contact";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const ready = name.trim() && email.trim().length > 3 && message.trim().length > 8;

  const submit = () => {
    if (!ready) return;
    logLead({ source, name, contact: email, detail: message });
    fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, name, contact: email, detail: message }),
    }).catch(() => {});
    setSent(true);
    const mailto = `mailto:danbis664@gmail.com?subject=${encodeURIComponent(
      "Hello from " + name
    )}&body=${encodeURIComponent(message + "\n\n— " + name + " (" + email + ")")}`;
    window.location.href = mailto;
  };

  if (sent) {
    return (
      <div className="mt-16 rounded-2xl border border-acc/40 p-8 text-center">
        <p className="font-mono text-[10px] tracking-[0.2em] text-acc">MESSAGE READY</p>
        <p className="mt-3 font-display text-2xl text-ink">Your mail client is opening.</p>
        <p className="mt-2 font-sans text-sm text-mut">
          If it didn&apos;t, reach me directly at danbis664@gmail.com — I read everything.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-16">
      <p className="font-mono text-[10.5px] tracking-[0.2em] text-mut">OR DROP A LINE</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="rounded-2xl border border-ln bg-transparent p-4 font-sans text-base text-ink outline-none transition-colors placeholder:text-mut focus:border-acc"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email or handle"
          className="rounded-2xl border border-ln bg-transparent p-4 font-sans text-base text-ink outline-none transition-colors placeholder:text-mut focus:border-acc"
        />
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        placeholder="What's on your mind?"
        className="mt-4 w-full resize-none rounded-2xl border border-ln bg-transparent p-4 font-sans text-base leading-relaxed text-ink outline-none transition-colors placeholder:text-mut focus:border-acc"
      />
      <button
        disabled={!ready}
        onClick={submit}
        className="mt-4 rounded-full bg-acc px-7 py-3.5 font-sans text-sm font-semibold text-[#0b0b0c] transition-opacity disabled:opacity-30"
      >
        Send message
      </button>
    </div>
  );
}
