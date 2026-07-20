import type { Metadata } from "next";
import { jsonLdScript, serviceJsonLd } from "@/lib/seo";

const TITLE = "Hire Me";
const DESCRIPTION =
  "Tell Daniel Tariwei Bisina what you want built. A quick quote for a ballpark, or a full brief for a scoped figure.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/business/hire-me" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/business/hire-me" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function HireMeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(serviceJsonLd())} />
      {children}
    </>
  );
}
