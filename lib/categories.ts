import "server-only";
import { clientSupabase, echecLecture } from "./supabase";
import type { Categorie, CategorieAvecStats } from "./types-stock";

export type { Categorie, CategorieAvecStats };

const TABLE = "categories";

/* ---------------------------------------------------------------- lecture */

export async function listerCategories(): Promise<Categorie[]> {
  const { data, error } = await clientSupabase()
    .from(TABLE)
    .select("*")
    .order("nom");

  if (error) echecLecture("categories", error);
  return data as Categorie[];
}

export async function listerCategoriesAvecStats(): Promise<CategorieAvecStats[]> {
  const [categories, produits] = await Promise.all([
    listerCategories(),
    clientSupabase().from("produits").select("categorie_id").limit(10_000),
  ]);

  if (produits.error) echecLecture("categories/produits", produits.error);

  const compteur = new Map<string, number>();
  for (const p of produits.data as { categorie_id: string | null }[]) {
    if (p.categorie_id) {
      compteur.set(p.categorie_id, (compteur.get(p.categorie_id) ?? 0) + 1);
    }
  }

  return categories.map((c) => ({
    ...c,
    nb_produits: compteur.get(c.id) ?? 0,
  }));
}

/* --------------------------------------------------------------- écriture */

export async function creerCategorie(champs: {
  nom: string;
  description?: string | null;
}): Promise<{ categorie: Categorie } | { erreur: string }> {
  const supabase = clientSupabase();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      nom: champs.nom,
      description: champs.description ?? null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { erreur: "Une catégorie porte déjà ce nom." };
    }
    return { erreur: error.message };
  }
  return { categorie: data as Categorie };
}

export async function modifierCategorie(
  id: string,
  champs: { nom?: string; description?: string | null; actif?: boolean },
): Promise<{ erreur?: string }> {
  const supabase = clientSupabase();

  const { error } = await supabase.from(TABLE).update(champs).eq("id", id);
  if (error) {
    if (error.code === "23505") {
      return { erreur: "Une autre catégorie porte déjà ce nom." };
    }
    return { erreur: error.message };
  }
  return {};
}

export async function supprimerCategorie(id: string): Promise<{ erreur?: string }> {
  const supabase = clientSupabase();

  // La clé étrangère produits → categories est en ON DELETE RESTRICT :
  // c'est la base qui refuse, sans fenêtre entre vérification et suppression.
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error?.code === "23503") {
    return {
      erreur: "Impossible : des produits utilisent cette catégorie. Désactivez-la ou reclassez-les d'abord.",
    };
  }
  return error ? { erreur: error.message } : {};
}