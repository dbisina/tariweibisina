import type { Metadata } from "next";

const TITLE = "Engineering Projects";
const DESCRIPTION =
  "The systems Daniel Tariwei Bisina has built — what was used, and why. Full schematics on every page.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/engineer/projects" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/engineer/projects" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function EngineerProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
