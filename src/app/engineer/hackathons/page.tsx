import { SiteNav } from "@/components/site-nav";
import { HackathonsList } from "./hackathons-list";

/** Hackathon / competition builds — CMS-driven (kind: "hackathon" in
 * /studio), so the roster stays real as Daniel ships more. */
export default function HackathonsPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-[1680px] px-4 pt-40 pb-32 md:px-6">
        <p className="font-mono text-[10px] tracking-[0.24em] text-acc">FOR ENGINEERS</p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,5.5rem)] font-medium leading-[0.95] tracking-tight text-ink">
          Hackathons.
        </h1>
        <p className="mt-6 max-w-xl font-sans text-lg text-mut">
          Where half of the systems started: a deadline, a team, and no time to
          overthink.
        </p>

        <HackathonsList />
      </main>
    </div>
  );
}
