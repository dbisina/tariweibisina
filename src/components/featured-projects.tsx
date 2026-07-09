"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FEATURED_PROJECTS } from "@/lib/projects";

export function FeaturedProjects() {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  return (
    <section className="relative w-full px-6 md:px-10 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex items-baseline justify-between font-mono text-[10px] tracking-[0.22em] text-mut"
        >
          <span>{"//"} 02 — SELECTED WORK</span>
          <span className="text-acc">FULL CATALOGUE →</span>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6">
          {FEATURED_PROJECTS.map((p, i) => {
            const hovered = hoveredSlug === p.slug;
            return (
              <motion.a
                key={p.slug}
                href={`/projects/${p.slug}`}
                onMouseEnter={() => setHoveredSlug(p.slug)}
                onMouseLeave={() => setHoveredSlug(null)}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: "easeOut" }}
                className="group relative block aspect-[3/4] overflow-hidden rounded-2xl border border-ln"
              >
                <motion.div
                  className="absolute inset-0"
                  style={{ background: p.gradient }}
                  animate={{ scale: hovered ? 1.04 : 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 55%, transparent 80%)",
                  }}
                  animate={{ opacity: hovered ? 1 : 0.65 }}
                  transition={{ duration: 0.4 }}
                />

                <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-6">
                  <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-mut">
                    <span>{p.index}</span>
                    <span className="rounded-full border border-ln px-2.5 py-1 text-[9px]">
                      {p.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-2xl md:text-3xl leading-tight text-ink">
                      {p.name}
                    </h3>
                    <motion.p
                      className="mt-2 font-sans text-sm text-mut"
                      initial={false}
                      animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 8 }}
                      transition={{ duration: 0.3 }}
                    >
                      {p.blurb}
                    </motion.p>
                  </div>
                </div>

                <motion.div
                  className="pointer-events-none absolute right-5 top-5 flex items-center gap-1.5 rounded-full bg-acc px-3 py-1.5 font-mono text-[9px] tracking-[0.2em] text-bg"
                  initial={false}
                  animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.85 }}
                  transition={{ duration: 0.25 }}
                >
                  VIEW →
                </motion.div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
