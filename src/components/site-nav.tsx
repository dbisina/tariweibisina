"use client";

import Link from "next/link";
import { Logo } from "./logo";

export interface NavLink {
  label: string;
  href: string;
}

export function SiteNav({ links }: { links: NavLink[] }) {
  return (
    <nav className="fixed inset-x-0 top-0 z-40 border-b border-ln bg-bg/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:px-10">
        <Link href="/" aria-label="tariwei home" className="flex items-center">
          <Logo variant="shimmer" className="h-3.5 w-auto text-ink" />
        </Link>
        <div className="flex items-center gap-6 md:gap-8 font-mono text-[12px] tracking-[0.08em]">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="opacity-70 transition-opacity hover:opacity-100"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
