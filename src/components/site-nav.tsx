"use client";

import Link from "next/link";
import { Logo } from "./logo";

const GROUPS: { label: string; href: string; sub: { label: string; href: string }[] }[] = [
  {
    label: "For Engineers",
    href: "/engineer",
    sub: [
      { label: "Projects", href: "/engineer/projects" },
      { label: "Research", href: "/engineer/research" },
      { label: "Hackathons", href: "/engineer/hackathons" },
    ],
  },
  {
    label: "For Business",
    href: "/business",
    sub: [
      { label: "Catalog", href: "/business/catalog" },
      { label: "Pitch Decks", href: "/business/pitch-decks" },
      { label: "Hire Me", href: "/business/hire-me" },
    ],
  },
];

export function SiteNav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-40 border-b border-ln bg-bg/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:px-10">
        <Link href="/" aria-label="tariwei home" className="flex items-center">
          <Logo variant="shimmer" className="h-3.5 w-auto text-ink" />
        </Link>
        <div className="flex items-center gap-5 md:gap-8 font-mono text-[12px] tracking-[0.06em]">
          {GROUPS.map((g) => (
            <div key={g.href} className="group relative">
              <Link
                href={g.href}
                className="flex items-center gap-1.5 py-5 opacity-70 transition-opacity hover:opacity-100"
              >
                {g.label}
                <span className="text-[9px] text-mut transition-transform group-hover:rotate-180">
                  ▾
                </span>
              </Link>
              <div className="invisible absolute left-1/2 top-full min-w-44 -translate-x-1/2 translate-y-1 rounded-xl border border-ln bg-bg/95 p-1.5 opacity-0 shadow-2xl backdrop-blur-md transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                {g.sub.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="block rounded-lg px-4 py-2.5 opacity-70 transition-all hover:bg-ln hover:opacity-100"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <Link href="/contact" className="opacity-70 transition-opacity hover:opacity-100">
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
}
