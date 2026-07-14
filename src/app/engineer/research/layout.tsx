import type { Metadata } from "next";

const TITLE = "Research";
const DESCRIPTION =
  "Working notes and longer investigations from Daniel Tariwei Bisina — the unpolished thinking behind the shipped systems.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/engineer/research" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/engineer/research" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
