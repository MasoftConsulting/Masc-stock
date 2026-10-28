"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { actionFormulaire, actionSimple, type EtatAction } from "@/lib/action";
import { champ } from "@/lib/champs";
import { clientSupabase } from "@/lib/supabase";
import { enregistrerJournal } from "@/lib/journal";
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

    await enregistrerJournal({
      action: "produit.creation",
      table_cible: "produits",
      ligne_id: resultat.produit.id,
      details: { reference: d.reference, nom: d.nom },
    });

    revalidatePath("/produits");
    revalidatePath("/journal");
    return { token: resultat.produit.id, message: `Produit ${d.reference} créé.` };
  },
);

export const modifierProduitAction = actionFormulaire(
  z.object({ id: champ.id, ...champsProduit }),
  async ({ id, ...champs }) => {
    const resultat = await modifierProduit(id, champs);
    if (resultat.erreur) return { erreur: resultat.erreur };

    await enregistrerJournal({
      action: "produit.modification",
      table_cible: "produits",
      ligne_id: id,
      details: { reference: champs.reference, nom: champs.nom },
    });

    revalidatePath("/produits");
    revalidatePath("/journal");
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

    await enregistrerJournal({
      action: "produit.bascule",
      table_cible: "produits",
      ligne_id: id,
      details: { actif },
    });

    revalidatePath("/produits");
    revalidatePath("/journal");
  },
);

export const supprimerProduitAction = actionSimple(
  z.object({ id: champ.id }),
  async ({ id }) => {
    const { data: info } = await clientSupabase()
      .from("produits")
      .select("reference, nom")
      .eq("id", id)
      .maybeSingle();

    const resultat = await supprimerProduit(id);
    if (resultat.erreur) {
      redirect(`/produits?erreur=${encodeURIComponent(resultat.erreur)}`);
    }

    await enregistrerJournal({
      action: "produit.suppression",
      table_cible: "produits",
      ligne_id: id,
      details: info ? { reference: info.reference, nom: info.nom } : null,
    });

    revalidatePath("/produits");
    revalidatePath("/journal");
    redirect("/produits?supprime=1");
  },
);