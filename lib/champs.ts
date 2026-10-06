import { z } from "zod";

/**
 * Champs de formulaire réutilisables (schémas zod).
 *
 * Module pur, sans dépendance serveur : les schémas se testent sans Next.
 */

export const champ = {
  id: z.uuid({ error: "Identifiant invalide." }),

  /** Texte obligatoire, espaces retirés. */
  texte: (message: string) =>
    z.string({ error: message }).trim().min(1, { error: message }),

  /** Texte optionnel : vide ou absent → null. */
  texteOptionnel: z
    .string()
    .optional()
    .transform((v) => v?.trim() || null),

  /** uuid optionnel (liste déroulante avec option vide) → null si vide. */
  idOptionnel: z
    .string()
    .optional()
    .transform((v) => v?.trim() || null)
    .pipe(z.uuid({ error: "Identifiant invalide." }).nullable()),

  /** Entier ≥ 0 ; champ vide → 0. */
  entierPositifOuNul: (message: string) =>
    z.coerce.number({ error: message }).int({ error: message }).min(0, { error: message }),

  /** Entier > 0. */
  entierStrictementPositif: (message: string) =>
    z.coerce.number({ error: message }).int({ error: message }).min(1, { error: message }),

  date: z.iso.date({ error: "Date invalide." }),

  /** Case « 1 » / « 0 » envoyée par un champ caché. */
  booleen: z.enum(["0", "1"]).transform((v) => v === "1"),
};
