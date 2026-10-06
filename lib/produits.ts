import "server-only";
import { clientSupabase, echecLecture } from "./supabase";
import type {
  Produit,
  ProduitAvecStock,
  ChampsProduit,
} from "./types-stock";

// Réexport des types pour les pages Server Components qui préfèrent
// importer depuis ce module. Les Client Components DOIVENT importer
// depuis `@/lib/types-stock` directement.
export type { Produit, ProduitAvecStock, ChampsProduit };
export { statutStock, type StatutStock } from "./types-stock";

const TABLE = "produits";

/* ---------------------------------------------------------------- lecture */

export async function listerProduitsComplet(): Promise<ProduitAvecStock[]> {
  const supabase = clientSupabase();

  const [produits, stocks] = await Promise.all([
    supabase.from(TABLE).select("*").order("nom"),
    supabase.from("stock_actuel").select("id, quantite, categorie_nom"),
  ]);

  if (produits.error) echecLecture("produits", produits.error);
  // Sans la vue, tous les stocks s'afficheraient à 0 : on ne le tolère pas.
  if (stocks.error) echecLecture("produits/stock_actuel", stocks.error);

  const mapStock = new Map(
    (stocks.data as { id: string; quantite: number; categorie_nom: string | null }[])
      .map((s) => [s.id, s]),
  );

  return (produits.data as Produit[]).map((p) => {
    const stock = mapStock.get(p.id);
    return {
      ...p,
      quantite: stock?.quantite ?? 0,
      categorie_nom: stock?.categorie_nom ?? null,
    };
  });
}

/* --------------------------------------------------------------- écriture */

export async function creerProduit(
  champs: ChampsProduit,
): Promise<{ produit: Produit } | { erreur: string }> {
  const supabase = clientSupabase();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(champs)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { erreur: "Un produit porte déjà cette référence." };
    }
    return { erreur: error.message };
  }
  return { produit: data as Produit };
}

export async function modifierProduit(
  id: string,
  champs: Partial<ChampsProduit & { actif: boolean }>,
): Promise<{ erreur?: string }> {
  const supabase = clientSupabase();

  const { error } = await supabase.from(TABLE).update(champs).eq("id", id);
  if (error) {
    if (error.code === "23505") {
      return { erreur: "Un autre produit porte déjà cette référence." };
    }
    return { erreur: error.message };
  }
  return {};
}

export async function supprimerProduit(id: string): Promise<{ erreur?: string }> {
  const supabase = clientSupabase();

  // La clé étrangère mouvements → produits est en ON DELETE RESTRICT.
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error?.code === "23503") {
    return {
      erreur: "Impossible : des mouvements concernent ce produit. Désactivez-le au lieu de le supprimer.",
    };
  }
  return error ? { erreur: error.message } : {};
}