import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { CatalogLazy } from "@/components/catalog-lazy";

const TITLE = "Catalog";
const DESCRIPTION =
  "The full, raw catalog of every system and product Daniel Tariwei Bisina has shipped — engineering and business both.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/catalog" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/catalog" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function CatalogPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <CatalogLazy />
    </div>
  );
}
