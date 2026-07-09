"use client";

import { useState } from "react";
import { Preloader } from "@/components/preloader";
import { RealmSelect } from "@/components/realm-select";
import { useSiteStore } from "@/lib/store";

export default function Home() {
  const [preloadDone, setPreloadDone] = useState(false);
  const realm = useSiteStore((s) => s.realm);

  return (
    <div className="min-h-screen">
      {!preloadDone && <Preloader onDone={() => setPreloadDone(true)} />}
      {preloadDone && !realm && <RealmSelect />}
      {preloadDone && realm && (
        <div className="min-h-screen flex items-center justify-center font-mono text-sm text-mut">
          home — realm: {realm}
        </div>
      )}
    </div>
  );
}
