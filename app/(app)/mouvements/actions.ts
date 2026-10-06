"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { actionFormulaire, type EtatAction } from "@/lib/action";
import { champ } from "@/lib/champs";
import {
  creerMouvement,
  validerInventaire,
  annulerMouvement,
} from "@/lib/mouvements";

export type EtatMouvement = EtatAction;

function revaliderStock() {
  revalidatePath("/mouvements");
  revalidatePath("/produits");
  revalidatePath("/");
  revalidatePath("/clients", "layout");
}

const champsCommuns = {
  produit_id: z.uuid({ error: "Sélectionnez un produit." }),
  quantite: champ.entierStrictementPositif("La quantité doit être un entier supérieur à 0."),
  date_mouvement: champ.date,
  note: champ.texteOptionnel,
};

/*
 * Une action par type de mouvement : le type est fixé côté serveur, jamais
 * lu dans le formulaire — un HTML trafiqué ne peut pas changer une entrée
 * en sortie.
 */

export const creerEntreeAction = actionFormulaire(
  z.object({ ...champsCommuns, fournisseur: champ.texteOptionnel }),
  async (d) => {
    const resultat = await creerMouvement({
      ...d,
      type: "entree",
      client_id: null,
    });
    if ("erreur" in resultat) return { erreur: resultat.erreur };

    revaliderStock();
    return {
      token: resultat.mouvement.id,
      message: `Entrée enregistrée : +${d.quantite}.`,
    };
  },
);

export const creerSortieAction = actionFormulaire(
  z.object({
    ...champsCommuns,
    client_id: z.uuid({ error: "Sélectionnez un client." }),
  }),
  async (d) => {
    const resultat = await creerMouvement({
      ...d,
      type: "sortie",
      fournisseur: null,
    });
    if ("erreur" in resultat) return { erreur: resultat.erreur };

    revaliderStock();
    return {
      token: resultat.mouvement.id,
      message: `Sortie enregistrée : −${d.quantite}.`,
    };
  },
);

/**
 * Inventaire complet. Le formulaire envoie un champ `compte_<idProduit>` par
 * produit (vide = non compté) ; l'écart avec le stock réel est calculé par la
 * base au moment de la validation (voir `validerInventaire`).
 */
const PREFIXE_COMPTE = "compte_";

const schemaInventaire = z
  .record(z.string(), z.unknown())
  .transform((champs) => ({
    note: typeof champs.note === "string" ? champs.note.trim() || null : null,
    comptes: Object.entries(champs)
      .filter(([cle, valeur]) => cle.startsWith(PREFIXE_COMPTE) && String(valeur).trim() !== "")
      .map(([cle, valeur]) => ({
        produit_id: cle.slice(PREFIXE_COMPTE.length),
        compte: valeur,
      })),
  }))
  .pipe(
    z.object({
      note: z.string().nullable(),
      comptes: z
        .array(
          z.object({
            produit_id: champ.id,
            compte: champ.entierPositifOuNul(
              "Les quantités comptées doivent être des entiers positifs.",
            ),
          }),
        )
        .min(1, { error: "Aucune quantité saisie." }),
    }),
  );

export const validerInventaireAction = actionFormulaire(
  schemaInventaire,
  async ({ comptes, note }) => {
    const resultat = await validerInventaire(comptes, note);
    if ("erreur" in resultat) return { erreur: resultat.erreur };
    if (resultat.nombre === 0) {
      return { erreur: "Aucun écart avec le stock actuel — rien à ajuster." };
    }

    revaliderStock();
    revalidatePath("/mouvements/inventaire");
    redirect(`/mouvements?inventaire=${resultat.nombre}`);
  },
);

/** Annule un mouvement (ajustement inverse lié à l'original). */
export const annulerMouvementAction = actionFormulaire(
  z.object({
    id: champ.id,
    motif: champ.texte("Indiquez le motif de l'annulation."),
  }),
  async ({ id, motif }) => {
    const resultat = await annulerMouvement(id, motif);
    if (resultat.erreur) return { erreur: resultat.erreur };

    revaliderStock();
    return { token: `${id}-annule`, message: "Mouvement annulé." };
  },
);
