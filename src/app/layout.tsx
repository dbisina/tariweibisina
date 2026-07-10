import type { Metadata } from "next";
import { Gabarito, Figtree, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import { RealmSync } from "@/components/realm-sync";
import "./globals.css";

// Rounded-modern pair (Daniel rejected Clash/Switzer, Cabinet/General Sans,
// and Unbounded/Space Grotesk): Gabarito = geometric rounded display,
// Figtree = clean slightly-rounded body. Both load via next/font so a later
// CMS font swap is a one-file change.
const gabarito = Gabarito({
  variable: "--font-gabarito",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
  title: "tariwei — Daniel Tariwei Bisina",
  description:
    "Portfolio of Daniel Tariwei Bisina, polyglot software & AI systems engineer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${gabarito.variable} ${figtree.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <RealmSync />
        {children}
      </body>
    </html>
  );
}
