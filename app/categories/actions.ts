"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { lireSession } from "@/lib/session";
import {
  creerCategorie,
  modifierCategorie,
  supprimerCategorie,
} from "@/lib/categories";

/**
 * Le champ `token` sert de signal de succès unique pour React :
 * chaque appel réussi renvoie un token différent (id de la catégorie).
 * Le formulaire s'en sert comme `key` pour se réinitialiser après création,
 * et le formulaire d'édition pour se fermer après enregistrement.
 */
export type EtatCategorie = { erreur?: string; token?: string };

function texte(formData: FormData, cle: string): string | null {
  const v = String(formData.get(cle) ?? "").trim();
  return v.length > 0 ? v : null;
}

export async function creerCategorieAction(
  _etat: EtatCategorie,
  formData: FormData,
): Promise<EtatCategorie> {
  const session = await lireSession();
  if (!session) return { erreur: "Non autorisé." };

  const nom = texte(formData, "nom");
  if (!nom) return { erreur: "Le nom est obligatoire." };

  const resultat = await creerCategorie({
    nom,
    description: texte(formData, "description"),
  });

  if ("erreur" in resultat) return { erreur: resultat.erreur };

  revalidatePath("/categories");
  return { token: resultat.categorie.id };
}

export async function modifierCategorieAction(
  _etat: EtatCategorie,
  formData: FormData,
): Promise<EtatCategorie> {
  const session = await lireSession();
  if (!session) return { erreur: "Non autorisé." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { erreur: "Catégorie introuvable." };

  const nom = texte(formData, "nom");
  if (!nom) return { erreur: "Le nom est obligatoire." };

  const resultat = await modifierCategorie(id, {
    nom,
    description: texte(formData, "description"),
  });

  if (resultat.erreur) return { erreur: resultat.erreur };

  revalidatePath("/categories");
  return { token: `${id}-${Date.now()}` };
}

export async function basculerActifCategorieAction(formData: FormData) {
  const session = await lireSession();
  if (!session) redirect("/connexion");

  const id = String(formData.get("id") ?? "");
  const actif = formData.get("actif") === "1";
  if (!id) return;

  await modifierCategorie(id, { actif });
  revalidatePath("/categories");
}

export async function supprimerCategorieAction(formData: FormData) {
  const session = await lireSession();
  if (!session) redirect("/connexion");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/categories");

  const resultat = await supprimerCategorie(id);
  if (resultat.erreur) {
    redirect(`/categories?erreur=${encodeURIComponent(resultat.erreur)}`);
  }

  revalidatePath("/categories");
  redirect("/categories?supprime=1");
}