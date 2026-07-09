import { SiteNav } from "@/components/site-nav";
import { Catalog } from "@/components/catalog";

const LINKS = [
  { label: "Catalog", href: "/business/catalog" },
  { label: "Pitch Decks", href: "/business/pitch-decks" },
  { label: "Hire Me", href: "/business/hire-me" },
  { label: "Contact", href: "/contact" },
];

export default function CatalogPage() {
  return (
    <div className="min-h-screen">
      <SiteNav links={LINKS} />
      <Catalog />
    </div>
  );
}
