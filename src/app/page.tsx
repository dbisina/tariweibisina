"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Preloader } from "@/components/preloader";
import { RealmSelect } from "@/components/realm-select";
import { Welcome } from "@/components/welcome";
import { AboutHero } from "@/components/about-hero";
import { FeaturedProjects } from "@/components/featured-projects";
import { PathSelect } from "@/components/path-select";
import { SiteNav } from "@/components/site-nav";
import { useSiteStore } from "@/lib/store";

export default function Home() {
  const [preloadDone, setPreloadDone] = useState(false);
  const [welcomed, setWelcomed] = useState(false);
  const realm = useSiteStore((s) => s.realm);

  // realm/audio are session-only (never persisted) — every visit walks
  // preloader -> realm+audio pick -> welcome flip -> home
  useEffect(() => {
    if (!realm) setWelcomed(false);
  }, [realm]);

  return (
    <div className="min-h-screen">
      {!preloadDone && <Preloader onDone={() => setPreloadDone(true)} />}
      {preloadDone && !realm && <RealmSelect />}
      {preloadDone && realm && !welcomed && <Welcome onDone={() => setWelcomed(true)} />}
      {preloadDone && realm && (
        <main style={{ visibility: welcomed ? "visible" : "hidden" }}>
          <SiteNav />
          <AboutHero />
          <FeaturedProjects />
          <PathSelect />
          <footer className="border-t border-ln py-8">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 font-mono text-[10.5px] tracking-[0.14em] text-mut md:px-10">
              <span>© 2026 DEUSX TECHNOLOGIES — BUILT BY DANIEL TARIWEI BISINA</span>
              <Link href="/contact" className="text-ink hover:text-acc">
                OPEN TO PROJECTS &amp; ROLES ↗
              </Link>
            </div>
          </footer>
        </main>
      )}
    </div>
  );
}
