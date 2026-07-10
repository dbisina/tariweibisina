import type { Metadata } from "next";
import { Rubik, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import { RealmSync } from "@/components/realm-sync";
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
  title: "Daniel Tariwei Bisina",
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
      className={`${rubik.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <RealmSync />
        {children}
      </body>
    </html>
  );
}
