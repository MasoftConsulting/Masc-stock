"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { actionFormulaire, actionSimple, type EtatAction } from "@/lib/action";
import { champ } from "@/lib/champs";
import {
  creerCategorie,
  modifierCategorie,
  supprimerCategorie,
} from "@/lib/categories";

export type EtatCategorie = EtatAction;

const champsCategorie = {
  nom: champ.texte("Le nom est obligatoire."),
  description: champ.texteOptionnel,
};

export const creerCategorieAction = actionFormulaire(
  z.object(champsCategorie),
  async (d) => {
    const resultat = await creerCategorie(d);
    if ("erreur" in resultat) return { erreur: resultat.erreur };

    revalidatePath("/categories");
    return { token: resultat.categorie.id, message: `Catégorie « ${d.nom} » créée.` };
  },
);

export const modifierCategorieAction = actionFormulaire(
  z.object({ id: champ.id, ...champsCategorie }),
  async ({ id, ...champs }) => {
    const resultat = await modifierCategorie(id, champs);
    if (resultat.erreur) return { erreur: resultat.erreur };

    revalidatePath("/categories");
    return { token: `${id}-${Date.now()}`, message: "Catégorie enregistrée." };
  },
);

export const basculerActifCategorieAction = actionSimple(
  z.object({ id: champ.id, actif: champ.booleen }),
  async ({ id, actif }) => {
    const resultat = await modifierCategorie(id, { actif });
    if (resultat.erreur) {
      redirect(`/categories?erreur=${encodeURIComponent(resultat.erreur)}`);
    }
    revalidatePath("/categories");
  },
);

export const supprimerCategorieAction = actionSimple(
  z.object({ id: champ.id }),
  async ({ id }) => {
    const resultat = await supprimerCategorie(id);
    if (resultat.erreur) {
      redirect(`/categories?erreur=${encodeURIComponent(resultat.erreur)}`);
    }

    revalidatePath("/categories");
    redirect("/categories?supprime=1");
  },
);
