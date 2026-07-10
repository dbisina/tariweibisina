"use client";

import { useEffect, useState } from "react";
import { Preloader } from "@/components/preloader";
import { RealmSelect } from "@/components/realm-select";
import { Welcome } from "@/components/welcome";
import { HomeHero } from "@/components/home-hero";
import { SiteNav } from "@/components/site-nav";
import { useSiteStore } from "@/lib/store";

export default function Home() {
  const [preloadDone, setPreloadDone] = useState(false);
  const [welcomed, setWelcomed] = useState(false);
  const realm = useSiteStore((s) => s.realm);

  // realm/audio are session-only now (never persisted) — a fresh visit always
  // walks preloader -> realm+audio pick -> welcome flip -> home
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
          <HomeHero />
        </main>
      )}
    </div>
  );
}
