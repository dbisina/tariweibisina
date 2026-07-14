import type { Metadata } from "next";

const TITLE = "Case Studies";
const DESCRIPTION =
  "Full case presentations of Daniel Tariwei Bisina's client work — the problem, the build, and a link to the live product.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/business/projects" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/business/projects" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function BusinessProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
