import type { Equipement } from "./types-stock";

/**
 * Normalise une chaîne pour comparaison :
 * minuscules, sans tirets, espaces, points, underscores.
 * "SHARP-BP50M26" → "sharpbp50m26"
 */
function normaliser(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Convertit un pattern de compatibilité en RegExp.
 * "BP-50Mxx" → /bp50m\w{2}/i
 * "xx" (ou "XX") agit comme wildcard de 2 caractères alphanumériques.
 */
function patternVersRegex(pattern: string): RegExp {
  const normalise = normaliser(pattern);
  const avecWildcards = normalise.replace(/xx/g, "\\w{2}");
  return new RegExp(avecWildcards, "i");
}

/**
 * Découpe la chaîne de compatibilité en patterns individuels.
 * Accepte : virgule, point-virgule, pipe, slash, retour à la ligne.
 */
function extrairePatterns(compatibilite: string): string[] {
  return compatibilite
    .split(/[,;\n\r|/]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Vérifie si UN équipement correspond à la compatibilité d'un produit.
 * - Ignore le préfixe fabricant (SHARP-, CANON-, etc.)
 * - Gère les wildcards "xx"
 * - Insensible à la casse et aux tirets
 */
export function equipementCompatible(
  equipement: Pick<Equipement, "marque_modele">,
  compatibilite: string | null,
): boolean {
  if (!compatibilite || !equipement.marque_modele) return false;

  const modeleNormalise = normaliser(equipement.marque_modele);
  const patterns = extrairePatterns(compatibilite);

  return patterns.some((pattern) => {
    try {
      return patternVersRegex(pattern).test(modeleNormalise);
    } catch {
      return false;
    }
  });
}

/**
 * Vérifie si un produit (via sa compatibilité) est compatible avec
 * AU MOINS UN équipement de la liste fournie.
 */
export function produitCompatibleAvecEquipements(
  compatibilite: string | null,
  equipements: Equipement[],
): boolean {
  if (!compatibilite) return false;
  return equipements.some((e) => equipementCompatible(e, compatibilite));
}