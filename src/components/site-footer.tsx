import Link from "next/link";
import { Logo } from "./logo";

/**
 * Footer ported from the reference prototype: NEXT MOVE block with quote +
 * email pills, the giant low-opacity signature watermark (shimmer still
 * running — the logo shimmers wherever it appears), and the © / socials row.
 */
export function SiteFooter() {
  return (
    <footer data-perch="THE FOOTER" className="mt-10 border-t border-ln">
      <div className="mx-auto max-w-[1800px] px-4 pt-16 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-7">
          <div>
            <p className="font-mono text-[11px] tracking-[0.22em] text-acc">NEXT MOVE</p>
            <p
              className="mt-3.5 font-display font-medium leading-[1.02] tracking-[-0.03em] text-ink"
              style={{ fontSize: "clamp(30px, 4vw, 56px)" }}
            >
              Have something
              <br />
              worth building?
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/business/hire-me"
              className="rounded-full bg-acc px-6 py-3.5 font-sans text-sm font-semibold text-[#0b0b0c] transition-transform hover:-translate-y-0.5"
            >
              Get a quote
            </Link>
            <a
              href="mailto:danbis664@gmail.com"
              className="rounded-full border border-ln px-6 py-3.5 font-sans text-sm font-medium text-ink transition-colors hover:border-acc"
            >
              danbis664@gmail.com
            </a>
          </div>
        </div>

        <div className="mt-16 opacity-[0.07]">
          <Logo variant="shimmer" className="h-auto w-full text-ink" />
        </div>

        <div className="mt-0 flex flex-wrap justify-between gap-4 border-t border-ln py-6 font-sans text-[12.5px] text-mut">
          <span>© 2026 DeusX Technologies — built by Daniel Tariwei Bisina</span>
          <div className="flex gap-5">
            <a href="https://github.com/dbisina" target="_blank" rel="noreferrer" className="hover:text-acc">
              GitHub
            </a>
            <a href="https://linkedin.com/in/danielbisina" target="_blank" rel="noreferrer" className="hover:text-acc">
              LinkedIn
            </a>
            <a href="https://x.com/danielbisina" target="_blank" rel="noreferrer" className="hover:text-acc">
              X
            </a>
            <a href="https://wa.me/2347077213386" target="_blank" rel="noreferrer" className="hover:text-acc">
              WhatsApp
            </a>
            <Link href="/studio" className="text-mut/60 hover:text-acc">
              Studio
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
