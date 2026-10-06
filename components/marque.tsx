import Image from "next/image";

/**
 * Logo MASC.
 *
 * Le fichier source est dans /public/logo.png (ou .svg).
 *
 * `hauteur` fixe la hauteur d'affichage. La largeur s'adapte
 * automatiquement au ratio du logo — un logo carré reste carré,
 * un logo rectangulaire reste rectangulaire, sans jamais être écrasé.
 */
export function Logo({
  hauteur = 48,
  priority = false,
}: {
  hauteur?: number;
  priority?: boolean;
}) {
  // Ratio du fichier source. À ajuster si ton logo n'est pas carré.
  //
  // Pour connaître le ratio : largeur ÷ hauteur.
  // Exemples :
  //   - logo carré 500×500      → ratio = 1
  //   - logo 800×200 (bandeau)  → ratio = 4
  //   - logo 300×150            → ratio = 2
  const ratio = 4; // ← MODIFIE cette valeur

  return (
    <Image
  src="/logo.png"
  alt="MA SOFT CONSULTING"
  height={hauteur}
  width={hauteur * ratio}
  priority={priority}
  loading={priority ? "eager" : "lazy"}
  className="object-contain"
  style={{ height: `${hauteur}px`, width: "auto" }}
/>
  );
}