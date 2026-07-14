import type { Metadata, Viewport } from "next";
import { Rubik, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import { RealmSync } from "@/components/realm-sync";
import { StudioApply } from "@/components/studio-apply";
import { PageTransition } from "@/components/page-transition";
import { Rimuru } from "@/components/rimuru";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { OWNER } from "@/lib/ai/knowledge";
import {
  SITE_URL,
  SITE_NAME,
  SITE_TITLE_DEFAULT,
  SITE_TITLE_TEMPLATE,
  SITE_DESCRIPTION,
  TWITTER_HANDLE,
  jsonLdScript,
  personJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import "./globals.css";

// mauriciojuba.com (Daniel's font reference) runs everything on Rubik
// Variable 300-900 — a rounded modern sans. Same move here: one family,
// weight does the hierarchy work.
const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE_DEFAULT,
    template: SITE_TITLE_TEMPLATE,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Daniel Tariwei Bisina",
    "software engineer",
    "AI systems engineer",
    "GPU kernels",
    "AI-native operating systems",
    "full stack developer",
    "DeusX Technologies",
    "software engineer portfolio",
  ],
  authors: [{ name: OWNER.name, url: SITE_URL }],
  creator: OWNER.name,
  publisher: OWNER.company,
  category: "technology",
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    creator: TWITTER_HANDLE,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: {
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
    { media: "(prefers-color-scheme: light)", color: "#f3f1eb" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${rubik.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(personJsonLd())} />
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(organizationJsonLd())} />
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(websiteJsonLd())} />
        <RealmSync />
        <StudioApply />
        <KeyboardShortcuts />
        <PageTransition>{children}</PageTransition>
        <Rimuru />
      </body>
    </html>
  );
}
