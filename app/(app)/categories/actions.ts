"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { actionFormulaire, actionSimple, type EtatAction } from "@/lib/action";
import { champ } from "@/lib/champs";
import { clientSupabase } from "@/lib/supabase";
import { enregistrerJournal } from "@/lib/journal";
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

    await enregistrerJournal({
      action: "categorie.creation",
      table_cible: "categories",
      ligne_id: resultat.categorie.id,
      details: { nom: d.nom },
    });

    revalidatePath("/categories");
    revalidatePath("/journal");
    return { token: resultat.categorie.id, message: `Catégorie « ${d.nom} » créée.` };
  },
);

export const modifierCategorieAction = actionFormulaire(
  z.object({ id: champ.id, ...champsCategorie }),
  async ({ id, ...champs }) => {
    const resultat = await modifierCategorie(id, champs);
    if (resultat.erreur) return { erreur: resultat.erreur };

    await enregistrerJournal({
      action: "categorie.modification",
      table_cible: "categories",
      ligne_id: id,
      details: { nom: champs.nom },
    });

    revalidatePath("/categories");
    revalidatePath("/journal");
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

    await enregistrerJournal({
      action: "categorie.bascule",
      table_cible: "categories",
      ligne_id: id,
      details: { actif },
    });

    revalidatePath("/categories");
    revalidatePath("/journal");
  },
);

export const supprimerCategorieAction = actionSimple(
  z.object({ id: champ.id }),
  async ({ id }) => {
    const { data: info } = await clientSupabase()
      .from("categories")
      .select("nom")
      .eq("id", id)
      .maybeSingle();

    const resultat = await supprimerCategorie(id);
    if (resultat.erreur) {
      redirect(`/categories?erreur=${encodeURIComponent(resultat.erreur)}`);
    }

    await enregistrerJournal({
      action: "categorie.suppression",
      table_cible: "categories",
      ligne_id: id,
      details: info ? { nom: info.nom } : null,
    });

    revalidatePath("/categories");
    revalidatePath("/journal");
    redirect("/categories?supprime=1");
  },
);