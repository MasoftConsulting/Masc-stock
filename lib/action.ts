import "server-only";
import { redirect } from "next/navigation";
import { z } from "zod";
import { lireSession } from "./session";

/**
 * Enveloppes communes aux Server Actions.
 *
 * Chaque action passe par ici : la session est TOUJOURS vérifiée et les
 * champs du formulaire sont validés par un schéma zod avant d'atteindre la
 * logique métier. Une action ne peut donc plus « oublier » le contrôle.
 */

/**
 * État renvoyé aux formulaires `useActionState`.
 *
 * `token` change à chaque succès : le formulaire de création s'en sert comme
 * `key` pour se réinitialiser, celui d'édition pour se fermer.
 */
export type EtatAction = {
  erreur?: string;
  token?: string;
  /** Confirmation affichée en toast après un succès. */
  message?: string;
};

function premiereErreur(erreur: z.ZodError): string {
  return erreur.issues[0]?.message ?? "Formulaire invalide.";
}

/** Action de formulaire branchée sur `useActionState`. */
export function actionFormulaire<S extends z.ZodType>(
  schema: S,
  executer: (donnees: z.output<S>) => Promise<EtatAction>,
) {
  return async (_etat: EtatAction, formData: FormData): Promise<EtatAction> => {
    if (!(await lireSession())) {
      return { erreur: "Session expirée : reconnectez-vous." };
    }

    const resultat = schema.safeParse(Object.fromEntries(formData));
    if (!resultat.success) return { erreur: premiereErreur(resultat.error) };

    return executer(resultat.data);
  };
}

/**
 * Action de bouton (`<form action={...}>` sans état) : bascule, suppression.
 * Sans session, renvoie vers la connexion ; un formulaire invalide est ignoré
 * (il ne peut venir que d'un HTML trafiqué).
 */
export function actionSimple<S extends z.ZodType>(
  schema: S,
  executer: (donnees: z.output<S>) => Promise<void>,
) {
  return async (formData: FormData): Promise<void> => {
    if (!(await lireSession())) redirect("/connexion");

    const resultat = schema.safeParse(Object.fromEntries(formData));
    if (!resultat.success) return;

    await executer(resultat.data);
  };
}
