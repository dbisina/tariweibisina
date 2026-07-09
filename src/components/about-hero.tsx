"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "./logo";

const BIO_LINES = [
  "GPU kernels. AI-native operating systems. Production web & mobile.",
  "One engineer, the entire stack.",
  "Founder, DeusX Technologies.",
];

const STACK = [
  "C / C++",
  "CUDA",
  "RUST",
  "GO",
  "PYTHON",
  "NODE / NEXT.JS",
  "REACT NATIVE",
  "SWIFT",
];

export function AboutHero() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const stutterOffset = Math.min(scrollY * 0.12, 40);

  return (
    <section className="relative min-h-screen w-full overflow-hidden px-6 md:px-10 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex items-center justify-between font-mono text-[10px] tracking-[0.22em] text-mut"
        >
          <span>
            BUILD 2026.07 · ENGINEER + FOUNDER · <span className="text-acc">OPEN TO PROJECTS</span>
          </span>
          <span>{"//"} 01 — ABOUT</span>
        </motion.div>

        <div className="relative mt-8 select-none">
          <span
            aria-hidden
            className="absolute inset-0 font-display text-ink/10"
            style={{
              fontSize: "clamp(3.5rem, 13vw, 11rem)",
              lineHeight: 0.9,
              transform: `translateX(${stutterOffset}px)`,
              transition: "transform 0.05s linear",
            }}
          >
            tariwei
          </span>
          <h1
            className="relative font-display text-ink"
            style={{ fontSize: "clamp(3.5rem, 13vw, 11rem)", lineHeight: 0.9 }}
          >
            tariwei
          </h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="mt-4"
        >
          <Logo variant="shimmer" className="h-4 w-auto text-acc" />
        </motion.div>

        <div className="mt-14 max-w-2xl space-y-3">
          {BIO_LINES.map((line, i) => (
            <motion.p
              key={line}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.08, ease: "easeOut" }}
              className="font-sans text-xl md:text-3xl leading-snug text-ink"
            >
              {line}
            </motion.p>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 border-t border-ln pt-6 overflow-hidden"
        >
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-[11px] tracking-[0.16em] text-mut">
            {STACK.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 font-mono text-[11px] tracking-[0.16em] text-mut"
        >
          OFF THE CLOCK — F1 (Verstappen, Red Bull) · football (Messi, Barça) · piano ·
          driving
        </motion.p>
      </div>
    </section>
  );
}
