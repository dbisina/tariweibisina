"use client";

import { useState } from "react";
import { Preloader } from "@/components/preloader";
import { RealmSelect } from "@/components/realm-select";
import { AboutHero } from "@/components/about-hero";
import { FeaturedProjects } from "@/components/featured-projects";
import { useSiteStore } from "@/lib/store";

export default function Home() {
  const [preloadDone, setPreloadDone] = useState(false);
  const realm = useSiteStore((s) => s.realm);

  return (
    <div className="min-h-screen">
      {!preloadDone && <Preloader onDone={() => setPreloadDone(true)} />}
      {preloadDone && !realm && <RealmSelect />}
      {preloadDone && realm && (
        <main>
          <AboutHero />
          <FeaturedProjects />
        </main>
      )}
    </div>
  );
}
