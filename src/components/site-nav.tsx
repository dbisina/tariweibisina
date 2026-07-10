"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "./logo";

/**
 * Nav with a full-width extension panel (Daniel: no small dropdowns).
 * Hovering For Engineers / For Business slides a panel out under the bar:
 * project photography on the left, the group's sublinks large on the right.
 */

const GROUPS = [
  {
    label: "For Engineers",
    href: "/engineer",
    photos: [
      "https://picsum.photos/seed/tariwei-relay/640/440",
      "https://picsum.photos/seed/tariwei-etllm/640/440",
    ],
    blurb: "Protocols, kernels, system design. Proof of competence.",
    sub: [
      { label: "Projects", href: "/engineer/projects", hint: "The systems, with schematics" },
      { label: "Research", href: "/engineer/research", hint: "Working notes & investigations" },
      { label: "Hackathons", href: "/engineer/hackathons", hint: "Where half of it started" },
    ],
  },
  {
    label: "For Business",
    href: "/business",
    photos: [
      "https://picsum.photos/seed/tariwei-hebron-hotels/640/440",
      "https://picsum.photos/seed/tariwei-wayfarian/640/440",
    ],
    blurb: "Problems, solutions and the numbers that moved. Proof of impact.",
    sub: [
      { label: "Catalog", href: "/business/catalog", hint: "Every project, in 3D" },
      { label: "Pitch Decks", href: "/business/pitch-decks", hint: "For investors" },
      { label: "Hire Me", href: "/business/hire-me", hint: "Scope a project with the AI" },
    ],
  },
];

export function SiteNav() {
  const [open, setOpen] = useState<number | null>(null);
  const group = open !== null ? GROUPS[open] : null;

  return (
    <nav
      className="fixed inset-x-0 top-0 z-40 border-b border-ln bg-bg/80 backdrop-blur-md"
      onMouseLeave={() => setOpen(null)}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:px-10">
        <Link href="/" aria-label="tariwei home" className="flex items-center" onMouseEnter={() => setOpen(null)}>
          <Logo variant="shimmer" className="h-3.5 w-auto text-ink" />
        </Link>
        <div className="flex items-center gap-5 md:gap-8 font-mono text-[12px] tracking-[0.06em]">
          {GROUPS.map((g, i) => (
            <Link
              key={g.href}
              href={g.href}
              onMouseEnter={() => setOpen(i)}
              className="flex items-center gap-1.5 py-5 transition-opacity"
              style={{ opacity: open === null || open === i ? (open === i ? 1 : 0.7) : 0.35 }}
            >
              {g.label}
              <span
                className="text-[9px] text-mut transition-transform duration-300"
                style={{ transform: open === i ? "rotate(180deg)" : "none" }}
              >
                ▾
              </span>
            </Link>
          ))}
          <Link
            href="/contact"
            onMouseEnter={() => setOpen(null)}
            className="opacity-70 transition-opacity hover:opacity-100"
          >
            Contact
          </Link>
        </div>
      </div>

      {/* extension panel */}
      <div
        className="overflow-hidden border-ln transition-[max-height,opacity] duration-500"
        style={{
          maxHeight: group ? 340 : 0,
          opacity: group ? 1 : 0,
          borderTopWidth: group ? 1 : 0,
          transitionTimingFunction: "cubic-bezier(0.22, 0.7, 0.16, 1)",
        }}
      >
        {group && (
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] md:px-10">
            {/* photos left */}
            <div className="hidden gap-4 md:flex">
              {group.photos.map((src, i) => (
                <div
                  key={src}
                  className="h-[220px] flex-1 overflow-hidden rounded-xl border border-ln bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${src})`,
                    transform: `rotate(${i === 0 ? -2 : 2}deg) translateY(${i === 0 ? 0 : 10}px)`,
                  }}
                />
              ))}
            </div>

            {/* links right */}
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-mut">{group.blurb}</p>
              <div className="mt-4">
                {group.sub.map((l, i) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="group/link flex items-baseline justify-between gap-6 border-b border-ln py-4"
                  >
                    <span className="flex items-baseline gap-4">
                      <span className="font-mono text-[10px] text-mut">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-display text-2xl font-medium text-ink transition-colors group-hover/link:text-acc md:text-3xl">
                        {l.label}
                      </span>
                    </span>
                    <span className="hidden font-mono text-[10px] tracking-[0.12em] text-mut sm:block">
                      {l.hint} <span className="text-acc">↗</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
