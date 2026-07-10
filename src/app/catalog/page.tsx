import { SiteNav } from "@/components/site-nav";
import { Catalog } from "@/components/catalog";

export default function CatalogPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <Catalog />
    </div>
  );
}
