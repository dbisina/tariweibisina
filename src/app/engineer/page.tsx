import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

const STATS = [
  { v: "9", l: "SYSTEMS SHIPPED" },
  { v: "11+", l: "LANGUAGES" },
  { v: "GPU→WEB", l: "FULL STACK" },
  { v: "2024–25", l: "ACTIVE" },
];

const ENTRIES = [
  {
    href: "/engineer/projects",
    index: "01",
    title: "Projects",
    copy: "The systems, each with full schematics — stacks, architecture, live emulators.",
    image: "https://picsum.photos/seed/tariwei-relay/900/600",
  },
  {
    href: "/engineer/research",
    index: "02",
    title: "Research",
    copy: "Working notes and longer investigations. The thinking behind the shipped work.",
    image: "https://picsum.photos/seed/tariwei-etllm/900/600",
  },
  {
    href: "/engineer/hackathons",
    index: "03",
    title: "Hackathons",
    copy: "A deadline, a team, no time to overthink. Where half of the systems started.",
    image: "https://picsum.photos/seed/tariwei-airfree/900/600",
  },
];

export default function EngineerPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main>
        <section className="mx-auto max-w-6xl px-6 pt-40 md:px-10 md:pt-48">
          <p className="anim-fade-up font-mono text-[11px] tracking-[0.24em] text-acc">
            REALM · ENGINEERING
          </p>
          <h1
            className="anim-fade-up mt-6 font-display font-medium leading-[0.92] tracking-[-0.04em] text-ink"
            style={{ fontSize: "clamp(3rem, 10vw, 9rem)", animationDelay: "0.1s" }}
          >
            What it&apos;s
            <br />
            actually <span className="font-accent italic font-normal">made of.</span>
          </h1>
          <p
            className="anim-fade-up mt-8 max-w-xl font-sans text-lg leading-relaxed text-mut"
            style={{ animationDelay: "0.2s" }}
          >
            Protocols, kernels, system design. Proof of competence — not a portfolio of
            screenshots, but the schematics, the tradeoffs, and the code that ran.
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

        <section className="mx-auto mt-24 max-w-6xl px-6 md:px-10">
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
      <SiteFooter />
    </div>
  );
}
