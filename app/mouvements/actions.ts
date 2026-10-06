"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { lireSession } from "@/lib/session";
import {
  creerMouvement,
  validerInventaire,
  supprimerMouvement,
} from "@/lib/mouvements";
import type { TypeMouvement } from "@/lib/types-stock";

export type EtatMouvement = { erreur?: string; token?: string };

function texte(formData: FormData, cle: string): string | null {
  const v = String(formData.get(cle) ?? "").trim();
  return v.length > 0 ? v : null;
}

function entier(formData: FormData, cle: string): number | null {
  const v = String(formData.get(cle) ?? "").trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

/**
 * Crée un mouvement d'entrée ou de sortie.
 *
 * Le type est passé en paramètre de l'appel (côté serveur), pas en champ
 * caché du formulaire — c'est plus sûr : un utilisateur qui bricolerait le
 * HTML ne pourrait pas transformer une entrée en sortie.
 */
export async function creerMouvementAction(
  type: TypeMouvement,
  _etat: EtatMouvement,
  formData: FormData,
): Promise<EtatMouvement> {
  const session = await lireSession();
  if (!session) return { erreur: "Non autorisé." };

  const produitId = texte(formData, "produit_id");
  if (!produitId) return { erreur: "Sélectionnez un produit." };

  const quantite = entier(formData, "quantite");
  if (quantite === null || quantite <= 0) {
    return { erreur: "La quantité doit être supérieure à 0." };
  }

  const date = texte(formData, "date_mouvement");
  if (!date) return { erreur: "La date est obligatoire." };

  const resultat = await creerMouvement({
    date_mouvement: date,
    produit_id: produitId,
    type,
    quantite,
    client_id: type === "sortie" ? texte(formData, "client_id") : null,
    fournisseur: type === "entree" ? texte(formData, "fournisseur") : null,
    note: texte(formData, "note"),
  });

  if ("erreur" in resultat) return { erreur: resultat.erreur };

  revalidatePath("/mouvements");
  revalidatePath("/produits");
  revalidatePath("/");
  return { token: `${resultat.mouvement.id}-${Date.now()}` };
}

/**
 * Enregistre un inventaire complet. Le formulaire envoie un champ
 * `compte_<idProduit>` par produit ; l'écart avec le stock réel est calculé
 * par la base au moment de la validation (voir `validerInventaire`).
 */
export async function validerInventaireAction(
  _etat: EtatMouvement,
  formData: FormData,
): Promise<EtatMouvement> {
  const session = await lireSession();
  if (!session) return { erreur: "Non autorisé." };

  const comptes: { produit_id: string; compte: number }[] = [];

  for (const [cle, valeur] of formData.entries()) {
    if (!cle.startsWith("compte_")) continue;
    const brut = String(valeur).trim();
    if (!brut) continue; // Non compté → ignoré

    const compte = Number(brut);
    if (!Number.isInteger(compte) || compte < 0) {
      return { erreur: "Les quantités comptées doivent être des entiers positifs." };
    }
    comptes.push({ produit_id: cle.slice("compte_".length), compte });
  }

  if (comptes.length === 0) {
    return { erreur: "Aucune quantité saisie." };
  }

  const resultat = await validerInventaire(comptes, texte(formData, "note"));
  if ("erreur" in resultat) return { erreur: resultat.erreur };
  if (resultat.nombre === 0) {
    return { erreur: "Aucun écart avec le stock actuel — rien à ajuster." };
  }

  revalidatePath("/mouvements");
  revalidatePath("/produits");
  revalidatePath("/mouvements/inventaire");
  revalidatePath("/");
  redirect(`/mouvements?inventaire=${resultat.nombre}`);
}

export async function supprimerMouvementAction(formData: FormData) {
  const session = await lireSession();
  if (!session) redirect("/connexion");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/mouvements");

  const resultat = await supprimerMouvement(id);
  if (resultat.erreur) {
    redirect(`/mouvements?erreur=${encodeURIComponent(resultat.erreur)}`);
  }

  revalidatePath("/mouvements");
  revalidatePath("/produits");
  revalidatePath("/");
  redirect("/mouvements?supprime=1");
}