"use client";

import { useEffect, useState } from "react";
import { Preloader } from "@/components/preloader";
import { RealmSelect } from "@/components/realm-select";
import { Welcome } from "@/components/welcome";
import { AboutHero } from "@/components/about-hero";
import { FeaturedProjects } from "@/components/featured-projects";
import { PathSelect } from "@/components/path-select";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
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
          <SiteFooter />
        </main>
      )}
    </div>
  );
}
