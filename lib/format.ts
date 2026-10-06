/**
 * Fonctions de formatage pures, utilisables côté serveur ET côté navigateur.
 *
 * Ce fichier ne dépend d'aucune API serveur : il peut être importé sans
 * risque depuis un Client Component.
 */

/**
 * Formate une date ISO (YYYY-MM-DD ou ISO complet) en français court.
 *
 * Exemple : "2026-10-05" → "05/10/2026"
 * Renvoie "—" si la valeur est vide ou invalide.
 */
export function formaterDate(valeur: string | null | undefined): string {
  if (!valeur) return "—";
  const d = new Date(valeur);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Nombre entier en français (espace insécable pour les milliers). */
export function formaterNombre(valeur: number): string {
  return valeur.toLocaleString("fr-FR");
}
