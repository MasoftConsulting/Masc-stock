"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { actionFormulaire, actionSimple, type EtatAction } from "@/lib/action";
import { champ } from "@/lib/champs";
import {
  creerProduit,
  modifierProduit,
  supprimerProduit,
} from "@/lib/produits";

export type EtatProduit = EtatAction;

const champsProduit = {
  reference: champ.texte("La référence est obligatoire."),
  nom: champ.texte("Le nom est obligatoire."),
  categorie_id: champ.idOptionnel,
  description: champ.texteOptionnel,
  compatibilite: champ.texteOptionnel,
  seuil_alerte: champ.entierPositifOuNul("Le seuil d'alerte doit être un entier positif."),
};

export const creerProduitAction = actionFormulaire(
  z.object(champsProduit),
  async (d) => {
    const resultat = await creerProduit(d);
    if ("erreur" in resultat) return { erreur: resultat.erreur };

    revalidatePath("/produits");
    return { token: resultat.produit.id, message: `Produit ${d.reference} créé.` };
  },
);

export const modifierProduitAction = actionFormulaire(
  z.object({ id: champ.id, ...champsProduit }),
  async ({ id, ...champs }) => {
    const resultat = await modifierProduit(id, champs);
    if (resultat.erreur) return { erreur: resultat.erreur };

    revalidatePath("/produits");
    return { token: `${id}-${Date.now()}`, message: "Produit enregistré." };
  },
);

export const basculerActifProduitAction = actionSimple(
  z.object({ id: champ.id, actif: champ.booleen }),
  async ({ id, actif }) => {
    const resultat = await modifierProduit(id, { actif });
    if (resultat.erreur) {
      redirect(`/produits?erreur=${encodeURIComponent(resultat.erreur)}`);
    }
    revalidatePath("/produits");
  },
);

export const supprimerProduitAction = actionSimple(
  z.object({ id: champ.id }),
  async ({ id }) => {
    const resultat = await supprimerProduit(id);
    if (resultat.erreur) {
      redirect(`/produits?erreur=${encodeURIComponent(resultat.erreur)}`);
    }

    revalidatePath("/produits");
    redirect("/produits?supprime=1");
  },
);
