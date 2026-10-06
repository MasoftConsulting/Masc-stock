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

/**
 * Formate une date ISO avec l'heure en français.
 *
 * Exemple : "2026-10-05T14:32:00Z" → "05/10/2026 à 14:32"
 */
export function formaterDateHeure(valeur: string | null | undefined): string {
  if (!valeur) return "—";
  const d = new Date(valeur);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formate une date en format court (jour + mois).
 * Utilisé dans les listes compactes.
 *
 * Exemple : "2026-10-05" → "05/10"
 */
export function formaterDateCourte(valeur: string | null | undefined): string {
  if (!valeur) return "—";
  const d = new Date(valeur);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
}

/**
 * Retourne les initiales d'un nom (2 lettres max).
 *
 * Exemple : "Mascos Consulting" → "MC"
 *           "Michel"            → "M"
 */
export function initiales(nom: string | null | undefined): string {
  if (!nom) return "—";
  const parts = nom
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}