import "server-only";
import { createAdminClient } from "./supabase";
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

export async function listerProduitsAvecStock(): Promise<ProduitAvecStock[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("stock_actuel")
    .select("*")
    .order("nom");

  if (error) {
    console.error("[produits] listerProduitsAvecStock", error.message);
    return [];
  }

  return (data ?? []).map((ligne) => ({
    id: ligne.id,
    reference: ligne.reference,
    nom: ligne.nom,
    categorie_id: ligne.categorie_id,
    categorie_nom: ligne.categorie_nom,
    description: null,
    seuil_alerte: ligne.seuil_alerte,
    actif: true,
    quantite: ligne.quantite,
    created_at: "",
    updated_at: "",
  })) as ProduitAvecStock[];
}

export async function listerProduitsComplet(): Promise<ProduitAvecStock[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const [produits, stocks] = await Promise.all([
    supabase.from("produits").select("*").order("nom"),
    supabase.from("stock_actuel").select("id, quantite, categorie_nom"),
  ]);

  if (produits.error) {
    console.error("[produits] listerProduitsComplet", produits.error.message);
    return [];
  }

  const mapStock = new Map<
    string,
    { quantite: number; categorie_nom: string | null }
  >();
  for (const s of (stocks.data ?? []) as {
    id: string;
    quantite: number;
    categorie_nom: string | null;
  }[]) {
    mapStock.set(s.id, { quantite: s.quantite, categorie_nom: s.categorie_nom });
  }

  return (produits.data ?? []).map((p) => {
    const stock = mapStock.get(p.id);
    return {
      ...(p as Produit),
      quantite: stock?.quantite ?? 0,
      categorie_nom: stock?.categorie_nom ?? null,
    };
  }) as ProduitAvecStock[];
}

export async function lireProduit(id: string): Promise<Produit | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[produits] lireProduit", error.message);
    return null;
  }
  return (data as Produit) ?? null;
}

/* --------------------------------------------------------------- écriture */

export async function creerProduit(
  champs: ChampsProduit,
): Promise<{ produit: Produit } | { erreur: string }> {
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

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
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

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
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  const { count, error: errCount } = await supabase
    .from("mouvements")
    .select("*", { count: "exact", head: true })
    .eq("produit_id", id);

  if (errCount) return { erreur: errCount.message };
  if ((count ?? 0) > 0) {
    return {
      erreur: `Impossible : ${count} mouvement(s) concernent ce produit. Désactivez-le au lieu de le supprimer.`,
    };
  }

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  return error ? { erreur: error.message } : {};
}