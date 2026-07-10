import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { ALL_PROJECTS } from "@/lib/projects";

const SYSTEMS = ALL_PROJECTS.filter((p) => p.side === "engineering");

export default function EngineerProjectsPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-6 pt-40 pb-32 md:px-10">
        <p className="font-mono text-[10px] tracking-[0.24em] text-acc">
          ENGINEERING — {String(SYSTEMS.length).padStart(2, "0")} SYSTEMS
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,5.5rem)] font-medium leading-[0.95] tracking-tight text-ink">
          The systems.
        </h1>
        <p className="mt-6 max-w-xl font-sans text-lg text-mut">
          What was used to build each one, and why. Full schematics on every page.
        </p>

        <div className="mt-16 border-t border-ln">
          {SYSTEMS.map((p) => (
            <Link
              key={p.slug}
              href={`/projects/${p.slug}`}
              className="group grid grid-cols-[52px_1fr_auto] items-center gap-4 border-b border-ln py-7"
            >
              <span className="font-mono text-xs text-mut">{p.index}</span>
              <span>
                <span className="block font-display text-[clamp(24px,3.2vw,40px)] font-medium leading-[1.05] tracking-tight text-ink transition-colors group-hover:text-acc">
                  {p.name}
                </span>
                <span className="mt-1 block font-mono text-[10.5px] tracking-[0.16em] text-mut">
                  {p.tag}
                </span>
              </span>
              <span className="font-mono text-xs text-acc">OPEN ↗</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
