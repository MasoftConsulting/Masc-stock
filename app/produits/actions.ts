"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { lireSession } from "@/lib/session";
import {
  creerProduit,
  modifierProduit,
  supprimerProduit,
  type ChampsProduit,
} from "@/lib/produits";

export type EtatProduit = { erreur?: string; token?: string };

function texte(formData: FormData, cle: string): string | null {
  const v = String(formData.get(cle) ?? "").trim();
  return v.length > 0 ? v : null;
}

function nombre(formData: FormData, cle: string): number {
  const v = Number(formData.get(cle) ?? 0);
  return Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
}

/**
 * Extrait et valide les champs communs aux actions de création et
 * d'édition. Retourne `{ erreur }` si la validation échoue.
 */
function lireChamps(
  formData: FormData,
): ChampsProduit | { erreur: string } {
  const reference = texte(formData, "reference");
  if (!reference) return { erreur: "La référence est obligatoire." };

  const nom = texte(formData, "nom");
  if (!nom) return { erreur: "Le nom est obligatoire." };

  return {
    reference,
    nom,
    categorie_id: texte(formData, "categorie_id"),
    description: texte(formData, "description"),
    seuil_alerte: nombre(formData, "seuil_alerte"),
  };
}

export async function creerProduitAction(
  _etat: EtatProduit,
  formData: FormData,
): Promise<EtatProduit> {
  const session = await lireSession();
  if (!session) return { erreur: "Non autorisé." };

  const champs = lireChamps(formData);
  if ("erreur" in champs) return { erreur: champs.erreur };

  const resultat = await creerProduit(champs);
  if ("erreur" in resultat) return { erreur: resultat.erreur };

  revalidatePath("/produits");
  return { token: resultat.produit.id };
}

export async function modifierProduitAction(
  _etat: EtatProduit,
  formData: FormData,
): Promise<EtatProduit> {
  const session = await lireSession();
  if (!session) return { erreur: "Non autorisé." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { erreur: "Produit introuvable." };

  const champs = lireChamps(formData);
  if ("erreur" in champs) return { erreur: champs.erreur };

  const resultat = await modifierProduit(id, champs);
  if (resultat.erreur) return { erreur: resultat.erreur };

  revalidatePath("/produits");
  return { token: `${id}-${Date.now()}` };
}

export async function basculerActifProduitAction(formData: FormData) {
  const session = await lireSession();
  if (!session) redirect("/connexion");

  const id = String(formData.get("id") ?? "");
  const actif = formData.get("actif") === "1";
  if (!id) return;

  await modifierProduit(id, { actif });
  revalidatePath("/produits");
}

export async function supprimerProduitAction(formData: FormData) {
  const session = await lireSession();
  if (!session) redirect("/connexion");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/produits");

  const resultat = await supprimerProduit(id);
  if (resultat.erreur) {
    redirect(`/produits?erreur=${encodeURIComponent(resultat.erreur)}`);
  }

  revalidatePath("/produits");
  redirect("/produits?supprime=1");
}