import type { Metadata } from "next";

const TITLE = "Hackathons";
const DESCRIPTION =
  "Where half of Daniel Tariwei Bisina's systems started: a deadline, a team, and no time to overthink.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/engineer/hackathons" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/engineer/hackathons" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function HackathonsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
