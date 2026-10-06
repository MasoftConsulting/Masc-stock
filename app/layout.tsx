import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/** Texte courant : très lisible en petite taille, chiffres tabulaires. */
const texte = Inter({
  subsets: ["latin"],
  variable: "--font-texte",
  display: "swap",
});

/** Titres et grands chiffres (`font-display`). */
const titres = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-titres",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MASC Stock",
  description: "Gestion de stock interne — MA SOFT CONSULTING",
};

export const viewport: Viewport = {
  themeColor: "#f7f6f3",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${texte.variable} ${titres.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
