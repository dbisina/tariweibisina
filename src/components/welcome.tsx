"use client";

import { useEffect, useState } from "react";
import { useSiteStore } from "@/lib/store";

/**
 * Welcome moment copied from noth.in's post-preloader beat: the wordmark
 * holds white-on-dark, then text and background swap to their inverses in
 * one clean flip. We end on the visitor's chosen realm palette, then hand
 * off to the homepage.
 */
export function Welcome({ onDone }: { onDone: () => void }) {
  const realm = useSiteStore((s) => s.realm) ?? "dark";
  const returning = useSiteStore((s) => s.hasEnteredBefore);
  const [flipped, setFlipped] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // start dark; flip to the inverse; if the chosen realm is dark, the flip
  // target is light-on-dark inverted once more so the exit lands on-realm
  const startBg = realm === "light" ? "#0b0b0c" : "#f3f1eb";
  const startInk = realm === "light" ? "#f4f3ef" : "#131316";
  const endBg = realm === "light" ? "#f3f1eb" : "#0b0b0c";
  const endInk = realm === "light" ? "#131316" : "#f4f3ef";

  useEffect(() => {
    const flip = window.setTimeout(() => setFlipped(true), 1000);
    const leave = window.setTimeout(() => setLeaving(true), 2400);
    const done = window.setTimeout(onDone, 3200);
    return () => {
      window.clearTimeout(flip);
      window.clearTimeout(leave);
      window.clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[490] flex flex-col items-center justify-center"
      style={{
        background: flipped ? endBg : startBg,
        color: flipped ? endInk : startInk,
        transition: "background 0.55s cubic-bezier(0.7,0,0.2,1), color 0.55s cubic-bezier(0.7,0,0.2,1), opacity 0.7s ease",
        opacity: leaving ? 0 : 1,
        pointerEvents: leaving ? "none" : "auto",
      }}
    >
      <h1
        className="select-none text-center font-display font-bold lowercase leading-none"
        style={{ fontSize: "clamp(4rem, 17vw, 16rem)", letterSpacing: "-0.02em" }}
      >
        tariwei
      </h1>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.3em] opacity-60">
        {returning ? "welcome back" : "welcome in"}
      </p>
    </div>
  );
}
