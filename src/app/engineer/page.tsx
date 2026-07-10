import { SiteNav } from "@/components/site-nav";

export default function EngineerPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-6 md:px-10 pt-40 pb-32">
        <p className="font-mono text-[10px] tracking-[0.24em] text-acc">ENGINEER</p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] tracking-tight text-ink">
          What was actually used to build these.
        </h1>
        <p className="mt-6 max-w-xl font-sans text-lg text-mut">
          Stack breakdowns, architecture notes, research, and the hackathons that started
          half of it.
        </p>
      </main>
    </div>
  );
}
