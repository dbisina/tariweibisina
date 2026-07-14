"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "./logo";
import { AdSpotCompact } from "./ad-spot";

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
      { label: "Projects", href: "/business/projects", hint: "Full case presentations" },
      { label: "Pitch Decks", href: "/business/pitch-decks", hint: "For investors" },
      { label: "Hire Me", href: "/business/hire-me", hint: "Scope a project with the AI" },
    ],
  },
];

export function SiteNav() {
  const [open, setOpen] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroup, setMobileGroup] = useState<number | null>(null);
  const group = open !== null ? GROUPS[open] : null;

  const closeMobile = () => {
    setMobileOpen(false);
    setMobileGroup(null);
  };

  return (
    <nav
      className="fixed inset-x-0 top-0 z-40 border-b border-ln bg-bg/80 backdrop-blur-md"
      onMouseLeave={() => setOpen(null)}
    >
      <div className="mx-auto flex h-14 max-w-[1800px] items-center justify-between px-3 sm:h-16 sm:px-4 md:px-6">
        <Link href="/" aria-label="tariwei home" className="flex items-center" onMouseEnter={() => setOpen(null)}>
          <Logo variant="shimmer" className="h-3 w-auto text-ink sm:h-3.5" />
        </Link>

        {/* desktop links */}
        <div className="hidden items-center gap-6 font-display text-[14px] font-medium tracking-[0.005em] md:flex md:gap-9">
          {GROUPS.map((g, i) => (
            <Link
              key={g.href}
              href={g.href}
              onMouseEnter={() => setOpen(i)}
              className="flex items-center gap-1.5 py-5 transition-opacity"
              style={{ opacity: open === null || open === i ? (open === i ? 1 : 0.75) : 0.4 }}
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
            href="/catalog"
            onMouseEnter={() => setOpen(null)}
            className="opacity-75 transition-opacity hover:opacity-100"
          >
            Catalog
          </Link>
          <Link
            href="/contact"
            onMouseEnter={() => setOpen(null)}
            className="opacity-75 transition-opacity hover:opacity-100"
          >
            Contact
          </Link>
          <AdSpotCompact />
        </div>

        {/* mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-ink md:hidden"
        >
          <span className="relative block h-3.5 w-4">
            <span
              className="absolute left-0 right-0 h-[1.5px] bg-current transition-transform duration-300"
              style={{ top: mobileOpen ? "6px" : "0px", transform: mobileOpen ? "rotate(45deg)" : "none" }}
            />
            <span
              className="absolute left-0 right-0 top-[6px] h-[1.5px] bg-current transition-opacity duration-200"
              style={{ opacity: mobileOpen ? 0 : 1 }}
            />
            <span
              className="absolute left-0 right-0 h-[1.5px] bg-current transition-transform duration-300"
              style={{ top: mobileOpen ? "6px" : "12px", transform: mobileOpen ? "rotate(-45deg)" : "none" }}
            />
          </span>
        </button>
      </div>

      {/* desktop extension panel */}
      <div
        className="hidden overflow-hidden border-ln transition-[max-height,opacity] duration-500 md:block"
        style={{
          maxHeight: group ? 340 : 0,
          opacity: group ? 1 : 0,
          borderTopWidth: group ? 1 : 0,
          transitionTimingFunction: "cubic-bezier(0.22, 0.7, 0.16, 1)",
        }}
      >
        {group && (
          <div className="mx-auto grid max-w-[1800px] grid-cols-1 gap-8 px-4 py-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] md:px-6">
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

      {/* mobile drawer */}
      <div
        className="overflow-y-auto border-ln bg-bg transition-[max-height,opacity] duration-400 md:hidden"
        style={{
          maxHeight: mobileOpen ? "calc(100dvh - 3.5rem)" : 0,
          opacity: mobileOpen ? 1 : 0,
          borderTopWidth: mobileOpen ? 1 : 0,
        }}
      >
        <div className="flex flex-col px-3 py-2">
          {GROUPS.map((g, i) => (
            <div key={g.href} className="border-b border-ln">
              <div className="flex items-center justify-between">
                <Link
                  href={g.href}
                  onClick={closeMobile}
                  className="flex-1 py-3.5 font-display text-[15px] font-medium text-ink"
                >
                  {g.label}
                </Link>
                <button
                  type="button"
                  aria-label={`${mobileGroup === i ? "Collapse" : "Expand"} ${g.label}`}
                  onClick={() => setMobileGroup((mg) => (mg === i ? null : i))}
                  className="flex h-10 w-10 flex-none items-center justify-center text-mut"
                >
                  <span
                    className="text-[10px] transition-transform duration-300"
                    style={{ transform: mobileGroup === i ? "rotate(180deg)" : "none" }}
                  >
                    ▾
                  </span>
                </button>
              </div>
              <div
                className="overflow-hidden transition-[max-height,opacity] duration-300"
                style={{ maxHeight: mobileGroup === i ? 260 : 0, opacity: mobileGroup === i ? 1 : 0 }}
              >
                <div className="flex flex-col gap-0.5 pb-3 pl-3">
                  {g.sub.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={closeMobile}
                      className="py-2 font-sans text-[13px] text-mut transition-colors active:text-acc"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <Link
            href="/catalog"
            onClick={closeMobile}
            className="border-b border-ln py-3.5 font-display text-[15px] font-medium text-ink"
          >
            Catalog
          </Link>
          <Link
            href="/contact"
            onClick={closeMobile}
            className="py-3.5 font-display text-[15px] font-medium text-ink"
          >
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
}
