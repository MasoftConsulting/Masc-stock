import type { ReactNode } from "react";

/**
 * Apparition douce (opacité + légère translation), en CSS pur : le contenu
 * rendu par le serveur est visible sans attendre le JavaScript, et
 * l'animation est désactivée si l'utilisateur préfère réduire les
 * animations (voir `.reveler` dans globals.css).
 *
 * `delai` (ms) crée une cascade quand plusieurs blocs sont empilés.
 */
export function Reveler({
  children,
  delai = 0,
}: {
  children: ReactNode;
  delai?: number;
}) {
  return (
    <div className="reveler" style={{ animationDelay: `${delai}ms` }}>
      {children}
    </div>
  );
}
