import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MASC Stock",
  description: "Gestion de stock interne — MA SOFT CONSULTING",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}