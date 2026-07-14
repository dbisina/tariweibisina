import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { AdSpot } from "@/components/ad-spot";
import { SiteFooter } from "@/components/site-footer";

const TITLE = "For Business";
const DESCRIPTION =
  "Problems in, products out. Solutions, live demos and the numbers that moved — full case presentations with a link straight to the working thing.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/business" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/business" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

const STATS = [
  { v: "5", l: "CLIENT PRODUCTS" },
  { v: "LIVE", l: "IN PRODUCTION" },
  { v: "0%", l: "AGGREGATOR CUT" },
  { v: "24H", l: "REPLY TIME" },
];

const ENTRIES = [
  {
    href: "/business/projects",
    index: "01",
    title: "Projects",
    copy: "Full case presentations — the problem, the build, a link to the live thing.",
    image: "https://picsum.photos/seed/tariwei-hebron-hotels/900/600",
  },
  {
    href: "/business/pitch-decks",
    index: "02",
    title: "Pitch Decks",
    copy: "The ventures, presented for investors. Real numbers, a direct line.",
    image: "https://picsum.photos/seed/tariwei-deusx/900/600",
  },
  {
    href: "/business/hire-me",
    index: "03",
    title: "Hire Me",
    copy: "Describe your project. Get a rough budget band, then a scoped figure I authorize.",
    image: "https://picsum.photos/seed/tariwei-wayfarian/900/600",
  },
];

export default function BusinessPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main>
        <section className="mx-auto max-w-[1800px] px-4 pt-40 md:px-6 md:pt-48">
          <p className="anim-fade-up font-mono text-[11px] tracking-[0.24em] text-acc">
            REALM · BUSINESS
          </p>
          <h1
            className="anim-fade-up mt-6 font-display font-medium leading-[0.92] tracking-[-0.04em] text-ink"
            style={{ fontSize: "clamp(3rem, 10vw, 9rem)", animationDelay: "0.1s" }}
          >
            Problems in,
            <br />
            products <span className="font-accent italic font-normal">out.</span>
          </h1>
          <p
            className="anim-fade-up mt-8 max-w-xl font-sans text-lg leading-relaxed text-mut"
            style={{ animationDelay: "0.2s" }}
          >
            Solutions, live demos and the numbers that moved. Proof of impact — full case
            presentations with a link straight to the working thing.
          </p>

          <div className="anim-fade-up mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ln bg-ln md:grid-cols-4" style={{ animationDelay: "0.32s" }}>
            {STATS.map((s) => (
              <div key={s.l} className="bg-bg px-5 py-6">
                <div className="font-display text-2xl font-semibold text-ink md:text-4xl">
                  {s.v}
                </div>
                <div className="mt-1 font-mono text-[9.5px] tracking-[0.14em] text-mut">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-[1800px] px-4 md:px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {ENTRIES.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className="group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-2xl border border-ln p-6"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${e.image})`, filter: "grayscale(0.4) brightness(0.5)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />
                <span className="relative font-mono text-[10px] tracking-[0.24em] text-[#f4f3ef]/70">
                  {e.index}
                </span>
                <div className="relative">
                  <h3 className="font-display text-3xl font-medium text-[#f4f3ef] md:text-4xl">
                    {e.title}
                  </h3>
                  <p className="mt-2 max-w-[26ch] font-sans text-[13.5px] leading-relaxed text-[#f4f3ef]/70">
                    {e.copy}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 font-mono text-[10.5px] tracking-[0.2em] text-acc">
                    ENTER <span>→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <AdSpot />
      <SiteFooter />
    </div>
  );
}
