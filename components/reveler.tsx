"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Révèle son contenu avec un léger effet d'apparition (opacité + translation).
 *
 * `delai` (ms) permet de créer une cascade quand plusieurs Revealer sont
 * empilés verticalement.
 */
export function Reveler({
  children,
  delai = 0,
}: {
  children: ReactNode;
  delai?: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), delai);
    return () => window.clearTimeout(t);
  }, [delai]);

  return (
    <div
      style={{ transitionDelay: `${delai}ms` }}
      className={`transition-all duration-700 ease-mass ${
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}