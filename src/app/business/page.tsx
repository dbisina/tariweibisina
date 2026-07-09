import { SiteNav } from "@/components/site-nav";

const LINKS = [
  { label: "Catalog", href: "/business/catalog" },
  { label: "Pitch Decks", href: "/business/pitch-decks" },
  { label: "Hire Me", href: "/business/hire-me" },
  { label: "Contact", href: "/contact" },
];

export default function BusinessPage() {
  return (
    <div className="min-h-screen">
      <SiteNav links={LINKS} />
      <main className="mx-auto max-w-5xl px-6 md:px-10 pt-40 pb-32">
        <p className="font-mono text-[10px] tracking-[0.24em] text-acc">BUSINESS OWNER</p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] tracking-tight text-ink">
          Full case presentations, not just screenshots.
        </h1>
        <p className="mt-6 max-w-xl font-sans text-lg text-mut">
          Every project below gets its own hero, its own story, and a live link to the
          actual thing — not a slide of it.
        </p>
      </main>
    </div>
  );
}
