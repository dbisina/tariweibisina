import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ContactForm } from "@/components/contact-form";

const TITLE = "Contact";
const DESCRIPTION =
  "Reach Daniel Tariwei Bisina — email, GitHub, LinkedIn, X, or WhatsApp. Open to projects and roles.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/contact" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/contact" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

const CHANNELS = [
  { label: "EMAIL", value: "danbis664@gmail.com", href: "mailto:danbis664@gmail.com" },
  { label: "GITHUB", value: "github.com/dbisina", href: "https://github.com/dbisina" },
  { label: "LINKEDIN", value: "/in/danielbisina", href: "https://linkedin.com/in/danielbisina" },
  { label: "X", value: "@danielbisina", href: "https://x.com/danielbisina" },
  { label: "WHATSAPP", value: "+234 707 721 3386", href: "https://wa.me/2347077213386" },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-[1800px] px-4 pt-40 md:px-6 md:pt-48">
        <div className="anim-fade-up">
          <p className="font-mono text-[11px] tracking-[0.24em] text-acc">
            CONTACT · OPEN TO PROJECTS &amp; ROLES
          </p>
          <h1
            className="mt-6 font-display font-medium leading-[0.94] tracking-[-0.035em] text-ink"
            style={{ fontSize: "clamp(3rem, 9vw, 8rem)" }}
          >
            Let&apos;s build
            <br />
            something <span className="font-accent italic font-normal">real.</span>
          </h1>
          <p className="mt-8 max-w-xl font-sans text-lg leading-relaxed text-mut">
            A project, a role, or just a good problem — the fastest way to reach me is any
            of the channels below. I read everything and reply.
          </p>
        </div>

        <div className="mt-16 border-t border-ln">
          {CHANNELS.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="group flex items-center justify-between gap-6 border-b border-ln py-6 md:py-7"
            >
              <span className="font-mono text-[10.5px] tracking-[0.2em] text-mut">
                {c.label}
              </span>
              <span className="flex items-center gap-4 font-display text-xl text-ink transition-colors group-hover:text-acc md:text-3xl">
                {c.value}
                <span className="text-acc">↗</span>
              </span>
            </a>
          ))}
          <div className="flex items-center justify-between gap-6 py-6 md:py-7">
            <span className="font-mono text-[10.5px] tracking-[0.2em] text-mut">BASE</span>
            <span className="font-display text-xl text-ink md:text-3xl">
              Nigeria — operating globally
            </span>
          </div>
        </div>

        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
