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

/**
 * Forme canonique pour la recherche : sans accents, sans casse, sans tirets
 * ni espaces. « BPGT70MA » trouve « BP-GT70MA », « developpeur » trouve
 * « Développeur ».
 */
export function normaliser(texte: string | null | undefined): string {
  return (texte ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[\s\-_./]/g, "");
}

/** Vrai si le terme (déjà normalisé) apparaît dans l'un des champs. */
export function correspond(
  termeNormalise: string,
  ...champs: (string | null | undefined)[]
): boolean {
  return !termeNormalise || champs.some((c) => normaliser(c).includes(termeNormalise));
}
